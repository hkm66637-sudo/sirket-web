-- Add payment_method column to finance_records
ALTER TABLE public.finance_records 
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'Nakit';

-- Add check constraint for allowed values
-- Options: Nakit, Banka Havalesi / EFT, Kredi Kartı, Çek, Senet
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'finance_records_payment_method_check'
    ) THEN
        ALTER TABLE public.finance_records 
        ADD CONSTRAINT finance_records_payment_method_check 
        CHECK (payment_method IN ('Nakit', 'Banka Havalesi / EFT', 'Kredi Kartı', 'Çek', 'Senet'));
    END IF;
END $$;

-- Update existing records to have 'Nakit' as default (already handled by DEFAULT 'Nakit' on column add, but just in case)
UPDATE public.finance_records SET payment_method = 'Nakit' WHERE payment_method IS NULL;
