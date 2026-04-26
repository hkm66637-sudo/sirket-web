-- Update finance_records table to include status
ALTER TABLE public.finance_records 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Bekliyor'
CHECK (status IN ('Ödendi', 'Bekliyor', 'İptal Edildi', 'Tahsil Edildi'));

-- Update existing records to reasonable defaults based on type
UPDATE public.finance_records SET status = 'Tahsil Edildi' WHERE type = 'gelir';
UPDATE public.finance_records SET status = 'Ödendi' WHERE type = 'gider' AND date < CURRENT_DATE;

-- Add a column for source type (E-ticaret, Toptan, etc.) if category doesn't cover it
-- but category is already a text field, we'll just use it more specifically.
