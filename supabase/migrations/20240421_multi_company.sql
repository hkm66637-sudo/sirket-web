-- ==========================================
-- 1. COMPANIES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.companies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name text NOT NULL UNIQUE,
    company_type text, -- 'üretim', 'e-ticaret', etc.
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- RLS for Companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public companies are viewable by everyone" ON public.companies;
CREATE POLICY "Public companies are viewable by everyone" 
    ON public.companies FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin and Operasyon can manage companies" ON public.companies;
CREATE POLICY "Admin and Operasyon can manage companies" 
    ON public.companies FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'operasyon')
        )
    );

-- ==========================================
-- 2. SEED INITIAL COMPANIES
-- ==========================================
INSERT INTO public.companies (company_name, company_type) VALUES
('Tabansa', 'Üretim / Toptan'),
('Atak Form', 'E-Ticaret'),
('Strong Power', 'E-Ticaret'),
('Enha Group', 'E-Ticaret')
ON CONFLICT (company_name) DO NOTHING;

-- ==========================================
-- 3. ADD company_id TO EXISTING TABLES
-- ==========================================

DO $$ 
DECLARE 
    tabansa_id uuid;
BEGIN 
    -- Get Tabansa ID for existing data linkage
    SELECT id INTO tabansa_id FROM public.companies WHERE company_name = 'Tabansa' LIMIT 1;

    -- Update banks
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='banks' AND column_name='company_id') THEN
        ALTER TABLE public.banks ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;
        UPDATE public.banks SET company_id = tabansa_id WHERE company_id IS NULL;
        ALTER TABLE public.banks ALTER COLUMN company_id SET NOT NULL;
    END IF;

    -- Update tasks
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='company_id') THEN
        ALTER TABLE public.tasks ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;
        UPDATE public.tasks SET company_id = tabansa_id WHERE company_id IS NULL;
        ALTER TABLE public.tasks ALTER COLUMN company_id SET NOT NULL;
    END IF;

    -- Update finance_records
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='finance_records' AND column_name='company_id') THEN
        ALTER TABLE public.finance_records ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;
        UPDATE public.finance_records SET company_id = tabansa_id WHERE company_id IS NULL;
        ALTER TABLE public.finance_records ALTER COLUMN company_id SET NOT NULL;
    END IF;

    -- Update calendar_events
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calendar_events' AND column_name='company_id') THEN
        ALTER TABLE public.calendar_events ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;
        UPDATE public.calendar_events SET company_id = tabansa_id WHERE company_id IS NULL;
        ALTER TABLE public.calendar_events ALTER COLUMN company_id SET NOT NULL;
    END IF;

END $$;

-- ==========================================
-- 4. UPDATE RLS POLICIES FOR company_id
-- ==========================================

-- Tasks: View by all auth, manage by admin/operasyon
DROP POLICY IF EXISTS "Authenticated users can view tasks" ON public.tasks;
CREATE POLICY "Authenticated users can view tasks" 
    ON public.tasks FOR SELECT USING (auth.role() = 'authenticated');

-- Finance: Filtered logic remains but now records have company_id
-- No change needed to base policies unless we want to restrict by user<->company assignment (not requested yet)
