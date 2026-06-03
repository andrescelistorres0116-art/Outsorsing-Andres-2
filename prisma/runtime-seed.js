// Runs at app startup. Uses upsert so it's safe to run on every restart.
// Always ensures the default users exist with the correct passwords.
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const bcrypt = require('bcryptjs')

async function run() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.log('[init] DATABASE_URL not set, skipping seed')
    return
  }

  const adapter = new PrismaPg({ connectionString })
  const prisma = new PrismaClient({ adapter })

  try {
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
  } catch (err) {
    console.error('[init] Seed error:', err.message)
  } finally {
    await prisma.$disconnect()
  }
}

run()
