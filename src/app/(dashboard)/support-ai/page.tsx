"use client";

import React from "react";
import { HelpCircle, Bot, Sparkles, Brain, Cpu } from "lucide-react";

export default function SupportAIPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      {/* AI Icon / Visual */}
      <div className="relative">
        <div className="absolute inset-0 bg-blue-500 rounded-full blur-3xl opacity-20 animate-pulse duration-3000" />
        <div className="relative w-24 h-24 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-600/30 transform hover:rotate-6 transition-transform duration-500">
          <Bot className="w-12 h-12" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-md animate-bounce">
          <Sparkles className="w-4 h-4" />
        </div>
      </div>

      {/* Text Content */}
      <div className="text-center max-w-lg mx-auto space-y-4">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Destek AI
        </h1>
        <p className="text-slate-500 text-base font-medium">
          Akıllı asistanınız çok yakında burada olacak. Sorularınızı yanıtlamak ve süreçlerinizi optimize etmek için hazırlanıyor.
        </p>
      </div>

      {/* Feature Preview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl mt-8">
        <div className="glass-card p-6 flex flex-col items-center text-center group hover:border-blue-200 transition-all">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors mb-4">
            <Brain className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Akıllı Analiz</h3>
          <p className="text-xs text-slate-400">Verilerinizi inceleyerek anormallikleri tespit eder.</p>
        </div>

        <div className="glass-card p-6 flex flex-col items-center text-center group hover:border-blue-200 transition-all">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors mb-4">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Hızlı Çözümler</h3>
          <p className="text-xs text-slate-400">Sık karşılaşılan sorunlara anında yanıt verir.</p>
        </div>

        <div className="glass-card p-6 flex flex-col items-center text-center group hover:border-blue-200 transition-all">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors mb-4">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Otomasyon</h3>
          <p className="text-xs text-slate-400">Tekrarlayan görevleri sizin yerinize tamamlar.</p>
        </div>
      </div>

      {/* Badge / Message */}
      <div className="bg-blue-50 border border-blue-100 text-blue-700 text-xs font-black uppercase tracking-widest px-6 py-3 rounded-full shadow-sm animate-pulse">
        Destek AI modülü yakında aktif olacak
      </div>
    </div>
  );
}
