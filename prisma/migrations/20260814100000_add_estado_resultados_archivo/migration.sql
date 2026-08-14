-- CreateTable
CREATE TABLE "EstadoResultadosArchivo" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nombreArchivo" TEXT NOT NULL,
    "mesesCubiertos" TEXT[],
    "resultado" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstadoResultadosArchivo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EstadoResultadosArchivo_empresaId_idx" ON "EstadoResultadosArchivo"("empresaId");

-- CreateIndex
CREATE INDEX "EstadoResultadosArchivo_createdAt_idx" ON "EstadoResultadosArchivo"("createdAt");

-- AddForeignKey
ALTER TABLE "EstadoResultadosArchivo" ADD CONSTRAINT "EstadoResultadosArchivo_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
