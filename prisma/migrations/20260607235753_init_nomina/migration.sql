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
CREATE TYPE "PeriodicidadNomina" AS ENUM ('MENSUAL', 'QUINCENAL');

-- CreateEnum
CREATE TYPE "PeriodoNomina" AS ENUM ('MENSUAL', 'PRIMERA_QUINCENA', 'SEGUNDA_QUINCENA');

-- CreateEnum
CREATE TYPE "ModoFlujoNomina" AS ENUM ('SIMPLE', 'COMPLETO');

-- CreateEnum
CREATE TYPE "TipoNovedad" AS ENUM ('HORAS_EXTRAS', 'RECARGOS', 'BONIFICACIONES', 'COMISIONES', 'INCAPACIDAD', 'LICENCIA', 'VACACIONES', 'LIBRANZA', 'EMBARGO', 'INGRESO', 'RETIRO', 'LLEGADA_TARDE', 'AUSENCIA', 'OTRA');

-- CreateEnum
CREATE TYPE "EstadoReporteNomina" AS ENUM ('BORRADOR', 'ENVIADA', 'REVISADA', 'APROBADA', 'REABIERTA', 'CORREGIDA');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CLIENT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsuarioEmpresa" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsuarioEmpresa_pkey" PRIMARY KEY ("id")
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
    "tipoFacturacionElectronica" TEXT,
    "tipoNomina" TEXT,
    "periodicidadNomina" "PeriodicidadNomina",
    "modoFlujoNomina" "ModoFlujoNomina" NOT NULL DEFAULT 'COMPLETO',
    "responsableNominaId" TEXT,
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
    "tipoDocumento" TEXT,
    "numeroDocumento" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cargo" TEXT,
    "salarioBase" DECIMAL(18,2),
    "tipoContrato" TEXT,
    "ciudad" TEXT,
    "fechaIngreso" TIMESTAMP(3),
    "fechaRetiro" TIMESTAMP(3),
    "observaciones" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Empleado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NovedadNomina" (
    "id" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "reporteId" TEXT,
    "periodo" "PeriodoNomina" NOT NULL,
    "mes" INTEGER NOT NULL,
    "año" INTEGER NOT NULL,
    "tipoNovedad" "TipoNovedad" NOT NULL,
    "valor" DECIMAL(18,2),
    "tarifaHora" DECIMAL(18,2),
    "porcentaje" DECIMAL(5,2),
    "horas" DECIMAL(8,2),
    "diasAusencia" INTEGER,
    "libranzaId" TEXT,
    "numeroCuotas" INTEGER,
    "valorCuota" DECIMAL(18,2),
    "cuotaNumero" INTEGER,
    "fechaInicioNovedad" TIMESTAMP(3),
    "fechaFinNovedad" TIMESTAMP(3),
    "descripcion" TEXT,
    "adjunto" TEXT,
    "creadoPorId" TEXT,
    "aprobadoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NovedadNomina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Libranza" (
    "id" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "numeroPrestamo" TEXT,
    "valorCuota" DECIMAL(18,2) NOT NULL,
    "numeroCuotas" INTEGER NOT NULL,
    "cuotaActual" INTEGER NOT NULL DEFAULT 1,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Libranza_pkey" PRIMARY KEY ("id")
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
    "fechaInicioPeriodo" TIMESTAMP(3),
    "fechaFinPeriodo" TIMESTAMP(3),
    "enviadoPorId" TEXT,
    "revisadoPorId" TEXT,
    "aprobadoPorId" TEXT,
    "cerradoPorId" TEXT,
    "fechaEnvio" TIMESTAMP(3),
    "fechaRevision" TIMESTAMP(3),
    "fechaAprobacion" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReporteNomina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditoriaReporte" (
    "id" TEXT NOT NULL,
    "reporteNominaId" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "estadoAntes" "EstadoReporteNomina",
    "estadoDespues" "EstadoReporteNomina" NOT NULL,
    "realizadoPorId" TEXT NOT NULL,
    "observaciones" TEXT,
    "fechaAccion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditoriaReporte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditoriaNovedad" (
    "id" TEXT NOT NULL,
    "novedadNominaId" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "camposAntes" JSONB,
    "camposDespues" JSONB,
    "realizadoPorId" TEXT NOT NULL,
    "fechaAccion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditoriaNovedad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditoriaEmpleado" (
    "id" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "camposAntes" JSONB,
    "camposDespues" JSONB,
    "realizadoPorId" TEXT NOT NULL,
    "fechaAccion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditoriaEmpleado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "UsuarioEmpresa_userId_idx" ON "UsuarioEmpresa"("userId");

-- CreateIndex
CREATE INDEX "UsuarioEmpresa_empresaId_idx" ON "UsuarioEmpresa"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioEmpresa_userId_empresaId_key" ON "UsuarioEmpresa"("userId", "empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_nit_key" ON "Empresa"("nit");

-- CreateIndex
CREATE INDEX "Empresa_nit_idx" ON "Empresa"("nit");

-- CreateIndex
CREATE INDEX "Empresa_estado_idx" ON "Empresa"("estado");

-- CreateIndex
CREATE INDEX "Empresa_responsableNominaId_idx" ON "Empresa"("responsableNominaId");

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
CREATE UNIQUE INDEX "Empleado_empresaId_numeroDocumento_key" ON "Empleado"("empresaId", "numeroDocumento");

-- CreateIndex
CREATE INDEX "NovedadNomina_empleadoId_idx" ON "NovedadNomina"("empleadoId");

-- CreateIndex
CREATE INDEX "NovedadNomina_empresaId_idx" ON "NovedadNomina"("empresaId");

-- CreateIndex
CREATE INDEX "NovedadNomina_reporteId_idx" ON "NovedadNomina"("reporteId");

-- CreateIndex
CREATE INDEX "NovedadNomina_mes_año_idx" ON "NovedadNomina"("mes", "año");

-- CreateIndex
CREATE INDEX "NovedadNomina_periodo_idx" ON "NovedadNomina"("periodo");

-- CreateIndex
CREATE INDEX "NovedadNomina_tipoNovedad_idx" ON "NovedadNomina"("tipoNovedad");

-- CreateIndex
CREATE INDEX "Libranza_empleadoId_idx" ON "Libranza"("empleadoId");

-- CreateIndex
CREATE INDEX "Libranza_empresaId_idx" ON "Libranza"("empresaId");

-- CreateIndex
CREATE INDEX "Libranza_activa_idx" ON "Libranza"("activa");

-- CreateIndex
CREATE INDEX "ReporteNomina_empresaId_idx" ON "ReporteNomina"("empresaId");

-- CreateIndex
CREATE INDEX "ReporteNomina_estado_idx" ON "ReporteNomina"("estado");

-- CreateIndex
CREATE INDEX "ReporteNomina_mes_año_idx" ON "ReporteNomina"("mes", "año");

-- CreateIndex
CREATE UNIQUE INDEX "ReporteNomina_empresaId_periodo_mes_año_key" ON "ReporteNomina"("empresaId", "periodo", "mes", "año");

-- CreateIndex
CREATE INDEX "AuditoriaReporte_reporteNominaId_idx" ON "AuditoriaReporte"("reporteNominaId");

-- CreateIndex
CREATE INDEX "AuditoriaReporte_realizadoPorId_idx" ON "AuditoriaReporte"("realizadoPorId");

-- CreateIndex
CREATE INDEX "AuditoriaReporte_fechaAccion_idx" ON "AuditoriaReporte"("fechaAccion");

-- CreateIndex
CREATE INDEX "AuditoriaNovedad_novedadNominaId_idx" ON "AuditoriaNovedad"("novedadNominaId");

-- CreateIndex
CREATE INDEX "AuditoriaNovedad_realizadoPorId_idx" ON "AuditoriaNovedad"("realizadoPorId");

-- CreateIndex
CREATE INDEX "AuditoriaNovedad_fechaAccion_idx" ON "AuditoriaNovedad"("fechaAccion");

-- CreateIndex
CREATE INDEX "AuditoriaEmpleado_empleadoId_idx" ON "AuditoriaEmpleado"("empleadoId");

-- CreateIndex
CREATE INDEX "AuditoriaEmpleado_realizadoPorId_idx" ON "AuditoriaEmpleado"("realizadoPorId");

-- CreateIndex
CREATE INDEX "AuditoriaEmpleado_fechaAccion_idx" ON "AuditoriaEmpleado"("fechaAccion");

-- AddForeignKey
ALTER TABLE "UsuarioEmpresa" ADD CONSTRAINT "UsuarioEmpresa_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioEmpresa" ADD CONSTRAINT "UsuarioEmpresa_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Empresa" ADD CONSTRAINT "Empresa_responsableNominaId_fkey" FOREIGN KEY ("responsableNominaId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "NovedadNomina" ADD CONSTRAINT "NovedadNomina_reporteId_fkey" FOREIGN KEY ("reporteId") REFERENCES "ReporteNomina"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NovedadNomina" ADD CONSTRAINT "NovedadNomina_libranzaId_fkey" FOREIGN KEY ("libranzaId") REFERENCES "Libranza"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NovedadNomina" ADD CONSTRAINT "NovedadNomina_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NovedadNomina" ADD CONSTRAINT "NovedadNomina_aprobadoPorId_fkey" FOREIGN KEY ("aprobadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Libranza" ADD CONSTRAINT "Libranza_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "Empleado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Libranza" ADD CONSTRAINT "Libranza_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReporteNomina" ADD CONSTRAINT "ReporteNomina_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReporteNomina" ADD CONSTRAINT "ReporteNomina_enviadoPorId_fkey" FOREIGN KEY ("enviadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReporteNomina" ADD CONSTRAINT "ReporteNomina_revisadoPorId_fkey" FOREIGN KEY ("revisadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReporteNomina" ADD CONSTRAINT "ReporteNomina_aprobadoPorId_fkey" FOREIGN KEY ("aprobadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReporteNomina" ADD CONSTRAINT "ReporteNomina_cerradoPorId_fkey" FOREIGN KEY ("cerradoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditoriaReporte" ADD CONSTRAINT "AuditoriaReporte_reporteNominaId_fkey" FOREIGN KEY ("reporteNominaId") REFERENCES "ReporteNomina"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditoriaReporte" ADD CONSTRAINT "AuditoriaReporte_realizadoPorId_fkey" FOREIGN KEY ("realizadoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditoriaNovedad" ADD CONSTRAINT "AuditoriaNovedad_novedadNominaId_fkey" FOREIGN KEY ("novedadNominaId") REFERENCES "NovedadNomina"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditoriaNovedad" ADD CONSTRAINT "AuditoriaNovedad_realizadoPorId_fkey" FOREIGN KEY ("realizadoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditoriaEmpleado" ADD CONSTRAINT "AuditoriaEmpleado_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "Empleado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditoriaEmpleado" ADD CONSTRAINT "AuditoriaEmpleado_realizadoPorId_fkey" FOREIGN KEY ("realizadoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
