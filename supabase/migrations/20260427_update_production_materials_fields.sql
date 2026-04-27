-- Migration to add fields to production_materials (just in case)
ALTER TABLE IF EXISTS production_materials
ADD COLUMN IF NOT EXISTS material_type text,
ADD COLUMN IF NOT EXISTS color text,
ADD COLUMN IF NOT EXISTS package_quantity numeric,
ADD COLUMN IF NOT EXISTS package_quantity_unit text,
ADD COLUMN IF NOT EXISTS width_cm numeric;
