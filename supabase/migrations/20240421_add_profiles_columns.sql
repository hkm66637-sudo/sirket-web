-- 1. Profiles Tablosu Güncellemesi
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- 2. Mevcut Kayıtları Güncelle (email bilgisini auth.users'dan çek)
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- 3. handle_new_user Tetikleyicisini Güncelle
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, email, is_active)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'Yeni Kullanıcı'), 
    'operasyon',
    new.email,
    true
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RLS Politikası (Herkes profilleri görebilmeli ki isimler 'Bilinmiyor' kalmasın, 
-- ancak görev atama seçicisi frontend'den filtrelenecek)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
    ON public.profiles FOR SELECT USING (true);
