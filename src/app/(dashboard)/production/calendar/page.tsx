"use client";

import React, { useEffect, useState } from "react";
import { ProductionService, ProductionOrder } from "@/services/production-service";
import { useAuth } from "@/context/auth-context";
import { Calendar, Clock, ArrowRight } from "lucide-react";

export default function ProductionCalendarPage() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.company_id) return;
    ProductionService.getOrders(profile.company_id).then(data => {
      setOrders(data.filter(o => o.target_date));
      setLoading(false);
    });
  }, [profile]);

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold animate-pulse mt-20">Takvim Yükleniyor...</div>;

  // Group by date
  const grouped: Record<string, ProductionOrder[]> = {};
  orders.forEach(o => {
    const d = new Date(o.target_date).toLocaleDateString("tr-TR");
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(o);
  });

  const sortedDates = Object.keys(grouped).sort((a, b) => {
    const [d1, m1, y1] = a.split(".");
    const [d2, m2, y2] = b.split(".");
    return new Date(`${y1}-${m1}-${d1}`).getTime() - new Date(`${y2}-${m2}-${d2}`).getTime();
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" /> Üretim Takvimi
          </h1>
          <p className="text-slate-500 text-xs font-medium mt-1">Gelecek termin tarihlerine göre iş emirleri ve üretim planlaması.</p>
        </div>
      </div>

      <div className="space-y-6">
        {sortedDates.map(date => (
          <div key={date} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
            <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" /> Termin Tarihi: {date}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {grouped[date].map(o => (
                <div key={o.id} className="border border-slate-100 p-4 rounded-2xl bg-slate-50 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black bg-blue-100 text-blue-600 px-2 py-1 rounded-md">{o.order_no}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{o.status}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">{o.products?.name}</h3>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                    Müşteri: <span className="text-slate-900 font-semibold">{o.customer_name}</span>
                  </p>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-1">
                    Miktar: <span className="text-indigo-600 font-black">{o.quantity} Adet</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
        {sortedDates.length === 0 && (
          <div className="text-center py-12 text-slate-400 font-semibold bg-white rounded-3xl border border-slate-100">
            Planlanmış üretim bulunamadı.
          </div>
        )}
      </div>
    </div>
  );
}
