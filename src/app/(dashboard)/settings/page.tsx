"use client";

import React, { useState } from "react";
import { Settings as SettingsIcon, User, Bell, Shield, Save } from "lucide-react";
import FormField from "@/components/ui/form-field";
import Input from "@/components/ui/input";

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    name: "Ahmet Yılmaz",
    email: "ahmet@sirket.com",
    role: "Yönetici"
  });

  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    system: true
  });

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
            <button className="w-full text-left p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-slate-50 transition-colors">
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
    </div>
  );
}
