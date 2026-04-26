-- ==========================================
-- TASKS RLS FIX
-- Görev oluşturma yetkisini tüm giriş yapmış
-- kullanıcılara açar. Saf INSERT politikası
-- oluşturur (yönetim politikasından ayrı).
-- ==========================================

-- Önce mevcut çakışan politikaları temizle
DROP POLICY IF EXISTS "Admin and Operasyon can manage tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated users can view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated users can insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can manage own tasks" ON public.tasks;

-- 1. SELECT: Giriş yapmış herkes görevleri görebilir
CREATE POLICY "Authenticated users can view tasks"
    ON public.tasks FOR SELECT
    USING (auth.role() = 'authenticated');

-- 2. INSERT: Giriş yapmış herkes görev oluşturabilir
--    Kilitlenme: created_by mutlaka kendi ID'si olmalı
CREATE POLICY "Authenticated users can insert tasks"
    ON public.tasks FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated'
        AND created_by = auth.uid()
    );

-- 3. UPDATE: Admin her şeyi, operasyon sadece kendi görevlerini güncelleyebilir
CREATE POLICY "Users can update tasks"
    ON public.tasks FOR UPDATE
    USING (
        -- Admin her şeyi güncelleyebilir
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        OR
        -- Diğerleri sadece kendilerine atanan veya kendi oluşturduğu görevleri
        assigned_to = auth.uid()
        OR
        created_by = auth.uid()
    );

-- 4. DELETE: Sadece admin silebilir
CREATE POLICY "Admins can delete tasks"
    ON public.tasks FOR DELETE
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
