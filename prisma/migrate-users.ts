import 'dotenv/config'
import { PrismaClient, UserRole } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import * as fs from 'fs'
import * as path from 'path'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  const dataDir = path.join(process.cwd(), '.data')
  const usersPath = path.join(dataDir, 'users.json')

  if (!fs.existsSync(usersPath)) {
    console.log('No users.json found, creating default admin user')
    const hash = await bcrypt.hash('Admin2026!', 10)
    const admin = await prisma.user.upsert({
      where: { email: 'admin@contaflow.co' },
      update: {},
      create: {
        email: 'admin@contaflow.co',
        name: 'Administrador',
        password: hash,
        role: UserRole.ADMIN,
        isActive: true,
      }
    })
    console.log('Created admin:', admin.id, admin.email)
    return
  }

  const rawUsers = JSON.parse(fs.readFileSync(usersPath, 'utf-8'))

  for (const u of rawUsers) {
    const role = u.role === 'admin' ? UserRole.ADMIN
               : u.role === 'contador' ? UserRole.ANALYST
               : UserRole.CLIENT

    const hash = await bcrypt.hash(u.password || 'Temp2026!', 10)

    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.nombre || u.name || u.email, role, isActive: u.activo ?? true },
      create: {
        email: u.email,
        name: u.nombre || u.name || u.email,
        password: hash,
        role,
        isActive: u.activo ?? true,
      }
    })
    console.log(`User: ${user.email} (${user.role}) → ${user.id}`)

    if (u.empresaIds && u.empresaIds.length > 0) {
      const empresas = await prisma.empresa.findMany({ select: { id: true, nit: true, razonSocial: true } })
      console.log('  Available empresas:', empresas.length)
      // Cannot reliably map numeric IDs → Prisma CUIDs without more context.
      // UsuarioEmpresa will be managed through the usuarios UI after migration.
    }
  }
  console.log('Migration complete')
}

main().catch(console.error).finally(() => prisma.$disconnect())
