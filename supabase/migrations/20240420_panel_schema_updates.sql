-- 1. Update roles in profiles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'operasyon', 'finans'));

-- 2. Finance Records Table (Already handled in base_schema but kept for safety)
CREATE TABLE IF NOT EXISTS public.finance_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL CHECK (type IN ('gelir', 'gider')),
    category text NOT NULL,
    sub_platform text, 
    amount decimal NOT NULL,
    date date NOT NULL DEFAULT CURRENT_DATE,
    description text,
    document_no text,
    created_by uuid REFERENCES profiles(id),
    created_at timestamptz DEFAULT now()
);

-- 3. Calendar Events Table (Already handled in base_schema but kept for safety)
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    type text NOT NULL CHECK (type IN ('toplanti', 'gorusme', 'uretim', 'finans', 'tahsilat')),
    start_at timestamptz NOT NULL,
    end_at timestamptz,
    description text,
    created_by uuid REFERENCES profiles(id),
    created_at timestamptz DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE public.finance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Finance records: Only admin and finans can manage
DROP POLICY IF EXISTS "Admin and Finans can manage finance records" ON public.finance_records;
CREATE POLICY "Admin and Finans can manage finance records" ON public.finance_records
    FOR ALL 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'finans')))
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'finans')));

-- Calendar events policies
DROP POLICY IF EXISTS "Anyone can view general events" ON public.calendar_events;
CREATE POLICY "Anyone can view general events" ON public.calendar_events
    FOR SELECT USING (type IN ('toplanti', 'gorusme', 'uretim'));

DROP POLICY IF EXISTS "Admin and Finans can view finance events" ON public.calendar_events;
CREATE POLICY "Admin and Finans can view finance events" ON public.calendar_events
    FOR SELECT USING (
        (type IN ('finans', 'tahsilat') AND
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'finans'))) OR 
        (type IN ('toplanti', 'gorusme', 'uretim'))
    );

DROP POLICY IF EXISTS "Admin can manage all events" ON public.calendar_events;
CREATE POLICY "Admin can manage all events" ON public.calendar_events
    FOR ALL 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 6. Task Management Updates
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_priority_check;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_priority_check CHECK (priority IN ('Düşük', 'Orta', 'Yüksek'));

ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_status_check CHECK (status IN ('Bekliyor', 'Devam Ediyor', 'Gecikmiş', 'Tamamlandı'));

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS module text DEFAULT 'Genel';
