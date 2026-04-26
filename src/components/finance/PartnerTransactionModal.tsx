"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import { X, Send, Calendar, Users, CreditCard, Building2, Bookmark, CheckCircle2, AlertCircle, Plus, Wallet } from "lucide-react";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Textarea from "@/components/ui/textarea";
import FormField from "@/components/ui/form-field";
import { cn } from "@/lib/utils";
import { useCompany } from "@/context/company-context";

interface PartnerTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editTransaction?: any;
}

export default function PartnerTransactionModal({ isOpen, onClose, onSuccess, editTransaction }: PartnerTransactionModalProps) {
  const { user, profile } = useAuth();
  const { companies, selectedCompanyId } = useCompany();
  const [loading, setLoading] = useState(false);
  const [banks, setBanks] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    partner_id: "",
    type: "deposit", // deposit: Partner -> Company, withdrawal: Company -> Partner
    company_id: selectedCompanyId !== "ALL" ? selectedCompanyId : "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    bank_id: "",
    status: "Tahsil Edildi", 
    source_type: "BANKA",
    payment_method: "BANKA",
    finance_record_id: null as string | null,
  });

  // Edit mode effect
  useEffect(() => {
    if (editTransaction && isOpen) {
      setFormData({
        partner_id: editTransaction.partner_id || "",
        type: editTransaction.type || "deposit",
        company_id: editTransaction.company_id || "",
        amount: editTransaction.amount?.toString() || "",
        date: editTransaction.date || new Date().toISOString().split("T")[0],
        description: editTransaction.description || "",
        bank_id: editTransaction.bank_id || "",
        status: editTransaction.status || "Tahsil Edildi",
        source_type: editTransaction.bank_id ? "BANKA" : "NAKIT", // Basit varsayım
        payment_method: editTransaction.bank_id ? "BANKA" : "NAKIT",
        finance_record_id: editTransaction.finance_record_id || null,
      });
    } else if (!editTransaction && isOpen) {
      setFormData({
        partner_id: "",
        type: "deposit",
        company_id: selectedCompanyId !== "ALL" ? selectedCompanyId : "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        description: "",
        bank_id: "",
        status: "Tahsil Edildi",
        source_type: "BANKA",
        payment_method: "BANKA",
        finance_record_id: null,
      });
    }
  }, [editTransaction, isOpen, selectedCompanyId]);

  const fetchPartners = useCallback(async () => {
    if (!isOpen) return;
    try {
      const { data: partnerData } = await supabase
        .from("partners")
        .select("*")
        .order("name", { ascending: true });
      
      if (partnerData) {
        // Tekilleştirme: Aynı isimli kayıt varsa sadece ilkini al
        const uniquePartners = partnerData.filter((p, index, self) =>
          index === self.findIndex((t) => t.name === p.name)
        );
        setPartners(uniquePartners);
      }
    } catch (err) {
      console.error("❌ Ortak listesi yüklenemedi:", err);
    }
  }, [isOpen]);

  const fetchBanks = useCallback(async (companyId: string) => {
    if (!companyId) {
      setBanks([]);
      return;
    }
    try {
      const { data: bankData, error } = await supabase
        .from("banks")
        .select("*")
        .eq("aktif_mi", true)
        .eq("company_id", companyId)
        .order("banka_adi", { ascending: true });

      if (error) {
        console.error("❌ Banka listesi yüklenemedi:", error.message);
        setBanks([]);
      } else {
        setBanks(bankData || []);
      }
    } catch (err) {
      console.error("❌ Banka listesi yüklenemedi:", err);
      setBanks([]);
    }
  }, []);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  // Şirket değiştiğinde bankaları yeniden yükle
  useEffect(() => {
    fetchBanks(formData.company_id);
  }, [formData.company_id, fetchBanks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    if (!formData.company_id) {
      setError("Lütfen bir şirket seçin (İşlem hangi şirkete ait?).");
      return;
    }

    const isBank = formData.source_type === "BANKA";

    if (!formData.partner_id) { setError("Lütfen bir ortak seçin."); return; }
    if (!formData.amount || parseFloat(formData.amount) <= 0) { setError("Lütfen geçerli bir tutar girin."); return; }
    if (isBank && !formData.bank_id) { setError("Banka kaynağı seçildiğinde banka hesabı zorunludur."); return; }

    setLoading(true);
    setError(null);

    try {
      const amount = parseFloat(formData.amount);
      const isDeposit = formData.type === "deposit"; // deposit = ortak şirkete para yatırdı = banka +
      const isEdit = !!editTransaction;

      const partnerName = partners.find(p => p.id === formData.partner_id)?.name || "Ortak";

      console.log(`🏦 PartnerTransactionModal: ${isEdit ? 'Updating' : 'Submitting'}`, {
        type: formData.type,
        isDeposit,
        isBank,
        amount,
        bank_id: formData.bank_id,
        source_type: formData.source_type,
      });

      // 1. finance_records tablosuna ekle/güncelle
      // Muhasebe mantığı:
      //   deposit  (ortak → şirket) → type: "gelir", status: "Tahsil Edildi" → banka bakiyesi ARTAR
      //   withdrawal (şirket → ortak) → type: "gider", status: "Ödendi"      → banka bakiyesi AZALIR
      const financePayload: any = {
        type: isDeposit ? "gelir" : "gider",
        amount: amount,
        date: formData.date,
        category: isDeposit ? "Ortak Yatırımı" : "Ortak Ödemesi",
        description: `${partnerName}: ${formData.description || (isDeposit ? "Ortak Para Yatırdı" : "Ortağa Para Verildi")}`,
        status: isDeposit ? "Tahsil Edildi" : "Ödendi",
        company_id: formData.company_id,
        created_by: user?.id,
        partner_id: formData.partner_id,
        source_type: formData.source_type,
        payment_method: formData.payment_method,
        banka_id: isBank ? formData.bank_id : null,
      };

      let financeRecordId = formData.finance_record_id;

      if (isEdit && financeRecordId) {
        // Güncelle
        const { error: fError } = await supabase
          .from("finance_records")
          .update(financePayload)
          .eq("id", financeRecordId);
        if (fError) throw fError;
      } else {
        // Ekle
        const { data: fData, error: fError } = await supabase
          .from("finance_records")
          .insert([financePayload])
          .select("id")
          .single();
        
        if (fError) throw fError;
        financeRecordId = fData.id;
      }

      // 2. partner_transactions tablosuna ekle/güncelle
      const transactionPayload = {
        partner_id: formData.partner_id,
        amount: amount,
        type: formData.type,
        date: formData.date,
        bank_id: isBank ? formData.bank_id : null,
        description: formData.description,
        status: formData.status,
        company_id: formData.company_id,
        finance_record_id: financeRecordId,
        created_by: user?.id
      };

      if (isEdit) {
        const { error: pError } = await supabase
          .from("partner_transactions")
          .update(transactionPayload)
          .eq("id", editTransaction.id);
        if (pError) throw pError;
      } else {
        const { error: pError } = await supabase
          .from("partner_transactions")
          .insert([transactionPayload]);
        if (pError) throw pError;
      }

      console.log(`✅ Ortak cari işlem ${isEdit ? 'güncellendi' : 'kaydedildi'}.`);

      setSuccessMsg(`İşlem başarıyla ${isEdit ? 'güncellendi' : 'kaydedildi'}!`);
      onSuccess();
      
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
        setFormData({
          partner_id: "",
          type: "deposit",
          company_id: selectedCompanyId !== "ALL" ? selectedCompanyId : "",
          amount: "",
          date: new Date().toISOString().split("T")[0],
          description: "",
          bank_id: "",
          status: "Tahsil Edildi",
          source_type: "BANKA",
          payment_method: "BANKA",
          finance_record_id: null,
        });
      }, 1200);

    } catch (err: any) {
      console.error("❌ İşlem kaydedilemedi:", err);
      const msg = err?.message || "İşlem sırasında bir hata oluştu.";
      // Constraint hata mesajlarını Türkçeleştir
      if (err?.code === "23514") setError("Veri kısıtlama hatası: " + msg);
      else if (err?.code === "23503") setError("İlişki hatası: Seçilen kayıt bulunamadı.");
      else setError(msg);
    } finally {
      setLoading(false);

    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Header */}
        <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              {editTransaction ? "İşlemi Düzenle" : "Ortak İşlemi Kaydet"}
            </h2>
            <p className="text-xs font-bold text-slate-400">
              {editTransaction ? "Mevcut işlem bilgilerini güncelleyin." : "Ortak cari hesap hareketini sisteme işleyin."}
            </p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <form onSubmit={handleSubmit} className="p-10 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            {successMsg && (
              <div className="bg-green-50 border border-green-100 text-green-600 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                {successMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FormField label="İşlem Tipi">
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: "deposit" })}
                    className={cn(
                      "flex-1 py-2 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                      formData.type === "deposit" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Yatırılan Para
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: "withdrawal" })}
                    className={cn(
                      "flex-1 py-2 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                      formData.type === "withdrawal" ? "bg-white text-orange-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Çekilen Para
                  </button>
                </div>
              </FormField>

              <FormField label="İşlem Tarihi">
                <Input
                  type="date"
                  icon={<Calendar className="w-4 h-4" />}
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FormField label="Ortak Seçimi">
                <Select
                  icon={<Users className="w-4 h-4" />}
                  value={formData.partner_id}
                  onChange={(e) => setFormData({ ...formData, partner_id: e.target.value })}
                  required
                >
                  <option value="">Ortak Seçin</option>
                  {partners.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Şirket">
                <Select
                  icon={<Building2 className="w-4 h-4" />}
                  value={formData.company_id}
                  onChange={(e) => setFormData({ ...formData, company_id: e.target.value, bank_id: "" })}
                  required
                >
                  <option value="">Şirket Seçin (Zorunlu)</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.company_name}</option>
                  ))}
                </Select>
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FormField label="İşlem Kaynağı">
                <Select
                  icon={<Wallet className="w-4 h-4" />}
                  value={formData.source_type}
                  onChange={(e) => {
                    const val = e.target.value;
                    // payment_method DB constraint ile aynı değer kullanılıyor
                    setFormData({ ...formData, source_type: val, payment_method: val, bank_id: "" });
                  }}
                  required
                >
                  <option value="BANKA">Banka</option>
                  <option value="NAKIT">Nakit</option>
                  <option value="KREDI_KARTI">Kredi Kartı</option>
                  <option value="CEK_SENET">Çek / Senet</option>
                  <option value="ORTAK_CARI">Ortak Cari</option>
                </Select>
              </FormField>

              {formData.source_type === "BANKA" ? (
                <FormField label="Banka Hesabı">
                  {!formData.company_id ? (
                    <div className="text-xs text-slate-400 font-medium py-3 px-4 bg-slate-50 rounded-xl border border-slate-100">
                      Önce şirket seçin
                    </div>
                  ) : banks.length === 0 ? (
                    <div className="text-xs text-amber-600 font-medium py-3 px-4 bg-amber-50 rounded-xl border border-amber-100">
                      Bu şirkete ait banka hesabı bulunamadı
                    </div>
                  ) : (
                    <Select
                      value={formData.bank_id}
                      onChange={(e) => setFormData({ ...formData, bank_id: e.target.value })}
                      required
                    >
                      <option value="">Banka Seçin</option>
                      {banks.map(b => (
                        <option key={b.id} value={b.id}>{b.banka_adi} - {b.hesap_adi}</option>
                      ))}
                    </Select>
                  )}
                </FormField>
              ) : (
                <FormField label="Tutar">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </FormField>
              )}
            </div>

            {formData.source_type === "BANKA" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField label="Tutar">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </FormField>
              </div>
            )}

            <FormField label="Açıklama">
              <Textarea
                placeholder="İşlem detaylarını buraya yazın..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="min-h-[100px]"
              />
            </FormField>

            <div className="pt-4 flex gap-3 sticky bottom-0 bg-white pb-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {editTransaction ? <CheckCircle2 className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                    {editTransaction ? "Değişiklikleri Kaydet" : "İşlemi Kaydet"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
