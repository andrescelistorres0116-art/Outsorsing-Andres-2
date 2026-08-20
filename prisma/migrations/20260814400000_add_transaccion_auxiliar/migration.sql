-- CreateTable: TransaccionAuxiliar
-- Individual movements from the libro auxiliar, stored per uploaded archive.
-- Enables cell-level drill-down in the Estado de Resultados table.

CREATE TABLE "TransaccionAuxiliar" (
    "id"        TEXT NOT NULL,
    "archivoId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "codigo"    TEXT NOT NULL,
    "concepto"  TEXT NOT NULL,
    "mes"       TEXT NOT NULL,
    "fecha"     TEXT NOT NULL,
    "nota"      TEXT NOT NULL DEFAULT '',
    "debito"    DOUBLE PRECISION NOT NULL DEFAULT 0,
    "credito"   DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "TransaccionAuxiliar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransaccionAuxiliar_archivoId_idx" ON "TransaccionAuxiliar"("archivoId");

-- CreateIndex
CREATE INDEX "TransaccionAuxiliar_empresaId_idx" ON "TransaccionAuxiliar"("empresaId");

-- CreateIndex
CREATE INDEX "TransaccionAuxiliar_archivoId_codigo_mes_idx" ON "TransaccionAuxiliar"("archivoId", "codigo", "mes");

-- AddForeignKey
ALTER TABLE "TransaccionAuxiliar" ADD CONSTRAINT "TransaccionAuxiliar_archivoId_fkey"
    FOREIGN KEY ("archivoId") REFERENCES "EstadoResultadosArchivo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
