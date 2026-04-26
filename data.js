
// Mock Data for the Turkish Company Admin Panel

const DATA = {
  user: {
    name: "Ahmet Yılmaz",
    role: "Sistem Yöneticisi",
    avatar: "AY"
  },

  dashboardKPIs: [
    { label: "Bu Ay Gelir", value: "₺ 487.350", change: "+12.4%", up: true, color: "green" },
    { label: "Bu Ay Gider", value: "₺ 312.800", change: "+5.1%", up: false, color: "red" },
    { label: "Net Durum", value: "₺ 174.550", change: "+22.8%", up: true, color: "blue" },
    { label: "Bekleyen Görev", value: "23", change: "-3 bugün", up: true, color: "orange" },
  ],

  gorevler: [
    { id: 1, baslik: "Q2 stok sayımı tamamla", durum: "Devam Ediyor", oncelik: "Yüksek", atanan: "Mehmet K.", bitis: "2026-04-22", modul: "Üretim" },
    { id: 2, baslik: "Tedarikçi fatura kontrolü", durum: "Bekliyor", oncelik: "Orta", atanan: "Ayşe D.", bitis: "2026-04-23", modul: "Finans" },
    { id: 3, baslik: "Web sitesi ürün güncellemesi", durum: "Devam Ediyor", oncelik: "Orta", atanan: "Can T.", bitis: "2026-04-24", modul: "E-Ticaret" },
    { id: 4, baslik: "Müşteri iade işlemleri", durum: "Gecikmiş", oncelik: "Yüksek", atanan: "Elif S.", bitis: "2026-04-19", modul: "E-Ticaret" },
    { id: 5, baslik: "Aylık bordro hazırlama", durum: "Bekliyor", oncelik: "Yüksek", atanan: "Ahmet Y.", bitis: "2026-04-25", modul: "Finans" },
    { id: 6, baslik: "Depo düzenleme planı", durum: "Bekliyor", oncelik: "Düşük", atanan: "Murat B.", bitis: "2026-04-28", modul: "Üretim" },
    { id: 7, baslik: "Sosyal medya içerik planı", durum: "Tamamlandı", oncelik: "Düşük", atanan: "Zeynep A.", bitis: "2026-04-18", modul: "Pazarlama" },
    { id: 8, baslik: "Sunucu yedekleme kontrolü", durum: "Tamamlandı", oncelik: "Orta", atanan: "Can T.", bitis: "2026-04-17", modul: "IT" },
  ],

  yaklaşanOdemeler: [
    { alici: "Aras Kargo", tutar: "₺ 8.400", tarih: "2026-04-21", kategori: "Lojistik", durum: "Bekliyor" },
    { alici: "Elektrik Faturası", tutar: "₺ 3.200", tarih: "2026-04-22", kategori: "Fatura", durum: "Bekliyor" },
    { alici: "Yazılım Lisansı (SaaS)", tutar: "₺ 1.850", tarih: "2026-04-23", kategori: "Teknoloji", durum: "Bekliyor" },
    { alici: "Hammadde Tedarikçisi A", tutar: "₺ 42.000", tarih: "2026-04-25", kategori: "Hammadde", durum: "Onay Bekliyor" },
    { alici: "Ofis Kirası", tutar: "₺ 18.500", tarih: "2026-04-30", kategori: "Kira", durum: "Bekliyor" },
  ],

  yaklaşanTahsilatlar: [
    { musteri: "Teknosa A.Ş.", tutar: "₺ 64.500", tarih: "2026-04-21", kategori: "B2B Satış", durum: "Bekleniyor" },
    { musteri: "Online Mağaza (Trendyol)", tutar: "₺ 28.700", tarih: "2026-04-22", kategori: "E-Ticaret", durum: "Bekleniyor" },
    { musteri: "Arçelik Bayii", tutar: "₺ 95.200", tarih: "2026-04-24", kategori: "B2B Satış", durum: "Gecikmiş" },
    { musteri: "Hepsiburada Ödemesi", tutar: "₺ 19.300", tarih: "2026-04-26", kategori: "E-Ticaret", durum: "Bekleniyor" },
  ],

  gelirGider: [
    { ay: "Oca", gelir: 380000, gider: 265000 },
    { ay: "Şub", gelir: 420000, gider: 290000 },
    { ay: "Mar", gelir: 395000, gider: 275000 },
    { ay: "Nis", gelir: 487350, gider: 312800 },
    { ay: "May", gelir: 0, gider: 0 },
    { ay: "Haz", gelir: 0, gider: 0 },
  ],

  gelirKalemleri: [
    { kategori: "B2B Satış", tutar: 245000, pay: "50.3%", degisim: "+8.2%" },
    { kategori: "E-Ticaret", tutar: 142500, tutar2: "₺142.500", pay: "29.2%", degisim: "+18.4%" },
    { kategori: "Servis Gelirleri", tutar: 64800, pay: "13.3%", degisim: "+4.1%" },
    { kategori: "Diğer Gelirler", tutar: 35050, pay: "7.2%", degisim: "-2.3%" },
  ],

  giderKalemleri: [
    { kategori: "Hammadde & Malzeme", tutar: 128500, pay: "41.1%", degisim: "+3.2%" },
    { kategori: "Personel Giderleri", tutar: 87400, pay: "27.9%", degisim: "+5.0%" },
    { kategori: "Lojistik & Kargo", tutar: 42300, pay: "13.5%", degisim: "+7.8%" },
    { kategori: "Kira & Faturalar", tutar: 29600, pay: "9.5%", degisim: "+1.2%" },
    { kategori: "Teknoloji & Yazılım", tutar: 14800, pay: "4.7%", degisim: "+22.1%" },
    { kategori: "Diğer Giderler", tutar: 10200, pay: "3.3%", degisim: "-5.4%" },
  ],

  kullanicilar: [
    { id: 1, ad: "Ahmet Yılmaz", email: "ahmet@sirket.com", rol: "Yönetici", durum: "Aktif", sonGiris: "2026-04-20 09:14", modul: ["Tümü"] },
    { id: 2, ad: "Mehmet Kaya", email: "mehmet@sirket.com", rol: "Üretim Sorumlusu", durum: "Aktif", sonGiris: "2026-04-20 08:47", modul: ["Görevler", "Takvim"] },
    { id: 3, ad: "Ayşe Demir", email: "ayse@sirket.com", rol: "Muhasebe", durum: "Aktif", sonGiris: "2026-04-19 17:30", modul: ["Finans", "Gelir-Gider"] },
    { id: 4, ad: "Can Toprak", email: "can@sirket.com", rol: "E-Ticaret Sorumlusu", durum: "Aktif", sonGiris: "2026-04-20 10:02", modul: ["Görevler", "E-Ticaret"] },
    { id: 5, ad: "Elif Şahin", email: "elif@sirket.com", rol: "Müşteri Hizmetleri", durum: "Pasif", sonGiris: "2026-04-15 14:22", modul: ["Görevler"] },
    { id: 6, ad: "Murat Bozkurt", email: "murat@sirket.com", rol: "Depo Sorumlusu", durum: "Aktif", sonGiris: "2026-04-20 07:58", modul: ["Görevler", "Takvim"] },
    { id: 7, ad: "Zeynep Arslan", email: "zeynep@sirket.com", rol: "Pazarlama", durum: "Aktif", sonGiris: "2026-04-18 16:45", modul: ["Görevler"] },
  ],

  takvimEtkinlikleri: [
    { tarih: "2026-04-20", baslik: "Haftalık Ekip Toplantısı", tur: "toplanti", saat: "10:00" },
    { tarih: "2026-04-21", baslik: "Tedarikçi Görüşmesi", tur: "gorusme", saat: "14:00" },
    { tarih: "2026-04-22", baslik: "Stok Sayımı", tur: "uretim", saat: "09:00" },
    { tarih: "2026-04-23", baslik: "Fatura Ödemesi - Aras", tur: "finans", saat: "12:00" },
    { tarih: "2026-04-24", baslik: "Tahsilat - Arçelik", tur: "tahsilat", saat: "15:00" },
    { tarih: "2026-04-25", baslik: "Bordro Ödemesi", tur: "finans", saat: "09:00" },
    { tarih: "2026-04-28", baslik: "Aylık Değerlendirme", tur: "toplanti", saat: "11:00" },
    { tarih: "2026-04-30", baslik: "Kira Ödemesi", tur: "finans", saat: "09:00" },
  ],
};
