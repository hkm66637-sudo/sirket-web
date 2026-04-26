-- 1. Create Banks Table
CREATE TABLE IF NOT EXISTS public.banks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    banka_adi text NOT NULL,
    hesap_adi text,
    baslangic_bakiyesi decimal NOT NULL DEFAULT 0,
    para_birimi text NOT NULL DEFAULT 'TRY',
    aktif_mi boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Update Finance Records with banka_id
ALTER TABLE public.finance_records 
ADD COLUMN IF NOT EXISTS banka_id uuid REFERENCES public.banks(id) ON DELETE SET NULL;

-- 3. Enable RLS for Banks
ALTER TABLE public.banks ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for Banks (Admin and Finans only)
DROP POLICY IF EXISTS "Admin and Finans can manage banks" ON banks;
CREATE POLICY "Admin and Finans can manage banks" ON banks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'finans')
        )
    );

-- 5. Seed initial Bank
INSERT INTO public.banks (banka_adi, hesap_adi, baslangic_bakiyesi)
SELECT 'Garanti BBVA', 'Zirve Ticari', 50000
WHERE NOT EXISTS (SELECT 1 FROM public.banks WHERE banka_adi = 'Garanti BBVA');

-- Update existing records to the default bank if it exists
DO $$ 
DECLARE 
    def_bank_id uuid;
BEGIN
    SELECT id INTO def_bank_id FROM public.banks LIMIT 1;
    IF def_bank_id IS NOT NULL THEN
        UPDATE public.finance_records SET banka_id = def_bank_id WHERE banka_id IS NULL;
    END IF;
END $$;
