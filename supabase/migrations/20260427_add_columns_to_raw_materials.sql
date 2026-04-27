-- Add new columns to raw_materials table
ALTER TABLE IF EXISTS raw_materials
ADD COLUMN IF NOT EXISTS material_type text,
ADD COLUMN IF NOT EXISTS color text;
