-- Migration to add packaging details to raw materials
ALTER TABLE IF EXISTS raw_materials
ADD COLUMN IF NOT EXISTS package_quantity numeric,
ADD COLUMN IF NOT EXISTS package_quantity_unit text,
ADD COLUMN IF NOT EXISTS width_cm numeric;
