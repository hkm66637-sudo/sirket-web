-- 1. Sonsuz döngü (recursion) hatasını önlemek için yardımcı fonksiyonlar
-- SECURITY DEFINER fonksiyonları RLS'yi baypas eder ve döngüye girmez.

CREATE OR REPLACE FUNCTION public.get_my_profile_data()
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'role', role,
        'access_scope', access_scope,
        'company_id', company_id,
        'department_id', department_id
    ) INTO result
    FROM public.profiles
    WHERE id = auth.uid();
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 2. Mevcut hatalı policy'yi kaldır
DROP POLICY IF EXISTS "Profiles access policy" ON public.profiles;

-- 3. Yeni, döngü içermeyen (Non-recursive) Policy Yapısı
-- Not: JWT metadata'sından rol kontrolü yapmak en hızlı ve güvenli yoldur.

CREATE POLICY "Profiles access policy" ON public.profiles
FOR ALL USING (
    -- Kural 0: Kullanıcı kendi profilini her zaman görebilir/düzenleyebilir
    id = auth.uid()
    OR
    -- Kural 1: JWT metadata'sından admin kontrolü (Tabloya tekrar bakmaz, recursion yapmaz)
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'admin')
    OR
    -- Kural 2: Hiyerarşik erişim kontrolleri (Fonksiyon üzerinden güvenli kontrol)
    (
        CASE 
            -- Global erişimi olanlar her şeyi okur
            WHEN (public.get_my_profile_data() ->> 'access_scope') = 'global' THEN true
            
            -- Şirket bazlı erişim
            WHEN (public.get_my_profile_data() ->> 'access_scope') = 'company_only' 
                THEN company_id = (public.get_my_profile_data() ->> 'company_id')::uuid
                
            -- Birim bazlı erişim
            WHEN (public.get_my_profile_data() ->> 'access_scope') = 'department_only' 
                THEN (department_id = (public.get_my_profile_data() ->> 'department_id') 
                      AND company_id = (public.get_my_profile_data() ->> 'company_id')::uuid)
            
            ELSE false
        END
    )
);

-- 4. Diğer tablolar için de benzer recursion riskini azaltmak adına 
-- admin kontrolünü JWT üzerinden yapacak şekilde güncellemek iyi bir pratiktir.
-- Örnek: finance_records, tasks vb. (Eğer onlarda da profiles tablosuna bakılıyorsa)
