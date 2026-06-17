-- Add missing fields to Acceso model for DB-based persistence
ALTER TABLE "Acceso"
  ADD COLUMN IF NOT EXISTS "archivado"      BOOLEAN   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "ultimoAcceso"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "nitTercero"     TEXT,
  ADD COLUMN IF NOT EXISTS "tipoDocumento"  TEXT,
  ADD COLUMN IF NOT EXISTS "nitEmpresa"     TEXT,
  ADD COLUMN IF NOT EXISTS "nombreSoftware" TEXT;
