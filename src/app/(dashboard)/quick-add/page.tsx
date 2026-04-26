"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import { 
  TrendingUp, 
  TrendingDown, 
  CheckSquare, 
  Save, 
  AlertCircle,
  PlusCircle,
  Wallet,
  CreditCard,
  Building2,
  Bookmark
} from "lucide-react";
import { cn } from "@/lib/utils";
import FormField from "@/components/ui/form-field";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import { useCompany } from "@/context/company-context";
import SearchableSelect from "@/components/ui/SearchableSelect";
import CategorySelect from "@/components/finance/CategorySelect";
import PlatformSelect from "@/components/finance/PlatformSelect";

const incomeCategories = ["B2B Satış", "E-Ticaret", "Servis Gelirleri", "Diğer Gelirler"];
const expenseCategories = ["Hammadde & Malzeme", "Personel Giderleri", "Lojistik & Kargo", "Kira & Faturalar", "Teknoloji & Yazılım", "Diğer Giderler"];
const modules = ["Üretim", "E-Ticaret", "Finans", "IT", "Pazarlama"];

export default function QuickAddPage() {
  const { profile, user } = useAuth();
  const { companies, selectedCompanyId, loading, errorMsg } = useCompany();
  const [type, setType] = useState<"gelir" | "gider" | "gorev">("gelir");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string>(selectedCompanyId !== "ALL" ? selectedCompanyId : "");
  const [banks, setBanks] = useState<any[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);
  
  const [profiles, setProfiles] = useState<any[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [profilesError, setProfilesError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "",
    category_id: "",
    sub_platform: "",
    date: new Date().toISOString().split("T")[0],
    priority: "Orta",
    module: "",
    title: "",
    assigned_to: "",
    status: "Bekliyor",
    payment_method: "NAKIT",
    document_no: "",
    banka_id: ""
  });

  // Fetch users for assignment with role-based logic
  React.useEffect(() => {
    if (type === "gorev") {
      fetchProfiles();
    } else {
      fetchBanks();
    }
  }, [type, profile, selectedCompany]);

  const fetchProfiles = async () => {
    setProfilesLoading(true);
    setProfilesError(null);
    try {
      // 1. Temel Sorgu: Sadece aktif kullanıcıları alfabetik getir
      const response = await supabase
        .from("profiles")
        .select("id, full_name, email, role, is_active")
        .eq("is_active", true)
        .order("full_name");

      // 2. Detaylı Loglama (Kullanıcının isteği üzerine)
      console.log("👤 profiles raw response", {
        data: response.data,
        error: response.error,
        status: response.status,
        statusText: response.statusText,
        fullResponse: response
      });

      if (response.error) {
        console.error("❌ profiles fetch error details:", JSON.stringify(response.error, null, 2));
        throw response.error;
      }

      let data = response.data || [];

      // 3. Yetki Filtrelemesi (Frontend Seviyesinde)
      if (profile?.role === "operasyon") {
        // Operasyon sadece kendini görür
        console.log("🔐 Operasyon kısıtlaması uygulandı: Sadece self-assignment.");
        data = data.filter(p => p.id === profile.id);
      }

      setProfiles(data);
      
      // Default to self for operasyon if found
      if (profile?.role === "operasyon" && data.length > 0) {
        setFormData(prev => ({ ...prev, assigned_to: data[0].id }));
      }

      if (data.length === 0) {
        console.warn("⚠️ Seçilebilecek aktif kullanıcı bulunamadı.");
      }

    } catch (err: any) {
      console.error("❌ Profil listesi yüklenemedi:", err);
      setProfilesError("Kullanıcı listesi yüklenemedi.");
      setMessage({ type: "error", text: "Kullanıcı listesi yüklenemedi. Lütfen yöneticiye başvurun." });
    } finally {
      setProfilesLoading(false);
    }
  };

  const fetchBanks = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("banks")
        .select("*")
        .eq("aktif_mi", true);
      
      if (selectedCompany === "COMMON") {
        query = query.is("company_id", null);
      } else if (selectedCompany) {
        query = query.eq("company_id", selectedCompany);
      }

      const { data, error: bankError } = await query;
      if (bankError) throw bankError;

      if (data) {
        setBanks(data);
        // Reset bank selection if company changes and current bank is not in new list
        if (data.length > 0) {
          const isCurrentBankInList = data.some(b => b.id === formData.banka_id);
          if (!isCurrentBankInList && (formData.payment_method !== "Nakit")) {
            setFormData(prev => ({ ...prev, banka_id: data[0].id }));
          }
        } else {
          setFormData(prev => ({ ...prev, banka_id: "" }));
        }
      }
    } catch (err) {
      console.error("❌ Banka listesi yüklenemedi:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) {
      setMessage({ type: "error", text: "Lütfen bir şirket seçin." });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    // Validation
    if (type !== "gorev") {
      if (!formData.category_id) {
        setMessage({ type: "error", text: "Lütfen bir kategori seçin." });
        setIsLoading(false);
        return;
      }
      if (formData.payment_method !== "Nakit" && selectedCompany !== "COMMON" && !formData.banka_id) {
        setMessage({ type: "error", text: "Bu ödeme yöntemi için bir banka hesabı seçmelisiniz." });
        setIsLoading(false);
        return;
      }
    }

    try {
      if (type === "gorev") {
        const payload = {
          title: formData.title || formData.description,
          status: "Bekliyor",
          priority: formData.priority,
          module: formData.module || "Genel",
          due_date: formData.date ? `${formData.date}T12:00:00+03:00` : null,
          created_by: profile?.id,
          assigned_to: formData.assigned_to || null,
          company_id: selectedCompany === "COMMON" ? null : selectedCompany
        };
        const { error } = await supabase.from("tasks").insert([payload]);
        if (error) {
          console.error("❌ Task insert error:", error);
          throw error;
        }
      } else {
        const payload = {
          type: type,
          category: formData.category || null,
          amount: parseFloat(formData.amount),
          date: formData.date,
          description: formData.description.trim(),
          sub_platform: formData.sub_platform || null,
          status: formData.status,
          payment_method: formData.payment_method,
          document_no: formData.document_no.trim() || null,
          banka_id: formData.banka_id || null,
          created_by: profile?.id,
          company_id: selectedCompany === "COMMON" ? null : selectedCompany,
          category_id: formData.category_id || null
        };

        console.log("🚀 Quick Add Submitting Finance Record:", payload);

        const { error } = await supabase.from("finance_records").insert([payload]);
        
        if (error) {
          console.error("❌ Finance insert error full:", error);
          console.error("❌ Finance insert error details:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            payload
          });
          throw error;
        }
      }
      
      setMessage({ type: "success", text: "Kayıt başarıyla oluşturuldu!" });
      setFormData({
        description: "",
        amount: "",
        category: "",
        sub_platform: "",
        date: new Date().toISOString().split("T")[0],
        priority: "Orta",
        module: "",
        title: "",
        assigned_to: (profile?.role === "operasyon" ? profile.id : ""),
        status: "Bekliyor",
        payment_method: "NAKIT",
        document_no: "",
        banka_id: "",
        category_id: ""
      });
    } catch (err: any) {
      setMessage({ type: "error", text: "Hata oluştu: " + (err.message || "Bilinmeyen hata") });
    } finally {
      setIsLoading(false);
    }
  };

  const setSelfAssign = () => {
    if (profile?.id) {
      setFormData(prev => ({ ...prev, assigned_to: profile.id }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Hızlı Kayıt</h1>
        <p className="text-slate-500 text-sm font-medium">Finansal işlem veya yeni görevleri hızlıca ekleyin.</p>
      </div>

      <div className="flex p-1.5 bg-slate-200/50 rounded-3xl gap-1 overflow-hidden">
        <button 
          onClick={() => { setType("gelir"); setFormData(prev => ({ ...prev, status: "Bekliyor" })); }}
          className={cn(
            "flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
            type === "gelir" ? "bg-white text-green-600 shadow-xl" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <TrendingUp className="w-4 h-4" /> Gelir Ekle
        </button>
        <button 
          onClick={() => { setType("gider"); setFormData(prev => ({ ...prev, status: "Bekliyor" })); }}
          className={cn(
            "flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
            type === "gider" ? "bg-white text-red-600 shadow-xl" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <TrendingDown className="w-4 h-4" /> Gider Ekle
        </button>
        <button 
          onClick={() => { setType("gorev"); setFormData(prev => ({ ...prev, status: "Bekliyor" })); }}
          className={cn(
            "flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
            type === "gorev" ? "bg-white text-blue-600 shadow-xl" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <CheckSquare className="w-4 h-4" /> Görev Ekle
        </button>
      </div>

      <div className="glass-card p-10">
        {(message || errorMsg) && (
          <div className={cn(
            "mb-8 p-5 rounded-2xl flex items-center gap-4 font-bold text-sm shadow-sm",
            (message?.type === "success" && !errorMsg) ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
          )}>
            <PlusCircle className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1 italic">{errorMsg ? `Sistem Hatası: ${errorMsg}` : message?.text}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8">
          <div className="space-y-6">
            <FormField label="ŞİRKET SEÇİMİ *">
              <Select 
                value={selectedCompany}
                onChange={(e) => {
                  setSelectedCompany(e.target.value);
                  setFormData(prev => ({ ...prev, banka_id: "", category_id: "", category: "" }));
                }}
                required
                disabled={loading}
                className="border-blue-200 bg-blue-50/20 font-bold"
              >
                <option value="">{loading ? "Şirketler yükleniyor..." : "Şirket Seçiniz..."}</option>
                <option value="COMMON" className="font-black text-blue-600">🏛️ TÜM ŞİRKETLER / ORTAK</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.company_name}</option>
                ))}
              </Select>
              {companies.length === 0 && !loading && !errorMsg && (
                <p className="text-[10px] font-bold text-red-500 mt-2 uppercase tracking-widest flex items-center gap-1">
                   <AlertCircle className="w-3 h-3" /> Kayıtlı şirket bulunamadı.
                </p>
              )}
            </FormField>

            <FormField label={type === "gorev" ? "GÖREV BAŞLIĞI *" : "AÇIKLAMA *"}>
              <Input 
                type="text" 
                required
                className="text-lg font-black tracking-tight"
                placeholder={type === "gorev" ? "Görev ismi girin..." : "İşlem detayı..."}
                value={type === "gorev" ? formData.title : formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, [type === "gorev" ? "title" : "description"]: e.target.value }))}
              />
            </FormField>

            {type === "gorev" && (
              <FormField label="ATANACAK KİŞİ *">
                <div className="space-y-3">
                  <SearchableSelect 
                    options={profiles.map(p => ({ id: p.id, label: p.full_name }))}
                    value={formData.assigned_to}
                    onChange={(val) => setFormData(prev => ({ ...prev, assigned_to: val }))}
                    placeholder={profilesLoading ? "Yükleniyor..." : "İsim ile arayın..."}
                    disabled={profilesLoading}
                  />
                  {profilesError && (
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {profilesError}
                    </p>
                  )}
                  {profile?.role !== "operasyon" && (
                    <button 
                      type="button"
                      onClick={setSelfAssign}
                      className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest flex items-center gap-1.5 transition-colors"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Kendime Ata
                    </button>
                  )}
                </div>
              </FormField>
            )}

            <div className="grid grid-cols-2 gap-8">
              {type !== "gorev" ? (
                <FormField label="TUTAR (TRY) *">
                  <Input 
                    type="number" 
                    required
                    step="0.01"
                    className="font-mono font-black text-blue-600 text-xl italic"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </FormField>
              ) : (
                <FormField label="TARİH *">
                  <Input 
                    type="date" 
                    required
                    className="font-bold uppercase tracking-tight"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  />
                </FormField>
              )}

              {type !== "gorev" && (
                <FormField label="TARİH *">
                  <Input 
                    type="date" 
                    required
                    className="font-bold uppercase tracking-tight"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  />
                </FormField>
              )}
            </div>

            <div className={cn("grid gap-8", type !== "gorev" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1")}>
              {type !== "gorev" && (
                <>
                  <FormField label="ÖDEME TÜRÜ">
                    <Select 
                      icon={<Wallet className="w-4 h-4" />}
                      value={formData.payment_method}
                      onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                      required
                      className="font-bold"
                    >
                      <option value="NAKIT">Nakit</option>
                      <option value="BANKA">Havale / EFT</option>
                      <option value="KREDI_KARTI">Kredi Kartı</option>
                      <option value="CEK_SENET">Çek / Senet</option>
                    </Select>
                  </FormField>

                  <FormField label="BELGE / SERİ NO">
                    <Input 
                      icon={<Bookmark className="w-4 h-4" />}
                      placeholder="Fatura, Çek, Dekont No..."
                      value={formData.document_no}
                      onChange={(e) => setFormData(prev => ({ ...prev, document_no: e.target.value }))}
                      className={cn(
                        "font-bold uppercase tracking-tight",
                        (formData.payment_method === "Çek" || formData.payment_method === "Senet") && "border-blue-300 bg-blue-50/20 shadow-inner"
                      )}
                    />
                    {(formData.payment_method === "Çek" || formData.payment_method === "Senet") && (
                      <p className="text-[10px] text-blue-600 font-black mt-2 uppercase animate-pulse italic">
                        * {formData.payment_method} için Belge No girilmesi zorunludur.
                      </p>
                    )}
                  </FormField>
                </>
              )}
            </div>

            {type !== "gorev" && (
              <FormField label={formData.payment_method === "Nakit" ? "İLGİLİ BANKA (OPSİYONEL)" : "İLGİLİ BANKA / KART *"}>
                <Select 
                  icon={<CreditCard className="w-4 h-4" />}
                  value={formData.banka_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, banka_id: e.target.value }))}
                  disabled={!selectedCompany}
                  className={cn(
                    "font-bold",
                    formData.payment_method !== "Nakit" ? "border-indigo-200 bg-indigo-50/20" : "border-slate-200"
                  )}
                >
                  {!selectedCompany && <option value="">Önce Şirket Seçiniz...</option>}
                  {selectedCompany === "COMMON" && banks.length === 0 && <option value="">Ortak Banka Hesabı Bulunamadı (Opsiyonel)</option>}
                  {selectedCompany && selectedCompany !== "COMMON" && banks.length === 0 && <option value="">Banka Kaydı Bulunamadı</option>}
                  {banks.length > 0 && <option value="">Banka Seçiniz...</option>}
                  {banks.map(bank => (
                    <option key={bank.id} value={bank.id}>{bank.banka_adi} - {bank.hesap_adi} ({bank.para_birimi})</option>
                  ))}
                </Select>
              </FormField>
            )}

            <div className={cn("grid gap-8", type === "gelir" && formData.category === "E-Ticaret" ? "grid-cols-2" : "grid-cols-1")}>

              {type !== "gorev" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField label="KATEGORİ *">
                    <CategorySelect 
                      type={type as "gelir" | "gider"}
                      companyId={selectedCompany}
                      value={formData.category_id}
                      onSelect={(cat) => setFormData(prev => ({ ...prev, category_id: cat.id, category: cat.name }))}
                    />
                  </FormField>

                  <FormField label="DURUM">
                    <Select 
                      value={formData.status} 
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="font-bold text-sm"
                    >
                      {type === "gelir" ? (
                        <>
                          <option value="Bekliyor">Bekliyor</option>
                          <option value="Tahsil Edildi">Tahsil Edildi</option>
                          <option value="Gecikti">Gecikti</option>
                          <option value="İptal Edildi">İptal Edildi</option>
                        </>
                      ) : (
                        <>
                          <option value="Bekliyor">Bekliyor</option>
                          <option value="Ödendi">Ödendi</option>
                          <option value="Gecikti">Gecikti</option>
                          <option value="İptal Edildi">İptal Edildi</option>
                        </>
                      )}
                    </Select>
                  </FormField>
                </div>
              )}

              {type === "gelir" && formData.category === "E-Ticaret" && (
                <FormField label="PLATFORM">
                  <PlatformSelect 
                    value={formData.sub_platform}
                    onChange={(val) => setFormData(prev => ({ ...prev, sub_platform: val }))}
                    className="border-orange-100 bg-orange-50/10"
                  />
                </FormField>
              )}
            </div>

            {type === "gorev" && (
              <div className="grid grid-cols-2 gap-8">
                <FormField label="MODÜL">
                  <Select 
                    value={formData.module}
                    onChange={(e) => setFormData(prev => ({ ...prev, module: e.target.value }))}
                    required
                    className="font-bold"
                  >
                    <option value="">Seçin...</option>
                    {modules.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </Select>
                </FormField>

                <FormField label="ÖNCELİK">
                  <Select 
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                    className="font-bold"
                  >
                    <option value="Düşük">Düşük</option>
                    <option value="Orta">Orta</option>
                    <option value="Yüksek">Yüksek</option>
                  </Select>
                </FormField>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className={cn(
              "w-full py-5 rounded-[2rem] flex items-center justify-center gap-4 font-black text-xl tracking-tight transition-all",
              type === "gelir" ? "bg-green-600 hover:bg-green-700 shadow-green-600/20 shadow-2xl" : 
              type === "gider" ? "bg-red-600 hover:bg-red-700 shadow-red-600/20 shadow-2xl" : 
              "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20 shadow-2xl",
              "text-white disabled:opacity-50 active:scale-[0.98]"
            )}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-6 h-6" /> Kaydet
              </>
            )}
          </button>
        </form>
      </div>

      <div className="bg-slate-900 p-8 rounded-[2.5rem] flex items-start gap-5 shadow-inner">
        <AlertCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
        <div className="text-xs text-slate-300 leading-relaxed font-bold uppercase tracking-widest">
          <strong>Sistem Notu:</strong> Yazılan veriler anında şirket veritabanına ve takvime (Görevler için) yansır. 
          Operasyon rolündeki kullanıcılar görevleri sadece kendi üzerlerine atayabilirler. 
          İşlem bittiğinde "Kaydet" butonu ile süreci tamamlayın.
        </div>
      </div>
    </div>
  );
}
