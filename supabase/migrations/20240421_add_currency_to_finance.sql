-- Add currency column to finance_records table
ALTER TABLE public.finance_records 
ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'TL';

-- Update existing records to have 'TL' as default if they were created before this migration
UPDATE public.finance_records SET currency = 'TL' WHERE currency IS NULL;

-- Ensure constraints (optional but good practice)
-- ALTER TABLE public.finance_records ADD CONSTRAINT finance_records_currency_check CHECK (currency IN ('TL', 'USD', 'EUR', 'GBP'));
