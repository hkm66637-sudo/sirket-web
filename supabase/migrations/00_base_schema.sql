-- ==========================================
-- 1. PROFILES TABLE (Core User Data)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name text,
    role text CHECK (role IN ('admin', 'operasyon', 'finans')),
    avatar_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
    ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ==========================================
-- 2. TASKS TABLE (Operational Management)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    status text DEFAULT 'Bekliyor' CHECK (status IN ('Bekliyor', 'Devam Ediyor', 'Gecikmiş', 'Tamamlandı')),
    priority text DEFAULT 'Orta' CHECK (priority IN ('Düşük', 'Orta', 'Yüksek')),
    module text DEFAULT 'Genel',
    assigned_to uuid REFERENCES public.profiles(id),
    created_by uuid REFERENCES public.profiles(id),
    due_date timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- RLS for Tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view tasks" ON public.tasks;
CREATE POLICY "Authenticated users can view tasks" 
    ON public.tasks FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin and Operasyon can manage tasks" ON public.tasks;
CREATE POLICY "Admin and Operasyon can manage tasks" 
    ON public.tasks FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'operasyon')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'operasyon')
        )
    );

-- ==========================================
-- 3. FINANCE RECORDS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.finance_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL CHECK (type IN ('gelir', 'gider')),
    category text NOT NULL,
    sub_platform text, 
    amount decimal NOT NULL,
    date date NOT NULL DEFAULT CURRENT_DATE,
    description text,
    document_no text,
    status text DEFAULT 'Bekliyor',
    banka_id uuid, -- Will be linked in banks migration
    created_by uuid REFERENCES public.profiles(id),
    created_at timestamptz DEFAULT now()
);

-- RLS for Finance
ALTER TABLE public.finance_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin and Finans can manage finance records" ON public.finance_records;
CREATE POLICY "Admin and Finans can manage finance records" 
    ON public.finance_records FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'finans')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'finans')
        )
    );

-- ==========================================
-- 4. CALENDAR EVENTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    type text NOT NULL CHECK (type IN ('toplanti', 'gorusme', 'uretim', 'finans', 'tahsilat')),
    start_at timestamptz NOT NULL,
    end_at timestamptz,
    description text,
    created_by uuid REFERENCES public.profiles(id),
    created_at timestamptz DEFAULT now()
);

-- RLS for Calendar
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view general events" ON public.calendar_events;
CREATE POLICY "Anyone can view general events" 
    ON public.calendar_events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can manage events" ON public.calendar_events;
CREATE POLICY "Admin can manage events" 
    ON public.calendar_events FOR ALL 
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
