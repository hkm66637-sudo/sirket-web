-- 1. Profiles tablosundaki rol kısıtlamasını kaldır (Yeni kurumsal rollere izin ver)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Eğer sütun isimleri farklıysa eşitle (Kullanıcı talebine göre mapping desteği)
-- Not: access_level -> access_scope ve department -> department_id dönüşümü isteniyorsa:
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='access_level') THEN
        ALTER TABLE public.profiles RENAME COLUMN access_level TO access_scope;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='department') THEN
        ALTER TABLE public.profiles RENAME COLUMN department TO department_id;
    END IF;
END $$;

-- 3. handle_new_user Tetikleyicisini En Güvenli Hale Getir
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    role, 
    email, 
    status, 
    access_scope
  )
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'Yeni Kullanıcı'), 
    COALESCE(new.raw_user_meta_data->>'role', 'uretim_personeli'),
    new.email,
    'active',
    'self_only'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    email = EXCLUDED.email;
    
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Hata olsa bile auth user oluşsun, biz sonra manuel güncelleriz veya logdan bakarız
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
