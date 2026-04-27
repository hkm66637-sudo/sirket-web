ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS raw_material_type text,
ADD COLUMN IF NOT EXISTS production_time_minutes integer,
ADD COLUMN IF NOT EXISTS daily_production_capacity integer,
ADD COLUMN IF NOT EXISTS mold_count integer,
ADD COLUMN IF NOT EXISTS color_info text,
ADD COLUMN IF NOT EXISTS variations jsonb DEFAULT '[]'::jsonb;
