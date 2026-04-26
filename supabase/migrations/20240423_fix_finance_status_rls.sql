-- Finance records status constraint update
-- Add 'Gecikti' and ensure 'İptal Edildi' is correctly supported

ALTER TABLE public.finance_records 
DROP CONSTRAINT IF EXISTS finance_records_status_check;

ALTER TABLE public.finance_records 
ADD CONSTRAINT finance_records_status_check 
CHECK (status IN ('Ödendi', 'Bekliyor', 'İptal Edildi', 'Tahsil Edildi', 'Gecikti', 'İptal'));

-- Ensure RLS update policy is robust for management roles
DROP POLICY IF EXISTS "Finance Update Policy" ON public.finance_records;

CREATE POLICY "Finance Update Policy" ON public.finance_records
FOR UPDATE USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'admin', 'finans', 'muhasebe_muduru', 'muhasebe_personeli')
    OR (public.get_my_profile_data() ->> 'role') IN ('super_admin', 'admin', 'finans', 'muhasebe_muduru', 'muhasebe_personeli')
) WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'admin', 'finans', 'muhasebe_muduru', 'muhasebe_personeli')
    OR (public.get_my_profile_data() ->> 'role') IN ('super_admin', 'admin', 'finans', 'muhasebe_muduru', 'muhasebe_personeli')
);

-- Also ensure manage access for companies and categories for these roles
DROP POLICY IF EXISTS "Management can manage finance categories" ON public.finance_categories;
CREATE POLICY "Management can manage finance categories" ON public.finance_categories
FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'admin', 'finans', 'muhasebe_muduru')
    OR (public.get_my_profile_data() ->> 'role') IN ('super_admin', 'admin', 'finans', 'muhasebe_muduru')
) WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'admin', 'finans', 'muhasebe_muduru')
    OR (public.get_my_profile_data() ->> 'role') IN ('super_admin', 'admin', 'finans', 'muhasebe_muduru')
);
