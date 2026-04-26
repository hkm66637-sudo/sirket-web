"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import { X, Send, Calendar, Tag, CreditCard, Building2, Bookmark, CheckCircle2, AlertCircle, Plus, ChevronRight, Wallet, ArrowUpCircle, ArrowDownCircle, Users } from "lucide-react";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Textarea from "@/components/ui/textarea";
import FormField from "@/components/ui/form-field";
import { cn } from "@/lib/utils";
import { useCompany } from "@/context/company-context";
import CategorySelect from "./CategorySelect";
import PlatformSelect from "./PlatformSelect";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

const currencySymbols: any = {
  TL: "₺",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

export default function AddTransactionModal({ isOpen, onClose, onSuccess, initialData }: AddTransactionModalProps) {
  const { user, profile } = useAuth();
  const { companies, selectedCompanyId } = useCompany();
  const [loading, setLoading] = useState(false);
  const [banks, setBanks] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    type: "gider",
    company_id: selectedCompanyId !== "ALL" ? selectedCompanyId : "",
    category: "",
    category_id: "",
    amount: "",
    currency: "TL",
    date: new Date().toISOString().split("T")[0],
    description: "",
    document_no: "",
    banka_id: "",
    sub_platform: "",
    status: "Bekliyor",
    payment_method: "NAKIT",
    partner_id: "",
    partner_direction: "in", // in: Ortağın şirkete yatırdığı, out: Şirketin ortağa verdiği
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        type: initialData.type || "gider",
        company_id: initialData.company_id || (selectedCompanyId !== "ALL" ? selectedCompanyId : ""),
        category: initialData.category || "",
        category_id: initialData.category_id || "",
        amount: String(initialData.amount || ""),
        currency: initialData.currency || "TL",
        date: new Date().toISOString().split("T")[0], // Copy keeps the current date usually
        description: initialData.description || "",
        document_no: "", // Don't copy document number
        banka_id: initialTransactionBankId(initialData),
        sub_platform: initialData.sub_platform || "",
        status: initialData.status || "Bekliyor",
        payment_method: initialData.payment_method || "NAKIT",
        partner_id: initialData.partner_id || "",
        partner_direction: initialData.partner_direction || "in",
      });
    } else {
      setFormData({
        type: "gider",
        company_id: selectedCompanyId !== "ALL" ? selectedCompanyId : "",
        category: "",
        category_id: "",
        amount: "",
        currency: "TL",
        date: new Date().toISOString().split("T")[0],
        description: "",
        document_no: "",
        banka_id: "",
        sub_platform: "",
        status: "Bekliyor",
        payment_method: "NAKIT",
        partner_id: "",
        partner_direction: "in",
      });
    }
  }, [initialData, selectedCompanyId, isOpen]);

  const fetchPartners = useCallback(async () => {
    try {
      const { data } = await supabase.from("partners").select("*").order("name", { ascending: true });
      if (data) setPartners(data);
    } catch (err) {
      console.error("❌ Ortaklar yüklenemedi:", err);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchPartners();
    }
  }, [isOpen, fetchPartners]);

  function initialTransactionBankId(data: any) {
    return data.banka_id || "";
  }


  const fetchBanks = useCallback(async (companyId: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from("banks")
        .select("*")
        .eq("aktif_mi", true);
      
      if (companyId === "COMMON") {
        query = query.is("company_id", null);
      } else if (companyId) {
        query = query.eq("company_id", companyId);
      }

      const { data, error: bankError } = await query;
      
      if (bankError) throw bankError;
      
      console.log("🏦 Banks fetched:", data);
      
      if (data) {
        setBanks(data);
        // Eğer mevcut seçili banka gelen listede yoksa veya hiç seçili değilse ilkini seç
        if (data.length > 0) {
          const isCurrentBankInList = data.some(b => b.id === formData.banka_id);
          if (!isCurrentBankInList) {
            setFormData(prev => ({ ...prev, banka_id: data[0].id }));
          }
        } else {
          setFormData(prev => ({ ...prev, banka_id: "" }));
        }
      }
    } catch (err) {
      console.error("❌ Banka listesi yüklenemedi:", err);
    } finally {
      setLoading(false);
    }
  }, [formData.banka_id]);

  useEffect(() => {
    if (isOpen) {
      fetchBanks(formData.company_id);
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, formData.type, formData.company_id, fetchBanks]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // -------------------------------------------------------------------------
    // STAGE 1: VALIDATION & USER CONTEXT
    // -------------------------------------------------------------------------
    if (!formData.company_id) return setError("Lütfen bir şirket seçin (İşlem hangi şirkete ait?).");
    
    // Find a valid fallback ID for COMMON (Genel/Ortak) transactions
    const tabansaCompany = companies.find(c => c.company_name === 'Tabansa');
    const fallbackId = tabansaCompany ? tabansaCompany.id : (companies.length > 0 ? companies[0].id : null);

    if (formData.company_id === "COMMON" && !fallbackId) {
      return setError("Sistemde kayıtlı şirket bulunamadı. Lütfen önce bir şirket tanımlayın.");
    }

    if (formData.company_id !== "COMMON" && !formData.banka_id) return setError("Lütfen bir banka hesabı seçin.");
    if (!formData.description.trim()) return setError("Açıklama alanı zorunludur.");
    if (!formData.category_id) return setError("Lütfen bir kategori seçin.");

    if (!profile) {
      console.error("❌ Auth Error: No active profile session found.");
      return setError("Oturum bilgisi alınamadı. Lütfen sayfayı yenileyin.");
    }

    console.log("👤 Current User Profile:", {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      department: (profile as any)?.department_id,
      scope: (profile as any)?.access_scope
    });

    setLoading(true);
    setError(null);

    // -------------------------------------------------------------------------
    // STAGE 2: PAYLOAD CONSTRUCTION
    // -------------------------------------------------------------------------
    console.log("📦 STAGE 2: Constructing Payload");
    console.log("📝 Raw Form Data:", formData);

    const userDept = (profile as any)?.department_id || "Genel";

    const isOrtak = formData.payment_method === "ORTAK_CARI";

    // MINIMUM WORKING FIELDS (Core)
    const payload: any = {
      amount: Number(formData.amount),
      type: formData.type, // isOrtak olsa da banka bakiyesi için gelir/gider kullanılmalı
      date: formData.date, // transaction_date mapping if needed
      payment_method: formData.payment_method,
      created_by: profile.id,
      source_type: isOrtak ? "ORTAK_CARI" : (formData.payment_method === "BANKA" ? "BANKA" : formData.payment_method),
      partner_id: isOrtak ? formData.partner_id : null
    };

    // EXTENDED FIELDS (Added after core)
    payload.description = formData.description.trim();
    payload.category = formData.category || null;
    payload.category_id = formData.category_id || null;
    payload.currency = formData.currency;
    payload.status = formData.status;
    payload.document_no = formData.document_no.trim() || null;
    payload.banka_id = formData.banka_id || null;
    payload.sub_platform = formData.sub_platform || null;
    
    // Ensure company_id is NEVER null - use fallbackId computed above for COMMON selection
    payload.company_id = formData.company_id === "COMMON" ? fallbackId : formData.company_id;
    payload.department_id = userDept;

    console.log("🚀 FINAL INSERT PAYLOAD:", JSON.stringify(payload, null, 2));
    console.log("📊 Record will be linked to Company ID:", payload.company_id);

    // -------------------------------------------------------------------------
    // STAGE 3: DATABASE EXECUTION
    // -------------------------------------------------------------------------
    console.log("📡 STAGE 3: Executing Supabase Insert");
    
    try {
      const { data: insertedData, error: insertError } = await supabase
        .from("finance_records")
        .insert([payload])
        .select();

      if (insertError) {
        // Detailed property-by-property logging
        console.error("❌ SUPABASE INSERT ERROR DETECTED:");
        console.error("-> Message:", insertError.message);
        console.error("-> Details:", insertError.details);
        console.error("-> Hint:", insertError.hint);
        console.error("-> Code:", insertError.code);
        console.error("-> Full Error Object:", JSON.stringify(insertError, Object.getOwnPropertyNames(insertError)));

        // Handle specific common error codes
        let displayError = `Kayıt başarısız: ${insertError.message}`;
        if (insertError.code === "42703") displayError = "Veritabanı kolon hatası! Lütfen sistem yöneticisine başvurun (Migration eksik).";
        if (insertError.code === "42501") displayError = "Yetki hatası! Bu işlemi yapmak için gerekli izniniz yok (RLS).";
        
        setError(displayError);
        setLoading(false);
        return;
      }

      console.log("✅ SUCCESS: Record inserted successfully:", insertedData);
      
      setLoading(false);
      setSuccessMsg("İşlem başarıyla kaydedildi!");
      onSuccess();
      
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 1200);

    } catch (unexpectedError: any) {
      console.error("🔥 CRITICAL EXCEPTION during insert:", unexpectedError);
      setError(`Beklenmedik bir hata oluştu: ${unexpectedError.message || "Bilinmeyen hata"}`);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-[95%] sm:w-full sm:max-w-xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col my-auto">
        {/* Header - Fixed */}
        <div className="px-6 sm:px-10 py-6 sm:py-8 flex-none border-b border-slate-50 bg-white z-10 shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Yeni Finansal İşlem</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Dinamik Kategori ve Çoklu Para Birimi Destekli</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-6 sm:p-10 py-4 sm:py-6 custom-scrollbar">
            {(error || successMsg) && (
              <div className={cn(
                "mb-8 p-5 rounded-3xl flex items-center gap-4 text-xs font-bold animate-in fade-in slide-in-from-top-2",
                error ? "bg-red-50 text-red-600 border border-red-100" : "bg-green-50 text-green-700 border border-green-100"
              )}>
                {error ? <AlertCircle className="w-5 h-5 flex-none" /> : <CheckCircle2 className="w-5 h-5 flex-none" />}
                <span className="flex-1">{error || successMsg}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 p-1 bg-slate-100 rounded-2xl mb-8">
              <button 
                type="button" 
                onClick={() => setFormData({...formData, type: 'gelir', status: 'Tahsil Edildi'})}
                className={cn(
                  "py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                  formData.type === 'gelir' ? "bg-green-600 text-white shadow-lg shadow-green-600/20" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <ArrowUpCircle className="w-4 h-4" />
                {formData.payment_method === 'ORTAK_CARI' ? 'Şirkete Giriş' : 'Gelir / Tahsilat'}
              </button>
              <button 
                type="button" 
                onClick={() => setFormData({...formData, type: 'gider', status: 'Ödendi'})}
                className={cn(
                  "py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                  formData.type === 'gider' ? "bg-red-600 text-white shadow-lg shadow-red-600/20" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <ArrowDownCircle className="w-4 h-4" />
                {formData.payment_method === 'ORTAK_CARI' ? 'Şirketten Çıkış' : 'Gider / Ödeme'}
              </button>
            </div>

            <FormField label="Şirket Seçimi">
                <Select 
                  icon={<Building2 className="w-4 h-4" />} 
                  value={formData.company_id} 
                  onChange={(e) => setFormData({...formData, company_id: e.target.value, banka_id: "", category_id: "", category: ""})}
                >
                    <option value="">Şirket Seçiniz...</option>
                    <option value="COMMON" className="font-black text-blue-600">🏛️ TÜM ŞİRKETLER / ORTAK</option>
                    {companies.map(c => (
                        <option key={c.id} value={c.id}>{c.company_name}</option>
                    ))}
                </Select>
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Kategori" className="relative">
                <CategorySelect 
                  type={formData.type as any}
                  companyId={formData.company_id}
                  value={formData.category_id}
                  onSelect={(cat) => setFormData({...formData, category_id: cat.id, category: cat.name})}
                />
              </FormField>

              <div className="grid grid-cols-3 gap-3">
                <FormField label="Para Birimi" className="col-span-1">
                    <Select value={formData.currency} onChange={(e) => setFormData({...formData, currency: e.target.value})}>
                        <option value="TL">TL</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                    </Select>
                </FormField>
                <FormField label="İşlem Tutarı" className="col-span-2">
                    <Input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00" 
                    icon={<span className="font-black text-xs">{currencySymbols[formData.currency]}</span>}
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    />
                </FormField>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="İşlem Tarihi">
                <Input 
                  type="date" 
                  icon={<Calendar className="w-4 h-4" />}
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </FormField>

              <FormField label="İşlem Yöntemi">
                <Select 
                  icon={<Wallet className="w-4 h-4" />} 
                  value={formData.payment_method} 
                  onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                >
                  <option value="NAKIT">Nakit</option>
                  <option value="BANKA">Havale / EFT (Banka)</option>
                  <option value="KREDI_KARTI">Kredi Kartı</option>
                  <option value="CEK_SENET">Çek / Senet</option>
                  <option value="ORTAK_CARI">Ortak Cari</option>
                </Select>
              </FormField>

              {formData.payment_method === "ORTAK_CARI" && (
                <>
                  <FormField label="Ortak Seçimi">
                    <Select 
                      icon={<Users className="w-4 h-4 text-blue-500" />} 
                      value={formData.partner_id} 
                      onChange={(e) => setFormData({...formData, partner_id: e.target.value})}
                      required
                    >
                      <option value="">Ortak Seçin...</option>
                      {partners.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label="İşlem Yönü">
                    <Select 
                      icon={<Send className="w-4 h-4 text-blue-500" />} 
                      value={formData.partner_direction} 
                      onChange={(e) => setFormData({...formData, partner_direction: e.target.value})}
                      required
                    >
                      <option value="in">Ortak Şirkete Para Yatırdı</option>
                      <option value="out">Şirket Ortağa Para Verdi</option>
                    </Select>
                  </FormField>
                </>
              )}

              <FormField label="Banka Hesabı">
                <Select 
                  icon={<CreditCard className="w-4 h-4" />} 
                  value={formData.banka_id} 
                  onChange={(e) => {
                    console.log("🎯 Bank selected:", e.target.value);
                    setFormData({...formData, banka_id: e.target.value});
                  }}
                  disabled={!formData.company_id}
                >
                  {!formData.company_id && <option value="">Önce Şirket Seçiniz...</option>}
                  {formData.company_id === "COMMON" && banks.length === 0 && <option value="">Ortak Banka Hesabı Bulunamadı (Opsiyonel)</option>}
                  {formData.company_id && formData.company_id !== "COMMON" && banks.length === 0 && <option value="">Bu Şirkete Ait Banka Bulunamadı</option>}
                  {banks.length > 0 && <option value="">Banka Seçiniz...</option>}
                  {banks.map(bank => (
                    <option key={bank.id} value={bank.id}>
                      {bank.banka_adi} {bank.hesap_adi ? `- ${bank.hesap_adi}` : ""} ({bank.para_birimi})
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Durum">
                <Select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                  {formData.type === "gelir" ? (
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

            <FormField label="İşlem Açıklaması">
              <Input 
                placeholder="İşlem detayı..." 
                icon={<Bookmark className="w-4 h-4" />}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Belge No">
                <Input 
                  placeholder="Opsiyonel" 
                  icon={<Tag className="w-4 h-4" />}
                  value={formData.document_no}
                  onChange={(e) => setFormData({...formData, document_no: e.target.value})}
                />
                {(formData.payment_method === "Çek" || formData.payment_method === "Senet") && (
                  <p className="text-[10px] text-blue-600 font-black mt-2 uppercase animate-pulse italic">
                    * {formData.payment_method} için Belge/Seri No girmeyi unutmayın.
                  </p>
                )}
              </FormField>

              <FormField label="Alt Platform">
                <PlatformSelect 
                  value={formData.sub_platform}
                  onChange={(val) => setFormData({...formData, sub_platform: val})}
                />
              </FormField>
            </div>

            </div>

          {/* Footer - Fixed Actions */}
          <div className="px-6 sm:px-10 py-6 flex-none border-t border-slate-50 bg-white shrink-0">
            <div className="flex gap-4">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 px-8 py-4 bg-slate-100 text-slate-600 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                İptal
              </button>
              <button 
                type="submit"
                disabled={loading || !!successMsg}
                className="flex-[2] primary py-4 gap-3 rounded-[1.2rem] disabled:opacity-60 shadow-xl shadow-blue-600/20 font-black text-[10px] uppercase tracking-widest"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : successMsg ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {successMsg ? "Yükleniyor..." : "İşlemi Kaydet"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
