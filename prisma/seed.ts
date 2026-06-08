import 'dotenv/config'
import {
  PrismaClient, UserRole, EstadoEmpresa, TipoAcceso,
  Periodicidad, EstadoObligacion, PeriodicidadNomina, ModoFlujoNomina,
} from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres123@localhost:5432/outsorsing_db',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  console.log('🌱 Seeding database...')

  // ─── Users ───────────────────────────────────────────────
  const adminPass  = await bcrypt.hash('Admin123!',  10)
  const clientPass = await bcrypt.hash('Client123!', 10)

  const admin = await prisma.user.upsert({
    where:  { email: 'admin@contaflow.co' },
    update: {},
    create: { email: 'admin@contaflow.co', name: 'Andrés Torres', password: adminPass, role: UserRole.ADMIN },
  })

  const analista = await prisma.user.upsert({
    where:  { email: 'analista@contaflow.co' },
    update: {},
    create: { email: 'analista@contaflow.co', name: 'María González', password: adminPass, role: UserRole.ANALYST },
  })

  const nominaUser = await prisma.user.upsert({
    where:  { email: 'nomina@contaflow.co' },
    update: {},
    create: { email: 'nomina@contaflow.co', name: 'Carlos Rodríguez', password: adminPass, role: UserRole.NOMINA },
  })

  const clienteXtours = await prisma.user.upsert({
    where:  { email: 'cliente@xtours.com.co' },
    update: {},
    create: { email: 'cliente@xtours.com.co', name: 'Xavier Ospina', password: clientPass, role: UserRole.CLIENT },
  })

  console.log('✅ Users created')

  // ─── Empresas ─────────────────────────────────────────────
  const xtours = await prisma.empresa.upsert({
    where:  { nit: '901234567' },
    update: {},
    create: {
      razonSocial: 'X TOURS SAS', nombreComercial: 'X Tours', nit: '901234567', dv: '8',
      direccion: 'Cra 15 No. 93-47 Of. 301', ciudad: 'Bogotá', departamento: 'Cundinamarca',
      telefono: '6015551234', correo: 'contabilidad@xtours.com.co', estado: EstadoEmpresa.ACTIVA,
      repLegalNombre: 'Xavier Ospina Mora', repLegalCedula: '79543210',
      repLegalCorreo: 'xavier@xtours.com.co', repLegalTelefono: '3001234567',
      regimen: 'Régimen Ordinario', responsabilidadIva: 'Responsable de IVA',
      obligadoFacturar: true, actividadEconomica: '7911 - Actividades de agencias de viajes',
      tipoContribuyente: 'Persona Jurídica', agenteRetenedor: true,
      softwareContable: 'Siigo Nube', tipoNomina: 'Nómina Electrónica DIAN',
      periodicidadNomina: PeriodicidadNomina.MENSUAL,
      modoFlujoNomina: ModoFlujoNomina.COMPLETO,
      tipoFacturacionElectronica: 'Habilitado',
      responsableNominaId: nominaUser.id,
    },
  })

  const diazar = await prisma.empresa.upsert({
    where:  { nit: '800123456' },
    update: {},
    create: {
      razonSocial: 'DIAZAR LTDA', nombreComercial: 'Diazar', nit: '800123456', dv: '1',
      direccion: 'Av. El Dorado No. 69-76 Of. 504', ciudad: 'Bogotá', departamento: 'Cundinamarca',
      telefono: '6015557890', correo: 'gerencia@diazar.com.co', estado: EstadoEmpresa.ACTIVA,
      repLegalNombre: 'Diana Zapata Rivera', repLegalCedula: '51789654',
      repLegalCorreo: 'diana@diazar.com.co', repLegalTelefono: '3109876543',
      regimen: 'SIMPLE', responsabilidadIva: 'No Responsable de IVA',
      obligadoFacturar: true, actividadEconomica: '4641 - Comercio al por mayor de productos textiles',
      tipoContribuyente: 'Persona Jurídica', agenteRetenedor: false,
      softwareContable: 'Contaplus', tipoNomina: 'Nómina Electrónica DIAN',
      periodicidadNomina: PeriodicidadNomina.QUINCENAL,
      modoFlujoNomina: ModoFlujoNomina.COMPLETO,
      tipoFacturacionElectronica: 'Habilitado',
      responsableNominaId: nominaUser.id,
    },
  })

  const tresHilos = await prisma.empresa.upsert({
    where:  { nit: '890765432' },
    update: {},
    create: {
      razonSocial: '300 HILOS SAS', nombreComercial: '300 Hilos', nit: '890765432', dv: '5',
      direccion: 'Calle 80 No. 69B-31 Bodega 12', ciudad: 'Bogotá', departamento: 'Cundinamarca',
      telefono: '6014442211', correo: 'contabilidad@300hilos.com', estado: EstadoEmpresa.ACTIVA,
      repLegalNombre: 'Roberto Hernández Caro', repLegalCedula: '80234567',
      repLegalCorreo: 'roberto@300hilos.com', repLegalTelefono: '3156789012',
      regimen: 'Régimen Ordinario', responsabilidadIva: 'Responsable de IVA',
      obligadoFacturar: true, actividadEconomica: '1311 - Preparación e hilatura de fibras textiles',
      tipoContribuyente: 'Persona Jurídica', agenteRetenedor: true,
      softwareContable: 'World Office', tipoNomina: 'Nómina Electrónica DIAN',
      periodicidadNomina: PeriodicidadNomina.QUINCENAL,
      modoFlujoNomina: ModoFlujoNomina.COMPLETO,
      tipoFacturacionElectronica: 'Habilitado',
      responsableNominaId: nominaUser.id,
    },
  })

  const textilNorte = await prisma.empresa.upsert({
    where:  { nit: '900456789' },
    update: {},
    create: {
      razonSocial: 'TEXTILES DEL NORTE SAS', nombreComercial: 'Textiles Norte', nit: '900456789', dv: '3',
      direccion: 'Cra 43A No. 19-70 Of. 201', ciudad: 'Medellín', departamento: 'Antioquia',
      telefono: '6044321098', correo: 'admin@textilesnorte.com', estado: EstadoEmpresa.ACTIVA,
      repLegalNombre: 'Jorge Cardona Vélez', repLegalCedula: '71345678',
      repLegalCorreo: 'jorge@textilesnorte.com', repLegalTelefono: '3142345678',
      regimen: 'Régimen Ordinario', responsabilidadIva: 'Responsable de IVA',
      obligadoFacturar: false, actividadEconomica: '4641 - Comercio al por mayor textiles',
      tipoContribuyente: 'Persona Jurídica', agenteRetenedor: false,
      softwareContable: 'Siigo Nube', tipoNomina: 'Nómina Electrónica DIAN',
      periodicidadNomina: PeriodicidadNomina.MENSUAL,
      modoFlujoNomina: ModoFlujoNomina.SIMPLE,
      tipoFacturacionElectronica: 'No habilitado',
      responsableNominaId: analista.id,
    },
  })

  const comercializadora = await prisma.empresa.upsert({
    where:  { nit: '901987654' },
    update: {},
    create: {
      razonSocial: 'COMERCIALIZADORA ABC SAS', nombreComercial: 'ComABC', nit: '901987654', dv: '2',
      direccion: 'Cra 7 No. 32-55', ciudad: 'Bogotá', departamento: 'Cundinamarca',
      telefono: '6013334455', correo: 'info@comabc.co', estado: EstadoEmpresa.INACTIVA,
      repLegalNombre: 'Luisa Fernanda Morales', repLegalCedula: '52123456',
      repLegalCorreo: 'luisa@comabc.co', repLegalTelefono: '3001112233',
      regimen: 'SIMPLE', responsabilidadIva: 'No Responsable de IVA',
      obligadoFacturar: false, tipoContribuyente: 'Persona Jurídica', agenteRetenedor: false,
      softwareContable: 'Helisa',
      periodicidadNomina: PeriodicidadNomina.MENSUAL,
      modoFlujoNomina: ModoFlujoNomina.SIMPLE,
    },
  })

  console.log('✅ Empresas created')

  // ─── UsuarioEmpresa assignments ──────────────────────────
  const assignments = [
    { userId: analista.id,       empresaId: xtours.id },
    { userId: analista.id,       empresaId: diazar.id },
    { userId: analista.id,       empresaId: tresHilos.id },
    { userId: analista.id,       empresaId: textilNorte.id },
    { userId: nominaUser.id,     empresaId: xtours.id },
    { userId: nominaUser.id,     empresaId: diazar.id },
    { userId: nominaUser.id,     empresaId: tresHilos.id },
    { userId: clienteXtours.id,  empresaId: xtours.id },
  ]

  for (const a of assignments) {
    await prisma.usuarioEmpresa.upsert({
      where:  { userId_empresaId: a },
      update: {},
      create: a,
    })
  }

  console.log('✅ UsuarioEmpresa assignments created')

  // ─── Accesos ─────────────────────────────────────────────
  const encodePass = (p: string) => Buffer.from(p).toString('base64')

  await prisma.acceso.createMany({
    skipDuplicates: true,
    data: [
      { empresaId: xtours.id,    tipo: TipoAcceso.DIAN,            plataforma: 'DIAN Muisca',                usuario: 'xtours901234@gmail.com',  contrasena: encodePass('Xto@2024#'),     correoAsociado: 'xtours901234@gmail.com', tags: ['DIAN', 'tributario'], createdBy: admin.id },
      { empresaId: xtours.id,    tipo: TipoAcceso.PARAFISCAL,       plataforma: 'MiPlanilla',                 usuario: 'xtours_planilla',          contrasena: encodePass('Planilla2024*'), tags: ['nómina', 'parafiscales'],         createdBy: admin.id },
      { empresaId: xtours.id,    tipo: TipoAcceso.SOFTWARE_CONTABLE, plataforma: 'Siigo Nube',               usuario: 'contabilidad@xtours.com.co', contrasena: encodePass('Siigo#2024'), tags: ['contabilidad'],                   createdBy: admin.id },
      { empresaId: diazar.id,    tipo: TipoAcceso.DIAN,             plataforma: 'DIAN Muisca',                usuario: 'diazar800@hotmail.com',    contrasena: encodePass('Diaz@2024!'),    correoAsociado: 'diazar800@hotmail.com',  tags: ['DIAN', 'tributario'], createdBy: admin.id },
      { empresaId: diazar.id,    tipo: TipoAcceso.HACIENDA,         plataforma: 'Secretaría de Hacienda Bogotá', usuario: 'DIAZAR123',            contrasena: encodePass('Hac2024#'),     municipio: 'Bogotá', tags: ['ICA', 'hacienda'], createdBy: admin.id },
      { empresaId: diazar.id,    tipo: TipoAcceso.BANCO,            banco: 'Banco de Bogotá',                 usuario: '8001234560',               contrasena: encodePass('BogBan@24'),    tags: ['banco', 'pagos'],                 createdBy: admin.id },
      { empresaId: tresHilos.id, tipo: TipoAcceso.DIAN,             plataforma: 'DIAN Muisca',                usuario: 'contabilidad@300hilos.com', contrasena: encodePass('H1l0s#2024'),  correoAsociado: 'contabilidad@300hilos.com', tags: ['DIAN'], createdBy: admin.id },
      { empresaId: tresHilos.id, tipo: TipoAcceso.PARAFISCAL,       plataforma: 'Aportes en Línea',           usuario: '300hilos_apl',             contrasena: encodePass('Apl2024*'),     tags: ['nómina', 'parafiscales'],         createdBy: admin.id },
      { empresaId: tresHilos.id, tipo: TipoAcceso.HACIENDA,         plataforma: 'Secretaría de Hacienda Bogotá', usuario: 'HILOS300_BOG',         contrasena: encodePass('Ica#2024'),     municipio: 'Bogotá', tags: ['ICA'],    createdBy: admin.id },
    ],
  })

  console.log('✅ Accesos created')

  // ─── Obligaciones ────────────────────────────────────────
  const now = new Date('2026-06-08')
  const d = (days: number) => { const dt = new Date(now); dt.setDate(dt.getDate() + days); return dt }

  await prisma.obligacionTributaria.createMany({
    skipDuplicates: true,
    data: [
      { empresaId: xtours.id,       tipoObligacion: 'Retención en la Fuente',       periodicidad: Periodicidad.MENSUAL,    periodo: '5', año: 2026, fechaVencimiento: d(5),  estado: EstadoObligacion.PENDIENTE,   municipio: 'Nacional', responsableId: analista.id },
      { empresaId: xtours.id,       tipoObligacion: 'IVA Bimestral',                periodicidad: Periodicidad.BIMESTRAL,  periodo: '3', año: 2026, fechaVencimiento: d(12), estado: EstadoObligacion.EN_PROCESO,  municipio: 'Nacional', responsableId: analista.id },
      { empresaId: xtours.id,       tipoObligacion: 'Nómina Electrónica',           periodicidad: Periodicidad.MENSUAL,    periodo: '5', año: 2026, fechaVencimiento: d(8),  estado: EstadoObligacion.PENDIENTE,   municipio: 'Nacional', responsableId: nominaUser.id },
      { empresaId: xtours.id,       tipoObligacion: 'Seguridad Social',             periodicidad: Periodicidad.MENSUAL,    periodo: '5', año: 2026, fechaVencimiento: d(2),  estado: EstadoObligacion.PENDIENTE,   municipio: 'Nacional', responsableId: nominaUser.id },
      { empresaId: diazar.id,       tipoObligacion: 'Anticipo SIMPLE Bimestral',    periodicidad: Periodicidad.BIMESTRAL,  periodo: '3', año: 2026, fechaVencimiento: d(6),  estado: EstadoObligacion.PENDIENTE,   municipio: 'Nacional', responsableId: analista.id },
      { empresaId: diazar.id,       tipoObligacion: 'ICA Bogotá',                   periodicidad: Periodicidad.BIMESTRAL,  periodo: '3', año: 2026, fechaVencimiento: d(15), estado: EstadoObligacion.PENDIENTE,   municipio: 'Bogotá',   responsableId: analista.id },
      { empresaId: diazar.id,       tipoObligacion: 'Nómina Electrónica',           periodicidad: Periodicidad.MENSUAL,    periodo: '5', año: 2026, fechaVencimiento: d(8),  estado: EstadoObligacion.PRESENTADO,  municipio: 'Nacional', responsableId: nominaUser.id },
      { empresaId: diazar.id,       tipoObligacion: 'Retención en la Fuente',       periodicidad: Periodicidad.MENSUAL,    periodo: '5', año: 2026, fechaVencimiento: d(-2), estado: EstadoObligacion.VENCIDO,      municipio: 'Nacional', responsableId: analista.id },
      { empresaId: diazar.id,       tipoObligacion: 'Renovación Cámara de Comercio', periodicidad: Periodicidad.ANUAL,     periodo: '1', año: 2026, fechaVencimiento: d(30), estado: EstadoObligacion.PENDIENTE,   municipio: 'Bogotá' },
      { empresaId: tresHilos.id,    tipoObligacion: 'Retención en la Fuente',       periodicidad: Periodicidad.MENSUAL,    periodo: '5', año: 2026, fechaVencimiento: d(5),  estado: EstadoObligacion.PAGADO,       municipio: 'Nacional', responsableId: analista.id },
      { empresaId: tresHilos.id,    tipoObligacion: 'IVA Mensual',                  periodicidad: Periodicidad.MENSUAL,    periodo: '5', año: 2026, fechaVencimiento: d(5),  estado: EstadoObligacion.PENDIENTE,   municipio: 'Nacional', responsableId: analista.id },
      { empresaId: tresHilos.id,    tipoObligacion: 'ICA Bogotá',                   periodicidad: Periodicidad.BIMESTRAL,  periodo: '3', año: 2026, fechaVencimiento: d(16), estado: EstadoObligacion.PENDIENTE,   municipio: 'Bogotá',   responsableId: analista.id },
      { empresaId: tresHilos.id,    tipoObligacion: 'Seguridad Social',             periodicidad: Periodicidad.MENSUAL,    periodo: '5', año: 2026, fechaVencimiento: d(2),  estado: EstadoObligacion.EN_PROCESO,  municipio: 'Nacional', responsableId: nominaUser.id },
      { empresaId: tresHilos.id,    tipoObligacion: 'Nómina Electrónica',           periodicidad: Periodicidad.MENSUAL,    periodo: '5', año: 2026, fechaVencimiento: d(8),  estado: EstadoObligacion.PENDIENTE,   municipio: 'Nacional', responsableId: nominaUser.id },
      { empresaId: textilNorte.id,  tipoObligacion: 'Retención en la Fuente',       periodicidad: Periodicidad.MENSUAL,    periodo: '5', año: 2026, fechaVencimiento: d(5),  estado: EstadoObligacion.PENDIENTE,   municipio: 'Nacional', responsableId: analista.id },
      { empresaId: textilNorte.id,  tipoObligacion: 'IVA Bimestral',                periodicidad: Periodicidad.BIMESTRAL,  periodo: '3', año: 2026, fechaVencimiento: d(12), estado: EstadoObligacion.PENDIENTE,   municipio: 'Nacional', responsableId: analista.id },
    ],
  })

  console.log('✅ Obligaciones created')

  // ─── Empleados 300 HILOS ──────────────────────────────────
  const empleados300 = [
    { tipoDocumento: 'CC', numeroDocumento: '52107968',  nombre: 'DÍAZ MONTERROSO LUZ MARINA',        ciudad: 'Bogotá' },
    { tipoDocumento: 'CC', numeroDocumento: '1015419117', nombre: 'COLÓN TORRES ANDRES FELIPE',        ciudad: 'Bogotá' },
    { tipoDocumento: 'CC', numeroDocumento: '1015623080', nombre: 'MELO FONSECA ETA VANESSA',          ciudad: 'Bogotá' },
    { tipoDocumento: 'CC', numeroDocumento: '1014134193', nombre: 'GARZÓN URREGO JOYENTH ANGÉLICA',    ciudad: 'Bogotá' },
    { tipoDocumento: 'CC', numeroDocumento: '80402490',   nombre: 'MIRABUENA COLLAZOS JHON',           ciudad: 'Bogotá' },
    { tipoDocumento: 'CC', numeroDocumento: '52321205',   nombre: 'MANCÍA NIÑO PILAR',                 ciudad: 'Bogotá' },
    { tipoDocumento: 'CC', numeroDocumento: '1032321201', nombre: 'CORTÉS UNICA JINNSY',               ciudad: 'Bogotá' },
    { tipoDocumento: 'CC', numeroDocumento: '1019190730', nombre: 'HERNÁNDEZ SANABRIA ÁNGELA MILENA',  ciudad: 'Bogotá' },
    { tipoDocumento: 'CC', numeroDocumento: '1026739725', nombre: 'GARZÓN LOMBANA MARÍA ALEJANDRA',    ciudad: 'Bogotá' },
    { tipoDocumento: 'CC', numeroDocumento: '1014186120', nombre: 'QUINTERO TRIANA ÁNGELA PATRICIA',   ciudad: 'Bogotá' },
  ]

  for (const emp of empleados300) {
    await prisma.empleado.upsert({
      where:  { empresaId_numeroDocumento: { empresaId: tresHilos.id, numeroDocumento: emp.numeroDocumento } },
      update: {},
      create: { ...emp, empresaId: tresHilos.id },
    })
  }

  console.log('✅ Empleados created')
  console.log('\n🎉 Seed completado exitosamente!')
  console.log('\n📋 Credenciales de acceso:')
  console.log('   Admin:    admin@contaflow.co     / Admin123!')
  console.log('   Analista: analista@contaflow.co  / Admin123!')
  console.log('   Nómina:   nomina@contaflow.co    / Admin123!')
  console.log('   Cliente:  cliente@xtours.com.co  / Client123!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
