-- Migration: Add shipping details for corporate_orders
ALTER TABLE corporate_orders
ADD COLUMN IF NOT EXISTS package_count integer,
ADD COLUMN IF NOT EXISTS cargo_company text,
ADD COLUMN IF NOT EXISTS tracking_number text;
