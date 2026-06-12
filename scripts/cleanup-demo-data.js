#!/usr/bin/env node
/**
 * One-time cleanup: removes all seeded demo records from the database.
 * Identifies records by the well-known NITs and email addresses used in seed.ts.
 * Run with: node scripts/cleanup-demo-data.js
 */
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')

const DEMO_NITS = ['901234567', '800123456', '890765432', '900456789', '901987654']
const DEMO_EMAILS = [
  'admin@contaflow.co',
  'analista@contaflow.co',
  'nomina@contaflow.co',
  'cliente@xtours.com.co',
]

async function run() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('DATABASE_URL not set')
    process.exit(1)
  }

  const isProduction = process.env.NODE_ENV === 'production'
  const poolConfig = isProduction
    ? { connectionString, ssl: { rejectUnauthorized: false } }
    : { connectionString }

  const { Pool } = require('pg')
  const pool = new Pool(poolConfig)
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  try {
    // 1. Find demo company IDs
    const demoEmpresas = await prisma.empresa.findMany({
      where: { nit: { in: DEMO_NITS } },
      select: { id: true, razonSocial: true, nit: true },
    })

    const demoEmpresaIds = demoEmpresas.map((e) => e.id)
    console.log(`\nEmpresas demo encontradas (${demoEmpresas.length}):`)
    demoEmpresas.forEach((e) => console.log(`  - ${e.razonSocial} (NIT: ${e.nit})`))

    if (demoEmpresaIds.length > 0) {
      // 2. Delete audit records for demo obligations
      const auditDel = await prisma.auditoriaObligacion.deleteMany({
        where: { obligacion: { empresaId: { in: demoEmpresaIds } } },
      })
      console.log(`\nAuditorías eliminadas: ${auditDel.count}`)

      // 3. Delete demo obligations
      const oblDel = await prisma.obligacionTributaria.deleteMany({
        where: { empresaId: { in: demoEmpresaIds } },
      })
      console.log(`Obligaciones eliminadas: ${oblDel.count}`)

      // 4. Delete demo employees
      const empDel = await prisma.empleado.deleteMany({
        where: { empresaId: { in: demoEmpresaIds } },
      })
      console.log(`Empleados eliminados: ${empDel.count}`)

      // 5. Delete demo accesos (Prisma model)
      const accDel = await prisma.acceso.deleteMany({
        where: { empresaId: { in: demoEmpresaIds } },
      })
      console.log(`Accesos (DB) eliminados: ${accDel.count}`)

      // 6. Delete nomina reports
      const nomDel = await prisma.reporteNomina.deleteMany({
        where: { empresaId: { in: demoEmpresaIds } },
      })
      console.log(`Reportes de nómina eliminados: ${nomDel.count}`)

      // 7. Delete usuario-empresa assignments
      const ueDel = await prisma.usuarioEmpresa.deleteMany({
        where: { empresaId: { in: demoEmpresaIds } },
      })
      console.log(`Asignaciones usuario-empresa eliminadas: ${ueDel.count}`)

      // 8. Delete demo companies
      const cmpDel = await prisma.empresa.deleteMany({
        where: { id: { in: demoEmpresaIds } },
      })
      console.log(`Empresas eliminadas: ${cmpDel.count}`)
    }

    // 9. Find demo users
    const demoUsers = await prisma.user.findMany({
      where: { email: { in: DEMO_EMAILS } },
      select: { id: true, email: true, name: true },
    })

    console.log(`\nUsuarios demo encontrados (${demoUsers.length}):`)
    demoUsers.forEach((u) => console.log(`  - ${u.name} <${u.email}>`))

    // Safety: do not delete users if they are the only ones in the system
    const totalUsers = await prisma.user.count()
    const nonDemoCount = totalUsers - demoUsers.length

    if (demoUsers.length > 0) {
      if (nonDemoCount === 0) {
        console.log('\n⚠️  ADVERTENCIA: Solo existen usuarios demo en la base de datos.')
        console.log('   No se eliminarán para evitar perder el acceso al sistema.')
        console.log('   Crea un usuario real desde la sección Usuarios antes de volver a ejecutar este script.')
      } else {
        // Delete audit records created by demo users
        await prisma.auditoriaObligacion.deleteMany({
          where: { realizadoPorId: { in: demoUsers.map((u) => u.id) } },
        })

        // Delete usuario-empresa assignments for demo users
        await prisma.usuarioEmpresa.deleteMany({
          where: { userId: { in: demoUsers.map((u) => u.id) } },
        })

        const usrDel = await prisma.user.deleteMany({
          where: { email: { in: DEMO_EMAILS } },
        })
        console.log(`Usuarios eliminados: ${usrDel.count}`)
      }
    }

    console.log('\n✅ Limpieza completada. La base de datos ya no contiene datos demo.\n')
  } catch (err) {
    console.error('Error durante la limpieza:', err.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

run()
