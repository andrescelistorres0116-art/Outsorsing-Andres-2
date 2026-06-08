import { PrismaClient, UserRole, EstadoEmpresa, PeriodicidadNomina, ModoFlujoNomina } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const connectionString = process.env.DATABASE_URL!
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  // Clear test data
  await prisma.auditoriaNovedad.deleteMany()
  await prisma.auditoriaEmpleado.deleteMany()
  await prisma.auditoriaReporte.deleteMany()
  await prisma.novedadNomina.deleteMany()
  await prisma.libranza.deleteMany()
  await prisma.reporteNomina.deleteMany()
  await prisma.empleado.deleteMany()
  await prisma.usuarioEmpresa.deleteMany()
  await prisma.logAcceso.deleteMany()
  await prisma.acceso.deleteMany()
  await prisma.obligacionTributaria.deleteMany()
  await prisma.empresa.deleteMany()
  await prisma.user.deleteMany()

  // Create users
  const hashAdmin = await bcrypt.hash('Admin123!', 10)
  const hashContador = await bcrypt.hash('Contador123!', 10)
  const hashCliente = await bcrypt.hash('Cliente123!', 10)

  const admin = await prisma.user.create({
    data: { email: 'admin@test.com', name: 'Admin Test', password: hashAdmin, role: UserRole.ADMIN, isActive: true }
  })
  const contador = await prisma.user.create({
    data: { email: 'contador@test.com', name: 'Contador Test', password: hashContador, role: UserRole.ANALYST, isActive: true }
  })
  const cliente = await prisma.user.create({
    data: { email: 'cliente@test.com', name: 'Cliente Test', password: hashCliente, role: UserRole.CLIENT, isActive: true }
  })

  // Create empresas
  const empresaCompleto = await prisma.empresa.create({
    data: {
      razonSocial: 'Empresa Completo SAS',
      nit: '900111222',
      dv: '3',
      estado: EstadoEmpresa.ACTIVA,
      periodicidadNomina: PeriodicidadNomina.QUINCENAL,
      modoFlujoNomina: ModoFlujoNomina.COMPLETO,
      responsableNominaId: contador.id,
    }
  })
  const empresaSimple = await prisma.empresa.create({
    data: {
      razonSocial: 'Empresa Simple SAS',
      nit: '900333444',
      dv: '5',
      estado: EstadoEmpresa.ACTIVA,
      periodicidadNomina: PeriodicidadNomina.MENSUAL,
      modoFlujoNomina: ModoFlujoNomina.SIMPLE,
      responsableNominaId: contador.id,
    }
  })
  // Third empresa NOT assigned to contador or cliente (for permission testing)
  const empresaAjena = await prisma.empresa.create({
    data: {
      razonSocial: 'Empresa Ajena SAS',
      nit: '900555666',
      dv: '7',
      estado: EstadoEmpresa.ACTIVA,
      periodicidadNomina: PeriodicidadNomina.MENSUAL,
      modoFlujoNomina: ModoFlujoNomina.SIMPLE,
    }
  })

  // Assign contador and cliente to empresaCompleto and empresaSimple only (NOT empresaAjena)
  await prisma.usuarioEmpresa.createMany({
    data: [
      { userId: contador.id, empresaId: empresaCompleto.id },
      { userId: contador.id, empresaId: empresaSimple.id },
      { userId: cliente.id, empresaId: empresaCompleto.id },
    ]
  })

  console.log(JSON.stringify({
    adminId: admin.id,
    contadorId: contador.id,
    clienteId: cliente.id,
    empresaCompletoId: empresaCompleto.id,
    empresaSimpleId: empresaSimple.id,
    empresaAjenaId: empresaAjena.id,
  }, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
