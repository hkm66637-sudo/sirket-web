"use client";

import React, { useState, useEffect } from "react";
import { Settings as SettingsIcon, User, Bell, Shield, Save, X } from "lucide-react";
import FormField from "@/components/ui/form-field";
import Input from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const { user, profile: authProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    role: ""
  });

  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    system: true
  });

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authProfile || user) {
      setProfile({
        name: authProfile?.full_name || user?.user_metadata?.full_name || "Bilgi bulunamadı",
        email: user?.email || authProfile?.email || "Bilgi bulunamadı",
        role: authProfile?.role || authProfile?.access_scope || "Bilgi bulunamadı"
      });
    }
  }, [authProfile, user]);

  const handleSave = () => {
    alert("Ayarlar başarıyla kaydedildi! (Simülasyon)");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-blue-600" /> Sistem Ayarları
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Sistem tercihlerinizi ve profil bilgilerinizi buradan yönetebilirsiniz.</p>
        </div>
        <button 
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
        >
          <Save className="w-5 h-5" /> Kaydet
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Settings */}
        <div className="glass-card p-6 flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-500" /> Profil Bilgileri
          </h3>
          <div className="space-y-4 flex-1">
            <FormField label="Ad Soyad">
              <Input 
                value={profile.name} 
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </FormField>
            
            <FormField label="E-Posta Adresi">
              <Input 
                type="email"
                value={profile.email} 
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </FormField>

            <FormField label="Rol / Yetki">
              <Input 
                value={profile.role} 
                disabled
                className="w-full rounded-xl bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
              />
            </FormField>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="glass-card p-6 flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-500" /> Bildirim Tercihleri
          </h3>
          <div className="space-y-4 flex-1">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
              <div>
                <p className="text-sm font-bold text-slate-800">E-Posta Bildirimleri</p>
                <p className="text-xs text-slate-400">Sistem güncellemeleri ve raporlar</p>
              </div>
              <input 
                type="checkbox" 
                checked={notifications.email}
                onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
              <div>
                <p className="text-sm font-bold text-slate-800">SMS Bildirimleri</p>
                <p className="text-xs text-slate-400">Kritik gecikmeler ve uyarılar</p>
              </div>
              <input 
                type="checkbox" 
                checked={notifications.sms}
                onChange={(e) => setNotifications({ ...notifications, sms: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
              <div>
                <p className="text-sm font-bold text-slate-800">Sistem İçi Bildirimler</p>
                <p className="text-xs text-slate-400">Panel içi anlık bildirimler</p>
              </div>
              <input 
                type="checkbox" 
                checked={notifications.system}
                onChange={(e) => setNotifications({ ...notifications, system: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Security & System */}
        <div className="glass-card p-6 flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-500" /> Güvenlik
          </h3>
          <div className="space-y-4 flex-1">
            <button 
              onClick={() => {
                setIsPasswordModalOpen(true);
                setPasswordError("");
                setPasswordSuccess("");
                setNewPassword("");
                setConfirmPassword("");
              }}
              className="w-full text-left p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <p className="text-sm font-bold text-slate-800">Şifre Değiştir</p>
              <p className="text-xs text-slate-400">Hesap güvenliğiniz için düzenli güncelleyin</p>
            </button>

            <button className="w-full text-left p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-slate-50 transition-colors">
              <p className="text-sm font-bold text-slate-800">İki Adımlı Doğrulama (2FA)</p>
              <p className="text-xs text-slate-400">Henüz aktif değil</p>
            </button>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full mx-4 shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setIsPasswordModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" /> Şifre Değiştir
              </h3>
              <p className="text-slate-400 text-xs font-medium mt-1">Hesabınız için yeni bir şifre belirleyin.</p>
            </div>

            {passwordError && (
              <div className="bg-red-50 text-red-600 border border-red-100 p-3 rounded-xl text-xs font-semibold mb-4 text-center">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="bg-green-50 text-green-600 border border-green-100 p-3 rounded-xl text-xs font-semibold mb-4 text-center">
                {passwordSuccess}
              </div>
            )}

            <form onSubmit={async (e) => {
              e.preventDefault();
              setPasswordError("");
              setPasswordSuccess("");

              if (!user) {
                setPasswordError("Oturum bulunamadı, tekrar giriş yapın.");
                setTimeout(() => router.push("/auth/login"), 2000);
                return;
              }

              if (newPassword.length < 6) {
                setPasswordError("Şifre en az 6 karakter olmalı.");
                return;
              }

              if (newPassword !== confirmPassword) {
                setPasswordError("Şifreler eşleşmiyor.");
                return;
              }

              setIsSubmitting(true);
              try {
                const timeoutPromise = new Promise((_, reject) =>
                  setTimeout(() => reject(new Error("İşlem zaman aşımına uğradı. Lütfen tekrar deneyin.")), 15000)
                );

                const updatePromise = supabase.auth.updateUser({ password: newPassword });

                const result = await Promise.race([updatePromise, timeoutPromise]) as any;

                if (result && result.error) {
                  throw result.error;
                }

                setPasswordSuccess("Şifre başarıyla güncellendi.");
                setNewPassword("");
                setConfirmPassword("");
                setTimeout(() => setIsPasswordModalOpen(false), 2000);
              } catch (err: any) {
                console.error("Password update error:", err);
                setPasswordError(err.message || "Şifre güncellenirken hata oluştu.");
              } finally {
                setIsSubmitting(false);
              }
            }} className="space-y-4">
              <FormField label="Yeni Şifre">
                <Input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••"
                  required
                  className="w-full rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </FormField>

              <FormField label="Yeni Şifre (Tekrar)">
                <Input 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••"
                  required
                  className="w-full rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </FormField>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors"
                  disabled={isSubmitting}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
