-- ==========================================
-- 1. FINANCE CATEGORIES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.finance_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('gelir', 'gider')),
    created_at timestamptz DEFAULT now()
);

-- RLS for Categories
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

-- ==========================================
-- 2. UPDATE FINANCE RECORDS TABLE
-- ==========================================
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='finance_records' AND column_name='currency') THEN
        ALTER TABLE public.finance_records ADD COLUMN currency text DEFAULT 'TL' CHECK (currency IN ('TL', 'USD', 'EUR', 'GBP'));
    END IF;
END $$;

-- ==========================================
-- 3. SEED INITIAL CATEGORIES
-- ==========================================
INSERT INTO public.finance_categories (name, type) VALUES
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
ON CONFLICT DO NOTHING;
