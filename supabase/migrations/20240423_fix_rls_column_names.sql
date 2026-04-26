-- Fix broken RLS policy on profiles that references old column names
-- Columns renamed: access_level -> access_scope, department -> department_id
-- This policy failure cascades to ALL queries that check auth context

DROP POLICY IF EXISTS "Profiles access policy" ON public.profiles;

CREATE POLICY "Profiles access policy" ON public.profiles
FOR ALL USING (
    -- 1. Super Admin ve Admin her şeyi yapabilir
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
    OR
    -- 2. Diğerleri için erişim seviyesine göre kontrol
    (
        CASE 
            -- Global erişimi olanlar her şeyi okur
            WHEN (SELECT access_scope FROM profiles WHERE id = auth.uid()) = 'global' THEN true
            -- Şirket bazlı erişim
            WHEN (SELECT access_scope FROM profiles WHERE id = auth.uid()) = 'company_only' 
                THEN company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
            -- Birim bazlı erişim
            WHEN (SELECT access_scope FROM profiles WHERE id = auth.uid()) = 'department_only' 
                THEN (department_id = (SELECT department_id FROM profiles WHERE id = auth.uid()) 
                      AND company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()))
            -- Sadece kendi kaydı
            WHEN (SELECT access_scope FROM profiles WHERE id = auth.uid()) = 'self_only' 
                THEN id = auth.uid()
            -- Eğer access_scope null ise kendi kaydına izin ver (fallback)
            WHEN (SELECT access_scope FROM profiles WHERE id = auth.uid()) IS NULL
                THEN id = auth.uid()
            ELSE false
        END
    )
);
