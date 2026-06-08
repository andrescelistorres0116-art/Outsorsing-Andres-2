// Runs at app startup. Uses upsert so it's safe to run on every restart.
// Always ensures the default users exist and generates nomina reports for
// the current month for all active companies.
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const bcrypt = require('bcryptjs')

// ── Helpers (mirrors src/lib/generar-nominas.ts in CommonJS) ─────────────────

function lastDayOfMonth(year, month) {
  return new Date(year, month, 0).getDate() // month is 1-based
}

function pad(n) {
  return String(n).padStart(2, '0')
}

function periodDates(año, mes, periodo) {
  const last = lastDayOfMonth(año, mes)
  const m = pad(mes)
  if (periodo === 'PRIMERA_QUINCENA') {
    return {
      fechaInicioPeriodo: new Date(`${año}-${m}-01`),
      fechaFinPeriodo:    new Date(`${año}-${m}-15`),
    }
  }
  if (periodo === 'SEGUNDA_QUINCENA') {
    return {
      fechaInicioPeriodo: new Date(`${año}-${m}-16`),
      fechaFinPeriodo:    new Date(`${año}-${m}-${pad(last)}`),
    }
  }
  return {
    fechaInicioPeriodo: new Date(`${año}-${m}-01`),
    fechaFinPeriodo:    new Date(`${año}-${m}-${pad(last)}`),
  }
}

function periodosDePeriodicidad(periodicidad) {
  return periodicidad === 'QUINCENAL'
    ? ['PRIMERA_QUINCENA', 'SEGUNDA_QUINCENA']
    : ['MENSUAL']
}

async function generarReportesActuales(prisma) {
  const now = new Date()
  const mes = now.getMonth() + 1 // 1-based
  const año = now.getFullYear()

  const empresas = await prisma.empresa.findMany({
    where: { estado: 'ACTIVA', periodicidadNomina: { not: null } },
    select: { id: true, periodicidadNomina: true },
  })

  let creados = 0
  let omitidos = 0

  for (const empresa of empresas) {
    if (!empresa.periodicidadNomina) continue
    for (const periodo of periodosDePeriodicidad(empresa.periodicidadNomina)) {
      try {
        await prisma.reporteNomina.create({
          data: {
            empresaId: empresa.id,
            periodo,
            mes,
            año,
            estado: 'BORRADOR',
            sinNovedades: false,
            ...periodDates(año, mes, periodo),
          },
        })
        creados++
      } catch (e) {
        if (e?.code === 'P2002') omitidos++ // ya existe — OK
        else console.error(`[init] Error al crear reporte empresa=${empresa.id}:`, e?.message)
      }
    }
  }

  console.log(`[init] Reportes ${mes}/${año}: ${creados} creados, ${omitidos} ya existían`)
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.log('[init] DATABASE_URL not set, skipping seed')
    return
  }

  const isProduction = process.env.NODE_ENV === 'production'
  const poolConfig = isProduction
    ? { connectionString, ssl: { rejectUnauthorized: false } }
    : { connectionString }
  const adapter = new PrismaPg(poolConfig)
  const prisma = new PrismaClient({ adapter })

  try {
    // ── 1. Usuarios por defecto ───────────────────────────────────────────────
    console.log('[init] Ensuring default users exist with correct passwords...')

    const adminHash  = await bcrypt.hash('Admin123!',  10)
    const clientHash = await bcrypt.hash('Client123!', 10)

    const users = [
      { email: 'admin@contaflow.co',    name: 'Andrés Torres',    password: adminHash,  role: 'ADMIN'   },
      { email: 'analista@contaflow.co', name: 'María González',   password: adminHash,  role: 'ANALYST' },
      { email: 'nomina@contaflow.co',   name: 'Carlos Rodríguez', password: adminHash,  role: 'NOMINA'  },
      { email: 'cliente@xtours.com.co', name: 'Cliente X Tours',  password: clientHash, role: 'CLIENT'  },
    ]

    for (const u of users) {
      await prisma.user.upsert({
        where:  { email: u.email },
        update: { password: u.password, isActive: true },
        create: { ...u, isActive: true },
      })
    }

    console.log('[init] Default users ready')

    // ── 2. Reportes del mes actual ────────────────────────────────────────────
    await generarReportesActuales(prisma)

  } catch (err) {
    console.error('[init] Seed error:', err.message)
  } finally {
    await prisma.$disconnect()
  }
}

run()
