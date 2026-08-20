-- AlterTable
ALTER TABLE "ObligacionTributaria" ADD COLUMN     "contabilizado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "contabilizadoArchivoData" TEXT,
ADD COLUMN     "contabilizadoArchivoNombre" TEXT,
ADD COLUMN     "contabilizadoArchivoTipo" TEXT,
ADD COLUMN     "contabilizadoFecha" TIMESTAMP(3),
ADD COLUMN     "contabilizadoPorId" TEXT,
ADD COLUMN     "declarado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "declaradoArchivoData" TEXT,
ADD COLUMN     "declaradoArchivoNombre" TEXT,
ADD COLUMN     "declaradoArchivoTipo" TEXT,
ADD COLUMN     "declaradoFecha" TIMESTAMP(3),
ADD COLUMN     "declaradoPorId" TEXT,
ADD COLUMN     "pagado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pagadoFecha" TIMESTAMP(3),
ADD COLUMN     "pagadoPorId" TEXT,
ADD COLUMN     "responsableNombre" TEXT;

-- CreateTable
CREATE TABLE "AuditoriaObligacion" (
    "id" TEXT NOT NULL,
    "obligacionId" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "archivoNombre" TEXT,
    "detalles" TEXT,
    "realizadoPorId" TEXT NOT NULL,
    "fechaAccion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditoriaObligacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditoriaObligacion_obligacionId_idx" ON "AuditoriaObligacion"("obligacionId");

-- CreateIndex
CREATE INDEX "AuditoriaObligacion_realizadoPorId_idx" ON "AuditoriaObligacion"("realizadoPorId");

-- CreateIndex
CREATE INDEX "AuditoriaObligacion_fechaAccion_idx" ON "AuditoriaObligacion"("fechaAccion");

-- AddForeignKey
ALTER TABLE "ObligacionTributaria" ADD CONSTRAINT "ObligacionTributaria_contabilizadoPorId_fkey" FOREIGN KEY ("contabilizadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObligacionTributaria" ADD CONSTRAINT "ObligacionTributaria_declaradoPorId_fkey" FOREIGN KEY ("declaradoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObligacionTributaria" ADD CONSTRAINT "ObligacionTributaria_pagadoPorId_fkey" FOREIGN KEY ("pagadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditoriaObligacion" ADD CONSTRAINT "AuditoriaObligacion_obligacionId_fkey" FOREIGN KEY ("obligacionId") REFERENCES "ObligacionTributaria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditoriaObligacion" ADD CONSTRAINT "AuditoriaObligacion_realizadoPorId_fkey" FOREIGN KEY ("realizadoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
