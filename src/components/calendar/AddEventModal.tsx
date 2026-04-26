"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import { useCompany } from "@/context/company-context";
import { Building2, X, Send, Clock, Calendar, Bookmark, CheckCircle2, AlertCircle } from "lucide-react";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Textarea from "@/components/ui/textarea";
import FormField from "@/components/ui/form-field";
import { format } from "date-fns";

interface AddEventModalProps {
  isOpen: boolean;
  selectedDate: Date | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddEventModal({ isOpen, selectedDate, onClose, onSuccess }: AddEventModalProps) {
  const { user } = useAuth();
  const { companies, selectedCompanyId } = useCompany();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    company_id: selectedCompanyId !== "ALL" ? selectedCompanyId : "",
    type: "toplanti",
    time: "10:00",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return setError("Lütfen bir başlık girin.");
    if (!formData.company_id) return setError("Lütfen bir şirket seçin.");
    if (!selectedDate) return setError("Lütfen bir tarih seçin.");
    if (!user?.id) return setError("Oturum bilgisi alınamadı.");

    setLoading(true);
    setError(null);

    // Tarih ve saati birleştir
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const startAt = `${dateStr} ${formData.time}:00`;

    const { error: insertError } = await supabase
      .from("calendar_events")
      .insert([
        {
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          type: formData.type,
          start_at: startAt,
          created_by: user.id,
          company_id: formData.company_id
        },
      ]);

    if (insertError) {
      console.error("❌ Etkinlik ekleme hatası:", insertError);
      setError(`Ekleme başarısız: ${insertError.message}`);
      setLoading(false);
      return;
    }

    setLoading(false);
    setSuccessMsg("Etkinlik başarıyla oluşturuldu!");
    onSuccess();
    
    setTimeout(() => {
      onClose();
      setSuccessMsg(null);
      setFormData({
        title: "",
        description: "",
        company_id: selectedCompanyId !== "ALL" ? selectedCompanyId : "",
        type: "toplanti",
        time: "10:00",
      });
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-black text-slate-900">Etkinlik Oluştur</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                {selectedDate ? format(selectedDate, "d MMMM yyyy") : ""}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {(error || successMsg) && (
            <div className={cn(
              "mb-6 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold",
              error ? "bg-red-50 text-red-600 border border-red-100" : "bg-green-50 text-green-700 border border-green-100"
            )}>
              {error ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              {error || successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <FormField label="Şirket Seçimi">
              <Select 
                icon={<Building2 className="w-4 h-4" />}
                value={formData.company_id}
                onChange={(e) => setFormData({...formData, company_id: e.target.value})}
                required
              >
                <option value="">Şirket Seçiniz index...</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.company_name}</option>
                ))}
              </Select>
            </FormField>

            <FormField label="Etkinlik Başlığı">
              <Input 
                placeholder="Örn: Haftalık Koordinasyon" 
                icon={<Bookmark className="w-4 h-4" />}
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Tür">
                <Select 
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                >
                  <option value="toplanti">Toplantı</option>
                  <option value="gorusme">Görüşme</option>
                  <option value="uretim">Üretim Planı</option>
                  <option value="finans">Finansal İşlem</option>
                  <option value="tahsilat">Tahsilat</option>
                </Select>
              </FormField>

              <FormField label="Saat">
                <Input 
                  type="time" 
                  icon={<Clock className="w-4 h-4" />}
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                />
              </FormField>
            </div>

            <FormField label="Notlar (Opsiyonel)">
              <Textarea 
                placeholder="Ekstra detaylar..." 
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </FormField>

            <div className="flex gap-4 pt-4">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Vazgeç
              </button>
              <button 
                type="submit"
                disabled={loading || !!successMsg}
                className="flex-[2] primary py-4 gap-3 disabled:opacity-60"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : successMsg ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {successMsg ? "Kaydedildi" : "Etkinliği Kaydet"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

import { cn } from "@/lib/utils";
