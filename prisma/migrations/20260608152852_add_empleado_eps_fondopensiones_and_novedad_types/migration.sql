-- Add eps and fondoPensiones to Empleado
ALTER TABLE "Empleado" ADD COLUMN IF NOT EXISTS "eps" TEXT;
ALTER TABLE "Empleado" ADD COLUMN IF NOT EXISTS "fondoPensiones" TEXT;

-- Add new TipoNovedad enum values
ALTER TYPE "TipoNovedad" ADD VALUE IF NOT EXISTS 'HORAS_EXTRAS_NOCTURNAS';
ALTER TYPE "TipoNovedad" ADD VALUE IF NOT EXISTS 'DOMINICALES';
