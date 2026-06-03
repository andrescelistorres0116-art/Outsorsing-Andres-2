// Runs at app startup to ensure the database has at least the admin user.
// Uses plain CommonJS so no ts-node is needed at runtime.
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
    const count = await prisma.user.count()
    if (count > 0) {
      console.log(`[init] Database already has ${count} user(s), skipping seed`)
      return
    }

    console.log('[init] No users found, creating initial users...')

    const adminHash = await bcrypt.hash('Admin123!', 10)
    const clientHash = await bcrypt.hash('Client123!', 10)

    await prisma.user.createMany({
      data: [
        { email: 'admin@contaflow.co',     name: 'Andrés Torres',    password: adminHash,  role: 'ADMIN'   },
        { email: 'analista@contaflow.co',  name: 'María González',   password: adminHash,  role: 'ANALYST' },
        { email: 'nomina@contaflow.co',    name: 'Carlos Rodríguez', password: adminHash,  role: 'NOMINA'  },
        { email: 'cliente@xtours.com.co',  name: 'Cliente X Tours',  password: clientHash, role: 'CLIENT'  },
      ],
    })

    console.log('[init] Initial users created successfully')
  } catch (err) {
    console.error('[init] Seed error:', err.message)
  } finally {
    await prisma.$disconnect()
  }
}

run()
