-- CreateTable
CREATE TABLE "EstadoResultadosExcepcion" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "prefijoCuenta" TEXT NOT NULL,
    "categoriaOriginal" TEXT,
    "categoriaDestino" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "EstadoResultadosExcepcion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EstadoResultadosExcepcion_empresaId_idx" ON "EstadoResultadosExcepcion"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "EstadoResultadosExcepcion_empresaId_prefijoCuenta_key" ON "EstadoResultadosExcepcion"("empresaId", "prefijoCuenta");

-- AddForeignKey
ALTER TABLE "EstadoResultadosExcepcion" ADD CONSTRAINT "EstadoResultadosExcepcion_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
