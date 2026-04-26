-- 1. Create finance_categories table if not exists
CREATE TABLE IF NOT EXISTS public.finance_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('gelir', 'gider')),
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Add Unique Constraint to prevent duplicates
-- Standardizes name by trimming and case-insensitive check via unique index
CREATE UNIQUE INDEX IF NOT EXISTS finance_categories_name_type_company_idx 
ON public.finance_categories (TRIM(LOWER(name)), type, (COALESCE(company_id, '00000000-0000-0000-0000-000000000000'::uuid)));

-- 3. Ensure trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_finance_categories_updated_at ON public.finance_categories;
CREATE TRIGGER set_finance_categories_updated_at
    BEFORE UPDATE ON public.finance_categories
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 4. Update finance_records table
ALTER TABLE public.finance_records 
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.finance_categories(id) ON DELETE SET NULL;

-- 5. Seed initial categories if table is empty
INSERT INTO public.finance_categories (name, type) 
SELECT name, type FROM (
    VALUES 
    ('B2B Satış', 'gelir'),
    ('E-Ticaret', 'gelir'),
    ('Hizmet Bedeli', 'gelir'),
    ('Yatırım Getirisi', 'gelir'),
    ('Diğer Gelir', 'gelir'),
    ('Hammadde / Stok', 'gider'),
    ('Personel / Maaş', 'gider'),
    ('Ofis Kirası', 'gider'),
    ('Lojistik / Kargo', 'gider'),
    ('Reklam / Pazarlama', 'gider'),
    ('Vergi / Harç', 'gider'),
    ('Yazılım / Abonelik', 'gider'),
    ('Diğer Gider', 'gider')
) AS initial(name, type)
WHERE NOT EXISTS (SELECT 1 FROM public.finance_categories LIMIT 1)
ON CONFLICT DO NOTHING;

-- 6. Backfill category_id in finance_records
DO $$ 
BEGIN 
    UPDATE public.finance_records fr
    SET category_id = fc.id
    FROM public.finance_categories fc
    WHERE TRIM(LOWER(fr.category)) = TRIM(LOWER(fc.name)) 
    AND fr.type = fc.type
    AND fr.category_id IS NULL;
EXCEPTION WHEN OTHERS THEN 
    -- Ignore if backfill fails for any reason
END $$;

-- 7. RLS Policies for Categories
ALTER TABLE public.finance_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view categories" ON public.finance_categories;
CREATE POLICY "Anyone can view categories" 
    ON public.finance_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin and Finans can manage categories" ON public.finance_categories;
CREATE POLICY "Admin and Finans can manage categories" 
    ON public.finance_categories FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'finans')
        )
    );
