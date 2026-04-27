-- Migration to explicitly configure and update raw_materials schema cache columns
ALTER TABLE IF EXISTS raw_materials
ADD COLUMN IF NOT EXISTS material_type text,
ADD COLUMN IF NOT EXISTS color text,
ADD COLUMN IF NOT EXISTS package_quantity numeric,
ADD COLUMN IF NOT EXISTS package_quantity_unit text,
ADD COLUMN IF NOT EXISTS width_cm numeric;

-- Try to reload schema cache if notify is available
NOTIFY pghero, 'reload_schema';
NOTIFY pgrst, 'reload schema';
