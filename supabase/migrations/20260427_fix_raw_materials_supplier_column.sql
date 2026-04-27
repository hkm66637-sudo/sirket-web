-- Add supplier column to raw_materials table
ALTER TABLE IF EXISTS raw_materials
ADD COLUMN IF NOT EXISTS supplier text;
