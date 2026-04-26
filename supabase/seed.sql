-- Seed Data for Web Management Panel (Updated for Analytics)

-- 1. Tasks (gorevler) - 2026-04-20 Bugünü simüle eder
INSERT INTO tasks (title, status, priority, module, due_date) VALUES 
('Trendyol Stok Entegrasyonu Kontrolü', 'Devam Ediyor', 'Yüksek', 'E-Ticaret', '2026-04-20 10:00:00+03'),
('Yeni Üretim Hattı Planlaması', 'Bekliyor', 'Orta', 'Üretim', '2026-04-20 14:00:00+03'),
('Finansal Raporların Kontrolü', 'Gecikmiş', 'Yüksek', 'Finans', '2026-04-19 09:00:00+03'),
('Amazon Ürün Listeleme Güncellemesi', 'Tamamlandı', 'Düşük', 'E-Ticaret', '2026-04-20 16:00:00+03'),
('Müşteri Şikayetleri Değerlendirmesi', 'Bekliyor', 'Orta', 'Pazarlama', '2026-04-20 11:30:00+03');

-- 2. Finance Records (gelirGider) - Gerçekçi grafik için geçmiş ve bugün
INSERT INTO finance_records (type, category, amount, date, description, document_no, sub_platform) VALUES
('gelir', 'B2B Satış', 245000, '2026-02-15', 'Ocak/Şubat B2B Satış Tahsilatı', 'FAT-101', NULL),
('gider', 'Hammadde', 128500, '2026-02-20', 'Kumaş ve Aksesuar Alımı', 'GDR-101', NULL),
('gelir', 'E-Ticaret', 142500, '2026-03-05', 'Mart Ayı Trendyol Hak edişi', 'TR-305', 'Trendyol'),
('gider', 'Personel', 85000, '2026-03-28', 'Mart Ayı Maaş Ödemeleri', 'BORD-03', NULL),
('gelir', 'B2B Satış', 285000, '2026-04-10', 'Nisan Ayı Toplu Satış (A-Z Corp)', 'FAT-410', NULL),
('gelir', 'Servis', 64800, '2026-04-15', 'Periyodik Bakım Hizmeti', 'SRV-415', NULL),
('gider', 'Lojistik', 42300, '2026-04-18', 'Aras Kargo — Nisan Gönderimleri', 'GDR-418', 'Aras Kargo'),
('gider', 'Personel', 87400, '2026-04-20', 'Nisan Ayı Personel Ödemeleri', 'BORD-04', NULL),
('gider', 'Kira', 29600, '2026-04-20', 'Nisan Ayı Ofis Kirası', 'KRA-04', NULL);

-- 3. Calendar Events
INSERT INTO calendar_events (title, type, start_at) VALUES
('Haftalık Ekip Toplantısı', 'toplanti', '2026-04-20 10:00:00'),
('Tedarikçi Görüşmesi', 'gorusme', '2026-04-21 14:00:00'),
('Stok Sayımı', 'uretim', '2026-04-22 09:00:00'),
('Kira Ödemesi', 'finans', '2026-04-30 09:00:00');
