-- 1. Sistem Logları Tablosu
CREATE TABLE IF NOT EXISTS public.system_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now(),
    actor_id uuid REFERENCES public.profiles(id),
    action_type text NOT NULL, -- 'CREATE_USER', 'UPDATE_USER', 'DELETE_USER', etc.
    target_id text,
    details jsonb,
    ip_address text
);

-- 2. Profiles RLS Politikalarını Güncelle
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles access policy" ON public.profiles;

CREATE POLICY "Profiles access policy" ON public.profiles
FOR ALL USING (
    -- 1. Super Admin ve Admin her şeyi yapabilir
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
    OR
    -- 2. Diğerleri için okuma yetkisi
    (
        CASE 
            -- Global erişimi olanlar her şeyi okur
            WHEN (SELECT access_level FROM profiles WHERE id = auth.uid()) = 'global' THEN true
            -- Şirket bazlı erişim
            WHEN (SELECT access_level FROM profiles WHERE id = auth.uid()) = 'company_only' 
                THEN company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
            -- Birim bazlı erişim
            WHEN (SELECT access_level FROM profiles WHERE id = auth.uid()) = 'department_only' 
                THEN (department = (SELECT department FROM profiles WHERE id = auth.uid()) 
                      AND company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()))
            -- Sadece kendi kaydı
            WHEN (SELECT access_level FROM profiles WHERE id = auth.uid()) = 'self_only' 
                THEN id = auth.uid()
            ELSE false
        END
    )
);

-- Not: Update ve Delete işlemleri için admin/super_admin kontrolü zaten policy içinde var.
