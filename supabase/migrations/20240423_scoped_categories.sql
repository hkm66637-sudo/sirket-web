-- 1. Create scope type
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'category_scope') THEN
        CREATE TYPE category_scope AS ENUM ('single', 'multiple', 'all', 'common');
    END IF;
END $$;

-- 2. Update finance_categories table
ALTER TABLE public.finance_categories 
ADD COLUMN IF NOT EXISTS scope category_scope DEFAULT 'all',
ADD COLUMN IF NOT EXISTS icon_name text; -- For optional icon storage

-- Update existing records to 'single' if they have a company_id, otherwise 'all'
UPDATE public.finance_categories SET scope = 'single' WHERE company_id IS NOT NULL AND scope = 'all';
UPDATE public.finance_categories SET scope = 'all' WHERE company_id IS NULL AND scope = 'all';

-- 3. Create many-to-many table for multiple companies
CREATE TABLE IF NOT EXISTS public.category_companies (
    category_id uuid REFERENCES public.finance_categories(id) ON DELETE CASCADE,
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    PRIMARY KEY (category_id, company_id)
);

-- 4. Enable RLS on the junction table
ALTER TABLE public.category_companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view category_companies" ON public.category_companies;
CREATE POLICY "Anyone can view category_companies" 
    ON public.category_companies FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin and Finans can manage category_companies" ON public.category_companies;
CREATE POLICY "Admin and Finans can manage category_companies" 
    ON public.category_companies FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'finans')
        )
    );

-- 5. Seed some common expense categories if they don't exist
INSERT INTO public.finance_categories (name, type, scope, description) 
VALUES 
('Kira', 'gider', 'common', 'Ofis/Depo kira giderleri'),
('Muhasebe', 'gider', 'common', 'Müşavirlik ve defter tutma giderleri'),
('Elektrik', 'gider', 'common', 'Elektrik faturası giderleri'),
('Su', 'gider', 'common', 'Su faturası giderleri'),
('İnternet', 'gider', 'common', 'İnternet ve haberleşme giderleri'),
('Personel Ortak', 'gider', 'common', 'Personel yemek, servis vb. ortak giderler'),
('Yazılım Abonelikleri', 'gider', 'common', 'SaaS ve yazılım lisans giderleri'),
('Genel Ofis Giderleri', 'gider', 'common', 'Kırtasiye, temizlik vb. genel ofis harcamaları')
ON CONFLICT DO NOTHING;
