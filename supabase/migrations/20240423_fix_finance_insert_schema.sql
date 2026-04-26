-- Finance records tablosuna eksik olan ve ilişki/kategori yönetimi için kritik kolonları ekle

ALTER TABLE public.finance_records 
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.finance_categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS department_id text; -- Profiles tablosundaki department_id ile uyumlu olması için text kullanıyoruz

-- Mevcut 'category' (text) verilerini 'category_id' ile eşleştirmeye çalış (Opsiyonel ama iyi bir pratik)
DO $$ 
BEGIN 
    UPDATE public.finance_records fr
    SET category_id = fc.id
    FROM public.finance_categories fc
    WHERE fr.category = fc.name AND fr.category_id IS NULL;
END $$;
