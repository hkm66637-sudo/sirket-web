-- Finance Records için RLS politikalarını en güvenli ve döngü (recursion) üretmeyecek şekilde güncelle
-- Özellikle INSERT işlemleri için 'WITH CHECK' kısmını garantiye alıyoruz.

DROP POLICY IF EXISTS "Admin and Finans can manage finance records" ON public.finance_records;

CREATE POLICY "Admin and Finans can manage finance records" ON public.finance_records
FOR ALL 
USING (
    -- 1. Admin/Süper Admin/Finans rolleri (JWT üzerinden hızlı kontrol)
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'admin', 'finans')
    OR
    -- 2. Global erişimi olanlar
    (public.get_my_profile_data() ->> 'access_scope') = 'global'
    OR
    -- 3. Şirket bazlı kısıtlama
    (public.get_my_profile_data() ->> 'access_scope') = 'company_only' 
        AND (company_id = (public.get_my_profile_data() ->> 'company_id')::uuid OR company_id IS NULL)
)
WITH CHECK (
    -- INSERT ve UPDATE için izin kontrolü
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'admin', 'finans')
    OR
    (public.get_my_profile_data() ->> 'access_scope') IN ('global', 'company_only')
);

-- Profiles tablosu için de INSERT politikasını netleştir (Auth trigger'ı dışında admin insert yapabiliyorsa)
DROP POLICY IF EXISTS "Admin can insert profiles" ON public.profiles;
CREATE POLICY "Admin can insert profiles" ON public.profiles
FOR INSERT WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'admin')
);
