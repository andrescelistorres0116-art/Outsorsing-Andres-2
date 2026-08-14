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

/**
 * Seed default Estado de Resultados classification exceptions.
 * Uses upsert so it's idempotent; only adds exceptions for companies that
 * match by razonSocial / NIT patterns defined below.
 */
async function seedEstadoResultadosExcepciones(prisma) {
  const EMPRESA_EXCEPCIONES = [
    {
      // Inversiones Diazar S.A.S. — accounts 428xxxxx are operational income
      razonSocialContiene: 'Diazar',
      excepciones: [
        {
          prefijoCuenta:    '428',
          categoriaOriginal: 'ingresos_no_operacionales',
          categoriaDestino:  'ingresos_operacionales',
          descripcion:       'Cuenta 428xxxxx clasificada como ingreso operacional para esta empresa',
        },
      ],
    },
  ]

  for (const entry of EMPRESA_EXCEPCIONES) {
    const empresa = await prisma.empresa.findFirst({
      where: {
        razonSocial: { contains: entry.razonSocialContiene, mode: 'insensitive' },
      },
      select: { id: true, razonSocial: true },
    })
    if (!empresa) {
      console.log(`[init] EstadoResultados seed: empresa "${entry.razonSocialContiene}" not found — skipping`)
      continue
    }
    for (const exc of entry.excepciones) {
      await prisma.estadoResultadosExcepcion.upsert({
        where: { empresaId_prefijoCuenta: { empresaId: empresa.id, prefijoCuenta: exc.prefijoCuenta } },
        update: { categoriaDestino: exc.categoriaDestino, descripcion: exc.descripcion },
        create: { empresaId: empresa.id, ...exc },
      })
    }
    console.log(`[init] EstadoResultados seed: ${entry.excepciones.length} excepcion(es) para "${empresa.razonSocial}" ✓`)
  }
}

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
    // ── 1. Garantizar que siempre exista al menos un usuario ADMIN ───────────
    // Si ya hay un admin, no se toca nada. Si no hay ninguno (DB vacía o todos
    // los usuarios son contadores/clientes), se crea/restaura el admin por defecto
    // sin modificar contraseñas de cuentas existentes.
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } })
    if (adminCount === 0) {
      console.log('[init] No admin users found — creating/restoring default admin...')
      const adminHash = await bcrypt.hash('Admin123!', 10)
      await prisma.user.upsert({
        where: { email: 'admin@contaflow.co' },
        // Only restore the role — never change the password of an existing account
        update: { role: 'ADMIN', isActive: true },
        create: {
          email: 'admin@contaflow.co',
          name: 'Administrador',
          password: adminHash,
          role: 'ADMIN',
          isActive: true,
        },
      })
      console.log('[init] Default admin ready: admin@contaflow.co / Admin123! (use this to log in and assign admin role to your account)')
    } else {
      console.log(`[init] ${adminCount} admin user(s) found — skipping admin seed`)
    }

    // ── 2. Reportes del mes actual ────────────────────────────────────────────
    await generarReportesActuales(prisma)

    // ── 3. Estado de Resultados — excepciones por empresa ─────────────────────
    await seedEstadoResultadosExcepciones(prisma)

  } catch (err) {
    console.error('[init] Seed error:', err.message)
  } finally {
    await prisma.$disconnect()
  }
}

run()
