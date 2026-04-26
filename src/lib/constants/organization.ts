export const ACCESS_LEVELS = [
  { value: 'self_only', label: 'Sadece Kendi Kayıtları' },
  { value: 'department_only', label: 'Birim Kayıtları' },
  { value: 'company_only', label: 'Şirket Kayıtları' },
  { value: 'global', label: 'Tüm Sistem' }
];

export const DEPARTMENTS = [
  "Üretim",
  "Pazarlama",
  "Depo",
  "E-Ticaret",
  "Finans",
  "Yönetim"
];

export const ROLE_LABELS: Record<string, string> = {
  super_admin: "Süper Admin",
  admin: "Yönetici (Admin)",
  uretim_muduru: "Üretim Müdürü",
  uretim_personeli: "Üretim Personeli",
  pazarlama_muduru: "Pazarlama Müdürü",
  pazarlama_personeli: "Pazarlama Personeli",
  depo_yoneticisi: "Depo Yöneticisi",
  depo_personeli: "Depo Personeli",
  eticaret_yoneticisi: "E-Ticaret Yöneticisi",
  eticaret_personeli: "E-Ticaret Personeli",
  muhasebe_muduru: "Muhasebe Müdürü",
  muhasebe_personeli: "Muhasebe Personeli",
  operasyon: "Operasyon Sorumlusu",
  finans: "Finans Sorumlusu"
};

export const COMPANY_TYPES = {
  TABANSA: "Üretim / Toptan",
  ETİCARET: "E-Ticaret",
  FINANS: "Merkez"
};
