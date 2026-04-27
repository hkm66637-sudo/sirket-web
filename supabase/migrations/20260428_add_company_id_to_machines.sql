-- Migration to add company_id to machines table if missing
ALTER TABLE IF EXISTS machines
ADD COLUMN IF NOT EXISTS company_id uuid;
