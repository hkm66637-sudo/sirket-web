"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { useCompany } from "@/context/company-context";
import { Building2, X, Save, Clock, Trash2, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Textarea from "@/components/ui/textarea";
import FormField from "@/components/ui/form-field";

interface EditEventModalProps {
  isOpen: boolean;
  event: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditEventModal({ isOpen, event, onClose, onSuccess }: EditEventModalProps) {
  const { companies } = useCompany();
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    company_id: "",
    type: "toplanti",
    time: "10:00",
  });

  useEffect(() => {
    if (isOpen && event) {
      setFormData({
        title: event.title || "",
        description: event.description || "",
        company_id: event.company_id || "",
        type: event.type || "toplanti",
        time: event.start_at ? format(parseISO(event.start_at), "HH:mm") : "10:00",
      });
      setError(null);
      setSuccessMsg(null);
      setShowDeleteConfirm(false);
    }
  }, [isOpen, event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return setError("Başlık boş olamaz.");
    if (!event?.id) return setError("Etkinlik bulunamadı.");

    setLoading(true);
    setError(null);

    const datePart = format(parseISO(event.start_at), "yyyy-MM-dd");
    const newStartAt = `${datePart} ${formData.time}:00`;

    const { error: updateError } = await supabase
      .from("calendar_events")
      .update({
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        type: formData.type,
        start_at: newStartAt,
        company_id: formData.company_id || null,
      })
      .eq("id", event.id);

    if (updateError) {
      setError(`Güncelleme hatası: ${updateError.message}`);
      setLoading(false);
      return;
    }

    setLoading(false);
    setSuccessMsg("Güncellendi!");
    onSuccess();
    setTimeout(() => { onClose(); setSuccessMsg(null); }, 1000);
  };

  const handleDelete = async () => {
    if (!event?.id) return;
    setDeleteLoading(true);
    const { error: deleteError } = await supabase
      .from("calendar_events")
      .delete()
      .eq("id", event.id);

    if (deleteError) {
      setError(`Silme hatası: ${deleteError.message}`);
      setDeleteLoading(false);
      return;
    }

    setDeleteLoading(false);
    onSuccess();
    onClose();
  };

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {!showDeleteConfirm ? (
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-black text-slate-900">Etkinliği Düzenle</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                  {format(parseISO(event.start_at), "d MMMM yyyy")}
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
                  placeholder="Başlık" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Tür">
                  <Select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                    <option value="toplanti">Toplantı</option>
                    <option value="gorusme">Görüşme</option>
                    <option value="uretim">Üretim Planı</option>
                    <option value="finans">Finansal İşlem</option>
                    <option value="tahsilat">Tahsilat</option>
                  </Select>
                </FormField>
                <FormField label="Saat">
                  <Input type="time" icon={<Clock className="w-4 h-4" />} value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} />
                </FormField>
              </div>

              <FormField label="Notlar">
                <Textarea placeholder="..." rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
              </FormField>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-all border border-red-100"
                  title="Sil"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <div className="flex-1 flex gap-2">
                  <button type="button" onClick={onClose} className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200">İptal</button>
                  <button type="submit" disabled={loading} className="flex-[2] primary py-4 gap-3">
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                    {successMsg ? "Güncellendi" : "Değişiklikleri Kaydet"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : (
          <div className="p-12 text-center flex flex-col items-center gap-6 animate-in fade-in zoom-in-95">
            <div className="w-20 h-20 bg-red-100 rounded-[2rem] flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">Emin misiniz?</h3>
              <p className="text-sm text-slate-500 font-medium mt-2 leading-relaxed">
                Bu etkinlik kalıcı olarak silinecek. <br /> Bu işlemi geri alamazsınız.
              </p>
            </div>
            <div className="flex gap-4 w-full">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest">Geri Dön</button>
              <button 
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-red-600/20 hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {deleteLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Silmeyi Onayla
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
