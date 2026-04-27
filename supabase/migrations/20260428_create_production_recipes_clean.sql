-- Migration: Create production_recipes table cleanly mapped to products
CREATE TABLE IF NOT EXISTS production_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
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
