"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { X, Send, User, Wallet, CheckCircle2, AlertCircle } from "lucide-react";
import Input from "@/components/ui/input";
import FormField from "@/components/ui/form-field";
import { cn } from "@/lib/utils";

interface EditPartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner: any;
  onSuccess: () => void;
}

export default function EditPartnerModal({ isOpen, onClose, partner, onSuccess }: EditPartnerModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    opening_balance: ""
  });

  useEffect(() => {
    if (partner && isOpen) {
      setFormData({
        name: partner.name || "",
        opening_balance: partner.opening_balance?.toString() || "0"
      });
    }
  }, [partner, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from("partners")
        .update({
          name: formData.name,
          opening_balance: parseFloat(formData.opening_balance) || 0
        })
        .eq("id", partner.id);

      if (updateError) throw updateError;

      setSuccess(true);
      onSuccess();
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error("❌ Ortak güncellenemedi:", err);
      setError(err.message || "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Profili Düzenle</h2>
            <p className="text-xs font-bold text-slate-400">Ortak bilgilerini ve başlangıç bakiyesini güncelleyin.</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 text-green-600 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Başarıyla güncellendi!
            </div>
          )}

          <FormField label="Ortak Adı">
            <Input 
              icon={<User className="w-4 h-4" />}
              value={formData.name} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
              required 
            />
          </FormField>

          <FormField label="Başlangıç Bakiyesi">
            <Input 
              type="number" 
              step="0.01"
              icon={<Wallet className="w-4 h-4" />}
              value={formData.opening_balance} 
              onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value })} 
              required 
            />
            <p className="text-[10px] text-slate-400 font-medium mt-2 leading-relaxed">
              * Başlangıç bakiyesi, sistemdeki ilk kayıt öncesi ortağın şirkete olan borç (+) veya alacak (-) durumudur.
            </p>
          </FormField>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Güncelle"}
          </button>
        </form>
      </div>
    </div>
  );
}
