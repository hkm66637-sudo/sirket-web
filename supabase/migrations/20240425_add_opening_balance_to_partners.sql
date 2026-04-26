-- Add opening_balance to partners table
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS opening_balance decimal(15,2) DEFAULT 0;
