-- =====================================================
-- finance_records.payment_method constraint yeniden oluştur
-- Eski constraint kaldırılır, yeni standardize değerler eklenir
-- =====================================================

-- 1. Eski constraint'i kaldır (varsa)
ALTER TABLE public.finance_records 
  DROP CONSTRAINT IF EXISTS finance_records_payment_method_check;

-- 2. Mevcut eski değerleri yeni standart değerlerle güncelle
UPDATE public.finance_records SET payment_method = 'NAKIT'       WHERE payment_method IN ('Nakit', 'nakit');
UPDATE public.finance_records SET payment_method = 'BANKA'       WHERE payment_method IN ('Banka Havalesi / EFT', 'Havale / EFT', 'banka', 'Banka');
UPDATE public.finance_records SET payment_method = 'KREDI_KARTI' WHERE payment_method IN ('Kredi Kartı', 'kredi_karti');
UPDATE public.finance_records SET payment_method = 'CEK_SENET'   WHERE payment_method IN ('Çek', 'Senet', 'Çek / Senet', 'cek_senet');
UPDATE public.finance_records SET payment_method = 'ORTAK_CARI'  WHERE payment_method IN ('Ortak Cari', 'ortak_cari');

-- Bilinmeyen değerleri güvenli varsayılana çek
UPDATE public.finance_records 
  SET payment_method = 'NAKIT' 
  WHERE payment_method NOT IN ('NAKIT', 'BANKA', 'KREDI_KARTI', 'CEK_SENET', 'ORTAK_CARI');

-- 3. Yeni constraint'i ekle (standart büyük harfli değerler)
ALTER TABLE public.finance_records 
  ADD CONSTRAINT finance_records_payment_method_check
  CHECK (payment_method IN ('NAKIT', 'BANKA', 'KREDI_KARTI', 'CEK_SENET', 'ORTAK_CARI'));

-- 4. DEFAULT değerini de güncelle
ALTER TABLE public.finance_records 
  ALTER COLUMN payment_method SET DEFAULT 'NAKIT';
