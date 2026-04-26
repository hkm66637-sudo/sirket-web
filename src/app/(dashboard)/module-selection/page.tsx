"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Factory, Calculator, ArrowRight } from "lucide-react";

export default function ModuleSelectionPage() {
  const router = useRouter();

  const modules = [
    {
      id: "ecommerce",
      title: "E-Ticaret Modülü",
      description: "Sipariş takibi, ürün yönetimi ve pazaryeri entegrasyonlarını kontrol edin.",
      icon: ShoppingCart,
      color: "from-purple-600 to-indigo-600",
      shadow: "shadow-purple-500/20",
      target: "/ecommerce"
    },
    {
      id: "production",
      title: "Üretim Modülü",
      description: "Fabrika süreçleri, hammadde takipleri ve iş emirlerini yönetin.",
      icon: Factory,
      color: "from-amber-500 to-orange-600",
      shadow: "shadow-amber-500/20",
      target: "/production"
    },
    {
      id: "finance",
      title: "Muhasebe / Finans",
      description: "Cari hesaplar, banka transferleri ve nakit akışını takip edin.",
      icon: Calculator,
      color: "from-blue-600 to-cyan-600",
      shadow: "shadow-blue-500/20",
      target: "/"
    }
  ];

  const handleSelect = (moduleId: string, target: string) => {
    localStorage.setItem("active_module", moduleId);
    router.push(target);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl" />

      <div className="max-w-6xl w-full py-12 relative z-10">
        <div className="text-center mb-16">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 italic shadow-lg shadow-blue-600/30">
            SP
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight sm:text-5xl">
            Modül Seçimi
          </h1>
          <p className="text-slate-400 mt-4 text-lg font-medium max-w-md mx-auto">
            Çalışmak istediğiniz kurumsal yönetim alanını seçerek devam edin.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {modules.map((mod) => (
            <div 
              key={mod.id}
              onClick={() => handleSelect(mod.id, mod.target)}
              className="group relative bg-slate-900/40 border border-slate-800/80 hover:border-slate-700/80 backdrop-blur-xl rounded-[2.5rem] p-8 cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:bg-slate-900/80"
            >
              {/* Card Accent Glow */}
              <div className={`absolute inset-0 bg-gradient-to-br ${mod.color} opacity-0 group-hover:opacity-5 rounded-[2.5rem] transition-opacity duration-500`} />

              <div className={`w-14 h-14 bg-gradient-to-br ${mod.color} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg ${mod.shadow} group-hover:scale-110 transition-transform duration-500`}>
                <mod.icon className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                {mod.title}
              </h3>
              
              <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8">
                {mod.description}
              </p>

              <div className="flex items-center gap-2 text-slate-400 text-xs font-bold group-hover:text-white transition-colors mt-auto">
                Modüle Git <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
