"use client";

import React, { useEffect, useState } from "react";
import { ProductionService, ProductionOrder } from "@/services/production-service";
import { useAuth } from "@/context/auth-context";
import { BarChart3, TrendingUp, PackageCheck, AlertCircle } from "lucide-react";

export default function ProductionReportsPage() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let timer = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
        setError("Veri yükleme zaman aşımına uğradı");
      }
    }, 8000);

    const fetchData = async () => {
      try {
        setLoading(true);
        if (!profile?.company_id) {
          return;
        }
        const data = await ProductionService.getOrders(profile.company_id);
        console.log("Page data:", data);
        if (isMounted) {
          setOrders(data || []);
        }
      } catch (error: any) {
        console.error("Page fetch error:", error);
        if (isMounted) {
          setError(error.message || "Veri alınamadı");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
        clearTimeout(timer);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [profile]);

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold animate-pulse mt-20">Raporlar Hazırlanıyor...</div>;
  if (error) return <div className="p-8 text-red-500 font-bold text-center mt-20">{error}</div>;

  const total = orders.length;
  const completed = orders.filter(o => o.status === "tamamlandı" || o.status === "muhasebe_onayı" || o.status === "sevkiyata_hazır").length;
  const active = orders.filter(o => o.status === "üretime_alındı" || o.status === "üretimde").length;
  const pending = orders.filter(o => o.status === "bekliyor").length;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" /> Üretim Raporları
          </h1>
          <p className="text-slate-500 text-xs font-medium mt-1">İş emri bazlı üretim performans ve verimlilik metrikleri.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><TrendingUp className="w-6 h-6" /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Toplam Sipariş</p>
            <p className="text-2xl font-black text-slate-900">{total}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600"><PackageCheck className="w-6 h-6" /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tamamlanan</p>
            <p className="text-2xl font-black text-emerald-600">{completed}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600"><BarChart3 className="w-6 h-6" /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Üretimde</p>
            <p className="text-2xl font-black text-amber-600">{active}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600"><AlertCircle className="w-6 h-6" /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bekleyen</p>
            <p className="text-2xl font-black text-slate-900">{pending}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
        <h3 className="text-sm font-black text-slate-900 mb-6 uppercase tracking-widest">Üretim Tamamlanma Oranı</h3>
        <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
          <div className="bg-blue-600 h-full transition-all duration-1000 ease-out" style={{ width: `${completionRate}%` }}></div>
        </div>
        <p className="text-right mt-2 text-xs font-bold text-slate-500">%{completionRate}</p>
      </div>

    </div>
  );
}
