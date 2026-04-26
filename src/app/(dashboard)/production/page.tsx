"use client";

import React, { useEffect, useState } from "react";
import { ProductionService, ProductionOrder } from "@/services/production-service";
import { useAuth } from "@/context/auth-context";
import { 
  Factory, Package, AlertTriangle, CheckCircle, 
  Clock, Truck, DollarSign, ArrowRight 
} from "lucide-react";
import Link from "next/link";

export default function ProductionDashboard() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.company_id) {
      ProductionService.getOrders(profile.company_id)
        .then(setOrders)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [profile]);

  if (loading) {
    return <div className="p-8 text-slate-500 font-bold animate-pulse">Yükleniyor...</div>;
  }

  // Aggregate stats
  const stats = {
    bekleyen: orders.filter(o => o.status === 'bekliyor').length,
    uretimde: orders.filter(o => ['üretime_alındı', 'üretimde'].includes(o.status)).length,
    geciken: orders.filter(o => o.status !== 'sevk_edildi' && new Date(o.target_date) < new Date()).length,
    tamamlanan: orders.filter(o => o.status === 'tamamlandı').length,
    muhasebeOnay: orders.filter(o => o.status === 'muhasebe_onayı').length,
    sevkiyataHazir: orders.filter(o => o.status === 'sevkiyata_hazır').length,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Factory className="w-6 h-6 text-blue-600" /> Üretim Kontrol Paneli
          </h1>
          <p className="text-slate-500 text-xs font-medium mt-1">Fabrika iş akışlarını gerçek zamanlı görüntüleyin.</p>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Bekleyen", value: stats.bekleyen, icon: Clock, color: "bg-slate-100 text-slate-700" },
          { label: "Üretimde", value: stats.uretimde, icon: Factory, color: "bg-blue-50 text-blue-600" },
          { label: "Geciken", value: stats.geciken, icon: AlertTriangle, color: "bg-red-50 text-red-600" },
          { label: "Muhasebe Onayı", value: stats.muhasebeOnay, icon: DollarSign, color: "bg-amber-50 text-amber-600" },
          { label: "Sevkiyata Hazır", value: stats.sevkiyataHazir, icon: Package, color: "bg-green-50 text-green-600" },
          { label: "Tüm Siparişler", value: orders.length, icon: CheckCircle, color: "bg-indigo-50 text-indigo-600" },
        ].map((s, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center mb-3`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900">{s.value}</span>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Siparişler", href: "/production/orders", icon: Clock },
          { label: "Ürünler & Reçeteler", href: "/production/products", icon: Package },
          { label: "Hammadde Stok", href: "/production/raw-materials", icon: Factory },
          { label: "Makineler", href: "/production/machines", icon: Truck },
        ].map((link, idx) => (
          <Link href={link.href} key={idx}>
            <div className="bg-slate-900 text-white p-6 rounded-2xl flex items-center justify-between hover:bg-slate-800 transition-colors shadow-lg group">
              <span className="text-sm font-bold flex items-center gap-2">
                <link.icon className="w-4 h-4 text-blue-400" /> {link.label}
              </span>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
