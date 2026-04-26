-- 1. Tasks Tablosu Policy Güncellemesi (Daha hızlı ve güvenli)
DROP POLICY IF EXISTS "Admin and Operasyon can manage tasks" ON public.tasks;
CREATE POLICY "Admin and Operasyon can manage tasks" ON public.tasks 
FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'admin', 'operasyon')
    OR
    (public.get_my_profile_data() ->> 'access_scope') = 'global'
    OR
    (CASE 
        WHEN (public.get_my_profile_data() ->> 'access_scope') = 'company_only' 
            THEN company_id = (public.get_my_profile_data() ->> 'company_id')::uuid
        WHEN (public.get_my_profile_data() ->> 'access_scope') = 'department_only' 
            THEN company_id = (public.get_my_profile_data() ->> 'company_id')::uuid
        ELSE false
    END)
);

-- 2. Finance Records Tablosu Policy Güncellemesi
DROP POLICY IF EXISTS "Admin and Finans can manage finance records" ON public.finance_records;
CREATE POLICY "Admin and Finans can manage finance records" ON public.finance_records
FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'admin', 'finans')
    OR
    (public.get_my_profile_data() ->> 'access_scope') = 'global'
    OR
    (CASE 
        WHEN (public.get_my_profile_data() ->> 'access_scope') = 'company_only' 
            THEN company_id = (public.get_my_profile_data() ->> 'company_id')::uuid
        ELSE false
    END)
);
