-- Migration to update machines table with type and mold count
ALTER TABLE IF EXISTS machines
ADD COLUMN IF NOT EXISTS machine_type text,
ADD COLUMN IF NOT EXISTS mold_count integer;
