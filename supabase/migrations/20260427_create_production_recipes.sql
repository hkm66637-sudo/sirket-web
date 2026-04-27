-- Add missing columns to products table if necessary
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS product_color text,
ADD COLUMN IF NOT EXISTS material_color text,
ADD COLUMN IF NOT EXISTS product_label text,
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS cutting_blade_model text;

-- Create standalone recipes table
CREATE TABLE IF NOT EXISTS public.production_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  recipe_name text NOT NULL,
  raw_material_type text,
  polyurethane_gram numeric,
  iso_gram numeric,
  memory_gram numeric,
  eva_gram numeric,
  sponge_gram numeric,
  xpe_gram numeric,
  fabric_type text,
  fabric_amount numeric,
  label_type text,
  label_description text,
  adhesive_material text,
  waste_percentage numeric DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
