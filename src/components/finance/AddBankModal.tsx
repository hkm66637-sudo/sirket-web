"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import { useCompany } from "@/context/company-context";
import { 
  X, 
  Building2, 
  Wallet, 
  CreditCard, 
  Info, 
  Save, 
  AlertCircle, 
  CheckCircle2,
  DollarSign,
  Landmark
} from "lucide-react";
import { cn } from "@/lib/utils";
import FormField from "@/components/ui/form-field";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Textarea from "@/components/ui/textarea";

interface AddBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddBankModal({ isOpen, onClose, onSuccess }: AddBankModalProps) {
  const { profile } = useAuth();
  const { companies, selectedCompanyId } = useCompany();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    company_id: selectedCompanyId !== "ALL" ? selectedCompanyId : "",
    banka_adi: "",
    hesap_adi: "",
    baslangic_bakiyesi: "0",
    para_birimi: "TRY",
    iban: "",
    aciklama: "",
    aktif_mi: true
  });

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(false);
      setFormData(prev => ({
        ...prev,
        company_id: selectedCompanyId !== "ALL" ? selectedCompanyId : ""
      }));
    }
  }, [isOpen, selectedCompanyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Validasyon
    if (!formData.company_id) return setError("Lütfen bir şirket seçin.");
    if (!formData.banka_adi.trim()) return setError("Banka adı zorunludur.");
    if (!formData.para_birimi) return setError("Para birimi seçiniz.");

    const payload = {
      company_id: formData.company_id,
      banka_adi: formData.banka_adi.trim(),
      hesap_adi: formData.hesap_adi.trim() || null,
      baslangic_bakiyesi: parseFloat(formData.baslangic_bakiyesi) || 0,
      para_birimi: formData.para_birimi,
      iban: formData.iban.trim() || null,
      aciklama: formData.aciklama.trim() || null,
      aktif_mi: formData.aktif_mi,
    };

    setLoading(true);
    setError(null);

    // 2. Ham Veri Loglama (Teşhis için)
    console.log("🚀 [AddBankModal] Sending Payload:", payload);

    try {
      const response = await supabase
        .from("banks")
        .insert([payload])
        .select();

      // 3. Supabase Yanıtını Tamamen Loglama
      console.log("📡 [AddBankModal] Supabase Response:", {
        data: response.data,
        error: response.error,
        status: response.status,
        statusText: response.statusText,
        full: response
      });

      if (response.error) {
        console.error("❌ banks insert error:", JSON.stringify(response.error, null, 2));
        throw response.error;
      }

      setSuccess(true);
      onSuccess();
      
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err: any) {
      console.error("❌ Kayıt başarısız:", err);
      // Backend hatasını kullanıcıya anlamlı çevir
      const errorDetail = err.message || "Bilinmeyen bir hata oluştu.";
      setError(`Banka kaydedilirken bir hata oluştu: ${errorDetail}`);
    } finally {
      // 4. Loading her durumda kapansın
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose} 
      />
      
      <div className="relative bg-white w-[95%] sm:w-full sm:max-w-xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col my-auto">
        {/* Header - Fixed */}
        <div className="px-6 sm:px-10 py-6 sm:py-8 border-b border-slate-50 flex-none bg-white z-10 shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Yeni Banka Tanımla</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Finansal Varlık Yönetimi</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 py-4 sm:py-6 custom-scrollbar">
          {error && (
            <div className="mb-8 p-5 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-4 text-red-700 text-sm font-bold animate-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-8 p-5 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-4 text-green-700 text-sm font-bold animate-in slide-in-from-top-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Banka başarıyla kaydedildi!</span>
            </div>
          )}

          <form id="add-bank-form" onSubmit={handleSubmit} className="space-y-6">
            <FormField label="İLGİLİ ŞİRKET *">
              <Select 
                icon={<Building2 className="w-4 h-4" />}
                value={formData.company_id}
                onChange={(e) => setFormData(prev => ({ ...prev, company_id: e.target.value }))}
                required
              >
                <option value="">Şirket Seçiniz...</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.company_name}</option>
                ))}
              </Select>
            </FormField>

            <div className="grid grid-cols-2 gap-6">
              <FormField label="BANKA ADI *">
                <Input 
                  placeholder="Örn: Garanti BBVA" 
                  icon={<Landmark className="w-4 h-4" />}
                  value={formData.banka_adi}
                  onChange={(e) => setFormData(prev => ({ ...prev, banka_adi: e.target.value }))}
                  required
                />
              </FormField>
              <FormField label="HESAP / ŞUBE ADI">
                <Input 
                  placeholder="Örn: Zirve Ticari" 
                  icon={<Info className="w-4 h-4" />}
                  value={formData.hesap_adi}
                  onChange={(e) => setFormData(prev => ({ ...prev, hesap_adi: e.target.value }))}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <FormField label="BAŞLANGIÇ BAKİYESİ">
                <Input 
                  type="number"
                  step="0.01"
                  placeholder="0.00" 
                  icon={<Wallet className="w-4 h-4" />}
                  value={formData.baslangic_bakiyesi}
                  onChange={(e) => setFormData(prev => ({ ...prev, baslangic_bakiyesi: e.target.value }))}
                />
              </FormField>
              <FormField label="PARA BİRİMİ">
                <Select 
                  icon={<DollarSign className="w-4 h-4" />}
                  value={formData.para_birimi}
                  onChange={(e) => setFormData(prev => ({ ...prev, para_birimi: e.target.value }))}
                >
                  <option value="TRY">TRY - Türk Lirası</option>
                  <option value="USD">USD - Amerikan Doları</option>
                  <option value="EUR">EUR - Euro</option>
                </Select>
              </FormField>
            </div>

            <FormField label="HESAP NUMARASI / IBAN">
              <Input 
                placeholder="TR00 0000 0000..." 
                icon={<CreditCard className="w-4 h-4" />}
                value={formData.iban}
                onChange={(e) => setFormData(prev => ({ ...prev, iban: e.target.value }))}
              />
            </FormField>

            <FormField label="DURUM">
              <Select 
                value={formData.aktif_mi ? "true" : "false"}
                onChange={(e) => setFormData(prev => ({ ...prev, aktif_mi: e.target.value === "true" }))}
              >
                <option value="true">Aktif</option>
                <option value="false">Pasif</option>
              </Select>
            </FormField>

          </form>
        </div>

        {/* Footer - Fixed Actions */}
        <div className="px-6 sm:px-10 py-6 border-t border-slate-50 flex-none bg-white shrink-0">
          <div className="flex gap-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all font-bold"
            >
              İptal
            </button>
            <button 
              type="submit" 
              form="add-bank-form"
              disabled={loading || success}
              className="flex-[2] primary py-4 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 font-bold disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" /> Bankayı Kaydet
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
