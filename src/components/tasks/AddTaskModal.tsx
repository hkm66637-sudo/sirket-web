"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import FormField from "@/components/ui/form-field";
import { useCompany } from "@/context/company-context";
import { Building2, X, Send, User, Calendar, Tag, AlertCircle, Bookmark, CheckCircle2, PlusCircle } from "lucide-react";
import SearchableSelect from "@/components/ui/SearchableSelect";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Textarea from "@/components/ui/textarea";

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddTaskModal({ isOpen, onClose, onSuccess }: AddTaskModalProps) {
  const { user, profile } = useAuth();
  const { companies, selectedCompanyId } = useCompany();
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    company_id: selectedCompanyId !== "ALL" ? selectedCompanyId : "",
    module: "Genel",
    priority: "Orta",
    status: "Bekliyor",
    assigned_to: "",
    due_date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (isOpen) {
      fetchProfiles();
      setError(null);
      setSuccessMsg(null);
      
      // Default company if not set
      if (!formData.company_id && selectedCompanyId !== "ALL") {
        setFormData(prev => ({ ...prev, company_id: selectedCompanyId }));
      }
    }
  }, [isOpen, profile]);

  const fetchProfiles = async () => {
    setProfilesLoading(true);
    try {
      // 1. Temel Sorgu: Sadece aktif kullanıcıları al
      const response = await supabase
        .from("profiles")
        .select("id, full_name, email, role, is_active")
        .eq("is_active", true)
        .order("full_name");

      // 2. Ham Yanıt Loglama
      console.log("👤 [AddTaskModal] profiles raw response", {
        data: response.data,
        error: response.error,
        status: response.status,
        statusText: response.statusText
      });

      if (response.error) {
        console.error("❌ profiles fetch error:", JSON.stringify(response.error, null, 2));
        throw response.error;
      }

      let data = response.data || [];

      // 3. Frontend Yetki Kısıtlaması
      if (profile?.role === "operasyon") {
        console.log("🔐 Operasyon kısıtlaması: Filtreleme uygulanıyor.");
        data = data.filter(p => p.id === profile.id);
      }

      setProfiles(data);

      if (profile?.role === "operasyon" && data.length > 0) {
        setFormData(prev => ({ ...prev, assigned_to: data[0].id }));
      }
    } catch (err) {
      console.error("Profiller yüklenemedi:", err);
      setError("Kullanıcı listesi alınamadı. Lütfen sayfayı yenileyin.");
    } finally {
      setProfilesLoading(false);
    }
  };

  const setSelfAssign = () => {
    if (user?.id) {
      setFormData(prev => ({ ...prev, assigned_to: user.id }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return setError("Lütfen bir görev başlığı girin.");
    if (!formData.company_id) return setError("Lütfen bir şirket seçin.");
    if (!user?.id) return setError("Oturum bilgisi alınamadı.");
    
    setLoading(true);
    setError(null);

    const insertData = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      module: formData.module,
      priority: formData.priority,
      status: formData.status,
      assigned_to: formData.assigned_to || null,
      due_date: formData.due_date ? `${formData.due_date}T12:00:00+03:00` : null,
      created_by: user.id,
      company_id: formData.company_id
    };

    const { error: insertError } = await supabase.from("tasks").insert([insertData]);

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setSuccessMsg("Görev başarıyla oluşturuldu!");
    onSuccess();
    setTimeout(() => {
      onClose();
      setSuccessMsg(null);
      setFormData({
        title: "",
        description: "",
        module: "Genel",
        priority: "Orta",
        status: "Bekliyor",
        assigned_to: (profile?.role === "operasyon" ? profile.id : ""),
        company_id: selectedCompanyId !== "ALL" ? selectedCompanyId : "",
        due_date: new Date().toISOString().split("T")[0],
      });
    }, 1500);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-xl max-h-[90vh] flex flex-col rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header - Sabit */}
        <div className="p-8 pb-6 border-b border-slate-100 flex justify-between items-start shrink-0">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Yeni Görev</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Süreç ve Atama Yönetimi</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content - Kaydırılabilir */}
        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-4 text-red-700 text-sm font-bold animate-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form id="add-task-form" onSubmit={handleSubmit} className="space-y-5">
            <FormField label="ŞİRKET SEÇİMİ *">
              <Select 
                icon={<Building2 className="w-4 h-4" />}
                value={formData.company_id}
                onChange={(e) => setFormData({...formData, company_id: e.target.value})}
                required
              >
                <option value="">Şirket Seçiniz...</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.company_name}</option>
                ))}
              </Select>
            </FormField>

            <FormField label="GÖREV ADI *">
              <Input 
                placeholder="Görev başlığı..." 
                icon={<Bookmark className="w-4 h-4" />}
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
                className="font-bold"
              />
            </FormField>

            <FormField label="ATANACAK KİŞİ *">
              <div className="space-y-3">
                <SearchableSelect 
                  options={profiles.map(p => ({ id: p.id, label: p.full_name }))}
                  value={formData.assigned_to}
                  onChange={(val) => setFormData({...formData, assigned_to: val})}
                  placeholder={profilesLoading ? "Yükleniyor..." : "İsim ile ara..."}
                  disabled={profilesLoading}
                />
                {profile?.role !== "operasyon" && (
                  <button 
                    type="button"
                    onClick={setSelfAssign}
                    className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Kendime Ata
                  </button>
                )}
              </div>
            </FormField>

            <div className="grid grid-cols-2 gap-5">
              <FormField label="SON TARİH">
                <Input 
                  type="date" 
                  icon={<Calendar className="w-4 h-4" />}
                  value={formData.due_date}
                  onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                />
              </FormField>
              <FormField label="MODÜL">
                <Select 
                  value={formData.module}
                  onChange={(e) => setFormData({...formData, module: e.target.value})}
                >
                  <option value="Genel">Genel</option>
                  <option value="Finans">Finans</option>
                  <option value="E-Ticaret">E-Ticaret</option>
                  <option value="Üretim">Üretim</option>
                </Select>
              </FormField>
            </div>

            <FormField label="ÖNCELİK">
              <Select 
                icon={<Tag className="w-4 h-4" />}
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
              >
                <option value="Düşük">Düşük</option>
                <option value="Orta">Orta</option>
                <option value="Yüksek">Yüksek</option>
              </Select>
            </FormField>

            <FormField label="AÇIKLAMA">
              <Textarea 
                placeholder="Görev detayları..." 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
              />
            </FormField>
          </form>
        </div>

        {/* Footer - Sabit */}
        <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50/80 backdrop-blur-sm shrink-0">
          <div className="flex gap-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
            >
              İptal
            </button>
            <button 
              type="submit" 
              form="add-task-form"
              disabled={loading || !!successMsg}
              className="flex-[2] primary py-4 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 font-bold disabled:opacity-50 transition-all"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : successMsg ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {successMsg ? "Kaydedildi!" : "Görevi Oluştur"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
