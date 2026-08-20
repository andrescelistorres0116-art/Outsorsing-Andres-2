-- Migration: add RecursoCalendario table
-- Purely additive — no existing tables or rows are modified.

CREATE TABLE "RecursoCalendario" (
  "id"       TEXT         NOT NULL,
  "nombre"   TEXT         NOT NULL,
  "tipo"     TEXT         NOT NULL DEFAULT 'application/pdf',
  "datos"    BYTEA        NOT NULL,
  "tamanio"  INTEGER      NOT NULL DEFAULT 0,
  "subidoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecursoCalendario_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RecursoCalendario_subidoEn_idx" ON "RecursoCalendario"("subidoEn");
