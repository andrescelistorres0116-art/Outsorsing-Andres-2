-- CreateTable
CREATE TABLE "CatalogoCuenta" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "grupo" TEXT NOT NULL DEFAULT 'Normal',
    "inactivo" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CatalogoCuenta_pkey" PRIMARY KEY ("id")
);

-- CreateUniqueIndex
CREATE UNIQUE INDEX "CatalogoCuenta_empresaId_codigo_key" ON "CatalogoCuenta"("empresaId", "codigo");

-- CreateIndex
CREATE INDEX "CatalogoCuenta_empresaId_idx" ON "CatalogoCuenta"("empresaId");

-- AddForeignKey
ALTER TABLE "CatalogoCuenta" ADD CONSTRAINT "CatalogoCuenta_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
