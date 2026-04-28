-- Migration: Extend corporate_orders for granular workflow flags
ALTER TABLE corporate_orders
ADD COLUMN IF NOT EXISTS design_required boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS production_required boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS delivery_method text,
ADD COLUMN IF NOT EXISTS customer_note text,
ADD COLUMN IF NOT EXISTS marketing_note text;
