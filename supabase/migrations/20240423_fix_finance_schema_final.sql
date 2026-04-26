-- Final fix for finance_records schema to ensure payment_method and updated_at columns exist
ALTER TABLE public.finance_records 
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'Nakit',
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Ensure constraint for payment_method with standardized values
-- Values: Nakit, Havale / EFT, Kredi Kartı, Çek, Senet
DO $$ 
BEGIN 
    -- Drop old constraint if exists to update allowed values
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'finance_records_payment_method_check'
    ) THEN
        ALTER TABLE public.finance_records DROP CONSTRAINT finance_records_payment_method_check;
    END IF;

    ALTER TABLE public.finance_records 
    ADD CONSTRAINT finance_records_payment_method_check 
    CHECK (payment_method IN ('Nakit', 'Havale / EFT', 'Banka Havalesi / EFT', 'Kredi Kartı', 'Çek', 'Senet'));
END $$;

-- Update existing records to match the new standard if they used the longer name
UPDATE public.finance_records 
SET payment_method = 'Havale / EFT' 
WHERE payment_method = 'Banka Havalesi / EFT';

-- Ensure updated_at trigger exists for finance_records
DROP TRIGGER IF EXISTS set_finance_records_updated_at ON public.finance_records;
CREATE TRIGGER set_finance_records_updated_at
    BEFORE UPDATE ON public.finance_records
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
