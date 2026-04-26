"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Lock } from "lucide-react";
import FormField from "@/components/ui/form-field";
import Input from "@/components/ui/input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    console.log("SUPABASE URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("HAS ANON KEY:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setError("Supabase bağlantı ayarları eksik. Environment Variables kontrol edilmeli.");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Supabase Login Error Details:", error);
        if (error.message === "Failed to fetch") {
          setError(`Sunucu Bağlantı Hatası: Supabase sunucusuna ulaşılamıyor. Hata: ${error.message} (${error.name}) | Details: ${JSON.stringify(error)}`);
        } else {
          setError(`Hata: ${error.message} (${error.name}) | Details: ${JSON.stringify(error)}`);
        }
        setLoading(false);
      } else {
        router.push("/");
      }
    } catch (err: any) {
      console.error("Login Catch Error:", err);
      setError(`Catch Hatası: ${err.message || err} | Name: ${err.name} | Details: ${JSON.stringify(err)}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 italic shadow-lg shadow-blue-600/30">
            SP
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Yönetim Paneli</h1>
          <p className="text-slate-500 mt-2">Lütfen hesabınıza giriş yapın</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <FormField label="E-posta Adresi">
            <Input
              type="email"
              required
              placeholder="ad@sirket.com"
              icon={<Mail className="w-4 h-4 text-slate-400" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormField>
          <FormField label="Şifre">
            <Input
              type="password"
              required
              placeholder="••••••••"
              icon={<Lock className="w-4 h-4 text-slate-400" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormField>

          <button
            type="submit"
            disabled={loading}
            className="w-full primary flex items-center justify-center py-3 text-base"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Giriş Yap"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-400">
            Giriş bilgilerinizi unuttuysanız sistem yöneticisine danışın.
          </p>
        </div>
      </div>
    </div>
  );
}
