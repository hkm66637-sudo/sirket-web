-- =====================================================
-- finance_records tablosuna Ortak Cari sütunları ekle
-- Güvenli: IF NOT EXISTS ile birden fazla çalıştırılabilir
-- =====================================================

-- 1. type constraint'i 'ortak' tipini destekleyecek şekilde güncelle
ALTER TABLE public.finance_records DROP CONSTRAINT IF EXISTS finance_records_type_check;
ALTER TABLE public.finance_records ADD CONSTRAINT finance_records_type_check 
  CHECK (type IN ('gelir', 'gider', 'ortak'));

-- 2. source_type kolonu ekle (ödeme kaynağı: BANKA, NAKIT, KREDI_KARTI, CEK_SENET, ORTAK_CARI)
--    Mevcut kayıtlar 'NORMAL' olarak işaretlenecek
ALTER TABLE public.finance_records 
  ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'NORMAL';

-- 3. partner_id kolonu ekle (Ortak Cari işlemleri için)
ALTER TABLE public.finance_records 
  ADD COLUMN IF NOT EXISTS partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL;

-- 4. Mevcut ortak işlemlerini işaretle (eğer varsa)
UPDATE public.finance_records 
SET source_type = 'ORTAK_CARI'
WHERE source_type = 'NORMAL' 
  AND partner_id IS NOT NULL;

