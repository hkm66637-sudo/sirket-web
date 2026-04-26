-- 1. Banks Tablosuna Eksik Kolonları Ekle
ALTER TABLE public.banks ADD COLUMN IF NOT EXISTS iban text;
ALTER TABLE public.banks ADD COLUMN IF NOT EXISTS aciklama text;

-- 2. RLS Politikalarını Düzenle (INSERT için spesifik yetki)
-- Not: FOR ALL bazen INSERT WITH CHECK gerektirir, netleştirelim.

DROP POLICY IF EXISTS "Admin and Finans can manage banks" ON public.banks;

-- SELECT Yetkisi: Kimlik doğrulamış herkes (Dashboard'da isimlerin görünmesi için)
CREATE POLICY "Authenticated users can view banks" 
    ON public.banks FOR SELECT 
    USING (auth.role() = 'authenticated');

-- INSERT Yetkisi: Sadece Admin ve Finans
CREATE POLICY "Admin and Finans can insert banks" 
    ON public.banks FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'finans')
        )
    );

-- UPDATE/DELETE Yetkisi: Sadece Admin ve Finans
CREATE POLICY "Admin and Finans can update/delete banks" 
    ON public.banks FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'finans')
        )
    );
