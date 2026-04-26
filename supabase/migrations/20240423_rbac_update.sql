-- 1. Profiles Tablosu Genişletme
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS manager_id uuid REFERENCES public.profiles(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS access_level text DEFAULT 'self_only'; -- self_only, department_only, company_only, global
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'active'; -- active, inactive

-- 2. Mevcut Rolleri Güncelle (Opsiyonel: super_admin eklemesi)
-- Not: role sütunu zaten text olduğu için kısıtlama yoksa dokunmuyoruz.

-- 3. handle_new_user Tetikleyicisini Güncelle
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    role, 
    email, 
    is_active, 
    status, 
    access_level,
    company_id
  )
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'Yeni Kullanıcı'), 
    COALESCE(new.raw_user_meta_data->>'role', 'uretim_personeli'), -- Varsayılan en düşük yetki
    new.email,
    true,
    'active',
    'self_only',
    (SELECT id FROM companies WHERE company_name = 'Tabansa' LIMIT 1) -- Varsayılan şirket
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
