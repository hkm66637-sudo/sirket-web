"use client";

import React from "react";
import { ShoppingCart, HelpCircle } from "lucide-react";

export default function EcommercePage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-purple-600" /> E-Ticaret Modülü
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Mağaza ve pazaryeri süreçleriniz yakında burada yönetilebilecek.</p>
        </div>
      </div>

      {/* Hero card */}
      <div className="bg-slate-900 text-white rounded-[2.5rem] p-10 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-xl relative z-10">
          <span className="bg-purple-500/20 text-purple-300 text-xs font-bold px-3 py-1 rounded-full">YAKINDA</span>
          <h2 className="text-3xl font-bold mt-4 mb-3">E-Ticaret Operasyonlarınızı Tek Noktadan Yönetin</h2>
          <p className="text-slate-300 font-medium text-sm leading-relaxed mb-6">
            Pazaryerleri, ürün stokları, sipariş faturaları ve kargo süreçleri tek çatı altında toplanıyor. Altyapı hazırlıkları devam etmektedir.
          </p>
        </div>
      </div>

      {/* Support area placeholder */}
      <div className="glass-card p-6 flex items-center gap-4">
        <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
          <HelpCircle className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-800">Yardıma mı ihtiyacınız var?</h4>
          <p className="text-xs text-slate-400">Destek talebi oluşturmak için Destek AI bölümünü kullanabilirsiniz.</p>
        </div>
      </div>
    </div>
  );
}
