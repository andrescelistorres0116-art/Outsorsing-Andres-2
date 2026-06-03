-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'ANALYST', 'NOMINA', 'CLIENT');

-- CreateEnum
CREATE TYPE "EstadoEmpresa" AS ENUM ('ACTIVA', 'INACTIVA');

-- CreateEnum
CREATE TYPE "TipoAcceso" AS ENUM ('DIAN', 'HACIENDA', 'PARAFISCAL', 'BANCO', 'CAMARA', 'UGPP', 'SUPERSOCIEDADES', 'SOFTWARE_CONTABLE', 'FACTURACION', 'FIRMA_DIGITAL', 'OTRO');

-- CreateEnum
CREATE TYPE "Periodicidad" AS ENUM ('MENSUAL', 'BIMESTRAL', 'TRIMESTRAL', 'CUATRIMESTRAL', 'SEMESTRAL', 'ANUAL', 'UNICA');

-- CreateEnum
CREATE TYPE "EstadoObligacion" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'PRESENTADO', 'PAGADO', 'VENCIDO');

-- CreateEnum
CREATE TYPE "PeriodoNomina" AS ENUM ('PRIMERA_QUINCENA', 'SEGUNDA_QUINCENA');

-- CreateEnum
CREATE TYPE "TipoNovedad" AS ENUM ('HORAS_EXTRAS', 'RECARGOS', 'BONIFICACIONES', 'COMISIONES', 'INCAPACIDAD', 'LICENCIA', 'VACACIONES', 'LIBRANZA', 'EMBARGO', 'INGRESO', 'RETIRO', 'LLEGADA_TARDE', 'AUSENCIA', 'OTRA');

-- CreateEnum
CREATE TYPE "EstadoReporteNomina" AS ENUM ('BORRADOR', 'ENVIADO', 'REVISADO', 'APROBADO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CLIENT',
    "companyId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "nombreComercial" TEXT,
    "nit" TEXT NOT NULL,
    "dv" TEXT NOT NULL,
    "direccion" TEXT,
    "ciudad" TEXT,
    "departamento" TEXT,
    "telefono" TEXT,
    "correo" TEXT,
    "estado" "EstadoEmpresa" NOT NULL DEFAULT 'ACTIVA',
    "repLegalNombre" TEXT,
    "repLegalCedula" TEXT,
    "repLegalCorreo" TEXT,
    "repLegalTelefono" TEXT,
    "regimen" TEXT,
    "responsabilidadIva" TEXT,
    "obligadoFacturar" BOOLEAN NOT NULL DEFAULT false,
    "resolucionFacturacion" TEXT,
    "fechaVencimientoResolucion" TIMESTAMP(3),
    "actividadEconomica" TEXT,
    "tipoContribuyente" TEXT,
    "agenteRetenedor" BOOLEAN NOT NULL DEFAULT false,
    "softwareContable" TEXT,
    "tipoNomina" TEXT,
    "periodicidadNomina" TEXT,
    "tipoFacturacionElectronica" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Acceso" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "tipo" "TipoAcceso" NOT NULL,
    "plataforma" TEXT,
    "usuario" TEXT,
    "contrasena" TEXT,
    "correoAsociado" TEXT,
    "preguntasSeguridad" TEXT,
    "tokenCodigo" TEXT,
    "banco" TEXT,
    "observaciones" TEXT,
    "municipio" TEXT,
    "tags" TEXT[],
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Acceso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogAcceso" (
    "id" TEXT NOT NULL,
    "accesoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogAcceso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObligacionTributaria" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "tipoObligacion" TEXT NOT NULL,
    "periodicidad" "Periodicidad" NOT NULL,
    "periodo" TEXT,
    "año" INTEGER NOT NULL,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoObligacion" NOT NULL DEFAULT 'PENDIENTE',
    "responsableId" TEXT,
    "observaciones" TEXT,
    "municipio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ObligacionTributaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Empleado" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "ciudad" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Empleado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NovedadNomina" (
    "id" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "periodo" "PeriodoNomina" NOT NULL,
    "mes" INTEGER NOT NULL,
    "año" INTEGER NOT NULL,
    "tipoNovedad" "TipoNovedad" NOT NULL,
    "valor" DOUBLE PRECISION,
    "horas" DOUBLE PRECISION,
    "descripcion" TEXT,
    "adjunto" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NovedadNomina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReporteNomina" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "periodo" "PeriodoNomina" NOT NULL,
    "mes" INTEGER NOT NULL,
    "año" INTEGER NOT NULL,
    "estado" "EstadoReporteNomina" NOT NULL DEFAULT 'BORRADOR',
    "sinNovedades" BOOLEAN NOT NULL DEFAULT false,
    "comentarios" TEXT,
    "enviadoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReporteNomina_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_companyId_idx" ON "User"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_nit_key" ON "Empresa"("nit");

-- CreateIndex
CREATE INDEX "Empresa_nit_idx" ON "Empresa"("nit");

-- CreateIndex
CREATE INDEX "Empresa_estado_idx" ON "Empresa"("estado");

-- CreateIndex
CREATE INDEX "Acceso_empresaId_idx" ON "Acceso"("empresaId");

-- CreateIndex
CREATE INDEX "Acceso_tipo_idx" ON "Acceso"("tipo");

-- CreateIndex
CREATE INDEX "LogAcceso_accesoId_idx" ON "LogAcceso"("accesoId");

-- CreateIndex
CREATE INDEX "LogAcceso_userId_idx" ON "LogAcceso"("userId");

-- CreateIndex
CREATE INDEX "LogAcceso_timestamp_idx" ON "LogAcceso"("timestamp");

-- CreateIndex
CREATE INDEX "ObligacionTributaria_empresaId_idx" ON "ObligacionTributaria"("empresaId");

-- CreateIndex
CREATE INDEX "ObligacionTributaria_estado_idx" ON "ObligacionTributaria"("estado");

-- CreateIndex
CREATE INDEX "ObligacionTributaria_fechaVencimiento_idx" ON "ObligacionTributaria"("fechaVencimiento");

-- CreateIndex
CREATE INDEX "ObligacionTributaria_responsableId_idx" ON "ObligacionTributaria"("responsableId");

-- CreateIndex
CREATE INDEX "Empleado_empresaId_idx" ON "Empleado"("empresaId");

-- CreateIndex
CREATE INDEX "Empleado_activo_idx" ON "Empleado"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "Empleado_empresaId_cedula_key" ON "Empleado"("empresaId", "cedula");

-- CreateIndex
CREATE INDEX "NovedadNomina_empleadoId_idx" ON "NovedadNomina"("empleadoId");

-- CreateIndex
CREATE INDEX "NovedadNomina_empresaId_idx" ON "NovedadNomina"("empresaId");

-- CreateIndex
CREATE INDEX "NovedadNomina_mes_año_idx" ON "NovedadNomina"("mes", "año");

-- CreateIndex
CREATE INDEX "NovedadNomina_periodo_idx" ON "NovedadNomina"("periodo");

-- CreateIndex
CREATE INDEX "ReporteNomina_empresaId_idx" ON "ReporteNomina"("empresaId");

-- CreateIndex
CREATE INDEX "ReporteNomina_estado_idx" ON "ReporteNomina"("estado");

-- CreateIndex
CREATE INDEX "ReporteNomina_mes_año_idx" ON "ReporteNomina"("mes", "año");

-- CreateIndex
CREATE UNIQUE INDEX "ReporteNomina_empresaId_periodo_mes_año_key" ON "ReporteNomina"("empresaId", "periodo", "mes", "año");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Acceso" ADD CONSTRAINT "Acceso_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogAcceso" ADD CONSTRAINT "LogAcceso_accesoId_fkey" FOREIGN KEY ("accesoId") REFERENCES "Acceso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogAcceso" ADD CONSTRAINT "LogAcceso_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObligacionTributaria" ADD CONSTRAINT "ObligacionTributaria_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObligacionTributaria" ADD CONSTRAINT "ObligacionTributaria_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Empleado" ADD CONSTRAINT "Empleado_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NovedadNomina" ADD CONSTRAINT "NovedadNomina_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "Empleado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NovedadNomina" ADD CONSTRAINT "NovedadNomina_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReporteNomina" ADD CONSTRAINT "ReporteNomina_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
