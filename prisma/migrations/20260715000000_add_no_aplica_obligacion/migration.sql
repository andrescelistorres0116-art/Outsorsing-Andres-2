-- Migration: add noAplica to ObligacionTributaria
-- Purely additive — no existing rows are modified.
-- All existing rows get noAplica = false (the DEFAULT), which is correct.

ALTER TABLE "ObligacionTributaria" ADD COLUMN "noAplica" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ObligacionTributaria" ADD COLUMN "noAplicaFecha" TIMESTAMP(3);
