"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import { X, Save, Trash2, AlertTriangle, CheckCircle2, AlertCircle, Calendar, Bookmark, Tag, Plus, ChevronRight, Building2, Wallet } from "lucide-react";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Textarea from "@/components/ui/textarea";
import FormField from "@/components/ui/form-field";
import { cn } from "@/lib/utils";
import { useCompany } from "@/context/company-context";
import CategorySelect from "./CategorySelect";
import PlatformSelect from "./PlatformSelect";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface EditTransactionModalProps {
  isOpen: boolean;
  transaction: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

const currencySymbols: any = {
  TL: "₺",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

export default function EditTransactionModal({ isOpen, transaction, onClose, onSuccess }: EditTransactionModalProps) {
  const { user } = useAuth();
  const { companies } = useCompany();
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [banks, setBanks] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState({
    type: "gider",
    company_id: "",
    category: "",
    category_id: "",
    amount: "",
    currency: "TL",
    date: "",
    description: "",
    document_no: "",
    banka_id: "",
    sub_platform: "",
    status: "Bekliyor",
    payment_method: "Nakit",
  });


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

      console.log("🏦 Banks fetched (Edit):", data);
      if (data) setBanks(data);
    } catch (err) {
      console.error("❌ Banka listesi yüklenemedi:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && transaction) {
      setFormData({
        type: transaction.type,
        company_id: transaction.company_id || "COMMON",
        category: transaction.category || "",
        category_id: transaction.category_id || "",
        amount: String(transaction.amount),
        currency: transaction.currency || "TL",
        date: transaction.date,
        description: transaction.description || "",
        document_no: transaction.document_no || "",
        banka_id: transaction.banka_id || "",
        sub_platform: transaction.sub_platform || "",
        status: transaction.status || "Bekliyor",
        payment_method: transaction.payment_method || "Nakit",
      });
      fetchBanks(transaction.company_id);
      setError(null);
      setSuccessMsg(null);
      setShowDeleteConfirm(false);
    }
  }, [isOpen, transaction, fetchBanks]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount) return setError("Tutar zorunludur.");
    if (!transaction?.id) return setError("İşlem ID bulunamadı.");

    setLoading(true);
    setError(null);

    const payload = {
      type: formData.type,
      category: formData.category || null,
      amount: Number(formData.amount),
      currency: formData.currency,
      date: formData.date,
      description: formData.description.trim(),
      document_no: formData.document_no.trim() || null,
      banka_id: formData.banka_id || null,
      sub_platform: formData.sub_platform || null,
      status: formData.status,
      payment_method: formData.payment_method,
      company_id: formData.company_id === "COMMON" ? null : (formData.company_id || null),
      category_id: formData.category_id || null,
    };

    console.log("🚀 Updating Finance Record:", payload);

    const { error: updateError } = await supabase
      .from("finance_records")
      .update(payload)
      .eq("id", transaction.id);

    if (updateError) {
      console.error("❌ Finance update error full:", updateError);
      console.error("❌ Finance update error details:", {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code,
        payload
      });
      setError(`Güncelleme hatası: ${updateError.message} (${updateError.details || 'Detay yok'})`);
      setLoading(false);
      return;
    }

    setLoading(false);
    setSuccessMsg("Kayıt güncellendi!");
    onSuccess();
    setTimeout(() => { onClose(); setSuccessMsg(null); }, 1200);
  };

  const handleDelete = async () => {
    if (!transaction?.id) return;
    setDeleteLoading(true);
    const { error: deleteError } = await supabase.from("finance_records").delete().eq("id", transaction.id);
    if (deleteError) {
      setError(`Silme hatası: ${deleteError.message}`);
      setDeleteLoading(false);
      return;
    }
    setDeleteLoading(false);
    onSuccess();
    onClose();
  };

  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-[95%] sm:w-full sm:max-w-xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col my-auto">
            {/* Header - Fixed */}
            <div className="px-6 sm:px-10 py-6 sm:py-8 border-b border-slate-50 flex-none bg-white z-10 shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Kayıt Düzenle</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Dinamik Kategori ve Çoklu Para Birimi Güncelleme</p>
                </div>
                <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 py-4 sm:py-6 custom-scrollbar">
              {(error || successMsg) && (
                <div className={cn(
                  "mb-8 p-5 rounded-3xl flex items-center gap-4 text-xs font-bold",
                  error ? "bg-red-50 text-red-600 border border-red-100" : "bg-green-50 text-green-700 border border-green-100"
                )}>
                  {error ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                  {error || successMsg}
                </div>
              )}

              <form id="edit-transaction-form" onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="İşlem Tipi">
                   <Select value={formData.type} onChange={(e) => {
                       const newType = e.target.value;
                       setFormData({...formData, type: newType, category: "", category_id: ""});
                   }}>
                      <option value="gelir">Gelir</option>
                      <option value="gider">Gider</option>
                   </Select>
                </FormField>
                <FormField label="Durum">
                  <Select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                    <option value="Bekliyor">Bekliyor</option>
                    <option value="Ödendi">Ödendi (Gider)</option>
                    <option value="Tahsil Edildi">Tahsil Edildi (Gelir)</option>
                    <option value="İptal Edildi">İptal Edildi</option>
                  </Select>
                </FormField>
              </div>

              <FormField label="Şirket Seçimi">
                <Select icon={<Building2 className="w-4 h-4" />} value={formData.company_id} onChange={(e) => {
                    const newCompanyId = e.target.value;
                    setFormData({...formData, company_id: newCompanyId, banka_id: "", category_id: "", category: ""});
                    fetchBanks(newCompanyId);
                }}>
                    <option value="">Şirket Seçiniz...</option>
                    <option value="COMMON" className="font-black text-blue-600">🏛️ TÜM ŞİRKETLER / ORTAK</option>
                    {companies.map(c => (
                        <option key={c.id} value={c.id}>{c.company_name}</option>
                    ))}
                </Select>
              </FormField>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="Kategori">
                    <CategorySelect 
                      type={formData.type as any}
                      companyId={formData.company_id}
                      value={formData.category_id}
                      onSelect={(cat) => setFormData({...formData, category_id: cat.id, category: cat.name})}
                    />
                 </FormField>
                <div className="grid grid-cols-3 gap-2">
                    <FormField label="Para Birimi">
                        <Select value={formData.currency} onChange={(e) => setFormData({...formData, currency: e.target.value})}>
                            <option value="TL">TL</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                        </Select>
                    </FormField>
                    <FormField label="Tutar" className="col-span-2">
                        <Input type="number" step="0.01" icon={<span className="font-black text-xs">{currencySymbols[formData.currency]}</span>} value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
                    </FormField>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Tarih">
                  <Input type="date" icon={<Calendar className="w-4 h-4" />} value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                </FormField>
                <FormField label="İşlem Yöntemi">
                  <Select 
                    icon={<Wallet className="w-4 h-4" />} 
                    value={formData.payment_method} 
                    onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                  >
                    <option value="NAKIT">Nakit</option>
                    <option value="BANKA">Havale / EFT</option>
                    <option value="KREDI_KARTI">Kredi Kartı</option>
                    <option value="CEK_SENET">Çek / Senet</option>
                  </Select>
                </FormField>
                <FormField label="Banka">
                  <Select 
                    value={formData.banka_id} 
                    onChange={(e) => {
                      console.log("🎯 Bank selected (Edit):", e.target.value);
                      setFormData({...formData, banka_id: e.target.value});
                    }}
                    disabled={!formData.company_id}
                  >
                    {!formData.company_id && <option value="">Önce Şirket Seçiniz...</option>}
                    {formData.company_id === "COMMON" && banks.length === 0 && <option value="">Ortak Banka Hesabı Bulunamadı (Opsiyonel)</option>}
                    {formData.company_id && formData.company_id !== "COMMON" && banks.length === 0 && <option value="">Bu Şirkete Ait Banka Bulunamadı</option>}
                    {banks.length > 0 && <option value="">Banka Seçiniz...</option>}
                    {banks.map(bank => (
                      <option key={bank.id} value={bank.id}>{bank.banka_adi} {bank.hesap_adi ? `- ${bank.hesap_adi}` : ""}</option>
                    ))}
                  </Select>
                </FormField>
              </div>

              <FormField label="Açıklama">
                <Input icon={<Bookmark className="w-4 h-4" />} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                {(formData.payment_method === "Çek" || formData.payment_method === "Senet") && (
                  <p className="text-[10px] text-blue-600 font-black mt-2 uppercase animate-pulse italic">
                    * {formData.payment_method} için Belge/Seri No kontrolünü unutmayın.
                  </p>
                )}
              </FormField>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="Belge No">
                  <Input 
                    placeholder="Opsiyonel" 
                    icon={<Tag className="w-4 h-4" />}
                    value={formData.document_no}
                    onChange={(e) => setFormData({...formData, document_no: e.target.value})}
                    className="font-bold uppercase tracking-tight"
                  />
                </FormField>

                <FormField label="Alt Platform">
                  <PlatformSelect 
                    value={formData.sub_platform}
                    onChange={(val) => setFormData({...formData, sub_platform: val})}
                  />
                </FormField>
              </div>

              {/* Audit Info Section */}
              <div className="pt-4 mt-6 border-t border-slate-50 flex flex-col gap-2">
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[10px] font-black uppercase">
                      {(transaction.profiles?.full_name || "S")[0]}
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Oluşturan Kullanıcı</p>
                      <p className="text-xs font-bold text-slate-700">{transaction.profiles?.full_name || "Sistem"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Kayıt Tarihi</p>
                    <p className="text-xs font-mono font-bold text-slate-600">
                      {new Date(transaction.created_at).toLocaleString("tr-TR", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                
                {transaction.updated_at && transaction.updated_at !== transaction.created_at && (
                  <div className="flex justify-between items-center px-4 py-2 opacity-60">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter italic">Son Güncelleme</p>
                    <p className="text-[8px] font-mono font-bold text-slate-500 italic">
                      {new Date(transaction.updated_at).toLocaleString("tr-TR", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                )}
              </div>

              </form>
            </div>

            {/* Footer - Fixed Actions */}
            <div className="px-6 sm:px-10 py-6 border-t border-slate-50 flex-none bg-white shrink-0">
              <div className="flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-5 bg-red-50 text-red-600 rounded-[1.5rem] hover:bg-red-100 transition-all border border-red-100"
                >
                  <Trash2 className="w-6 h-6" />
                </button>
                <div className="flex-1 flex gap-3">
                  <button type="button" onClick={onClose} className="flex-1 px-8 py-5 bg-slate-100 text-slate-600 rounded-[1.5rem] text-xs font-black uppercase tracking-widest hover:bg-slate-200">Geri</button>
                  <button 
                    type="submit" 
                    form="edit-transaction-form"
                    disabled={loading} 
                    className="flex-[2] primary py-5 gap-3 rounded-[1.5rem] shadow-xl shadow-blue-600/20 font-black text-xs uppercase tracking-widest"
                  >
                    {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
                    {successMsg ? "Başarılı" : "Güncellemeyi Kaydet"}
                  </button>
                </div>
              </div>
            </div>

        <ConfirmDialog 
          isOpen={showDeleteConfirm}
          title="Kaydı Sil?"
          description="Bu finans kaydı kalıcı olarak silinecek. Bu işlem geri alınamaz ve banka bakiyelerini etkiler."
          variant="danger"
          confirmText="Evet, Sil"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          loading={loading}
        />
      </div>
    </div>
  );
}
