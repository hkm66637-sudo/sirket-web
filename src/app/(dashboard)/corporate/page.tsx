"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useCompany } from "@/context/company-context";
import { supabase } from "@/lib/supabase";
import { 
  ShoppingBag, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Palette, 
  DollarSign, 
  Truck, 
  Wrench, 
  Filter, 
  Calendar,
  User,
  ArrowRight,
  Plus
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface CorporateOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_company?: string;
  order_type: 'promosyon' | 'toptan' | 'ozel_uretim';
  current_stage: 'pazarlama' | 'grafiker' | 'muhasebe' | 'uretim' | 'depo' | 'tamamlandi';
  status: string;
  responsible_role?: string;
  total_amount?: number;
  currency?: string;
  deadline_date?: string;
  created_at: string;
}

export default function CorporateDashboard() {
  const router = useRouter();
  const { profile } = useAuth();
  const { selectedCompanyId } = useCompany();

  const [orders, setOrders] = useState<CorporateOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Zaman aşımı. Veriler yüklenemedi.")), 15000)
      );

      let query = supabase
        .from("corporate_orders")
        .select("id, order_number, customer_name, customer_company, order_type, current_stage, status, responsible_role, total_amount, currency, deadline_date, created_at")
        .order("created_at", { ascending: false });

      if (selectedCompanyId && selectedCompanyId !== "ALL") {
        query = query.eq("company_id", selectedCompanyId);
      }

      // RLS Fallback / Client Filtering based on user role
      const { data, error: fetchErr } = await Promise.race([query, timeoutPromise]) as any;

      if (fetchErr) throw fetchErr;
      
      const rawOrders = data || [];

      // Filter by role manually if RLS permits reading but we want a tailored dashboard view
      const userRole = profile?.role;
      const isAdmin = userRole === 'admin' || userRole === 'super_admin';

      const filteredByRole = rawOrders.filter((order: CorporateOrder) => {
        if (isAdmin) return true;
        if (userRole === 'pazarlama_muduru') return true; // Can see everything they initiated
        if (userRole === 'grafiker') return order.current_stage === 'grafiker';
        if (userRole === 'muhasebe_muduru') return order.current_stage === 'muhasebe';
        if (userRole === 'uretim_muduru') return order.current_stage === 'uretim';
        if (userRole === 'depo_muduru') return order.current_stage === 'depo';
        return false;
      });

      setOrders(filteredByRole);
    } catch (err: any) {
      console.error("Dashboard error:", err);
      setError(err.message || "Beklenmeyen hata");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCompanyId, profile]);

  const filteredOrders = orders.filter(order => {
    // Type Filter
    if (orderTypeFilter !== 'all' && order.order_type !== orderTypeFilter) return false;
    // Stage Filter
    if (stageFilter !== 'all' && order.current_stage !== stageFilter) return false;
    
    // Date Filter
    if (dateRange === 'today') {
      return format(new Date(order.created_at), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
    }
    if (dateRange === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return new Date(order.created_at) >= oneWeekAgo;
    }
    if (dateRange === 'month') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      return new Date(order.created_at) >= oneMonthAgo;
    }

    return true;
  });

  // Derived KPI Stats
  const stats = {
    total: filteredOrders.length,
    pending: filteredOrders.filter(o => o.current_stage !== 'tamamlandi').length,
    completed: filteredOrders.filter(o => o.current_stage === 'tamamlandi').length,
    delayed: filteredOrders.filter(o => o.deadline_date && new Date(o.deadline_date) < new Date() && o.current_stage !== 'tamamlandi').length,
    design: filteredOrders.filter(o => o.current_stage === 'grafiker').length,
    accounting: filteredOrders.filter(o => o.current_stage === 'muhasebe').length,
    production: filteredOrders.filter(o => o.current_stage === 'uretim').length,
    shipping: filteredOrders.filter(o => o.current_stage === 'depo').length,
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Sipariş Verileri Alınıyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-3xl p-8 text-center max-w-xl mx-auto mt-12 animate-in fade-in">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
        <h2 className="text-sm font-bold text-slate-800 mb-1">Sistem Hatası</h2>
        <p className="text-slate-500 text-xs mb-4 font-semibold">{error}</p>
        <button onClick={fetchData} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors">Yeniden Dene</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-blue-600" /> Kurumsal Sipariş Paneli
            </h1>
            <p className="text-slate-500 text-xs font-medium mt-1">Promosyon ve Toptan satış iş akışlarını anlık yönetin.</p>
          </div>
          {(profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'pazarlama_muduru') && (
            <button 
              onClick={() => router.push("/corporate/new")}
              className="flex items-center gap-2 bg-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-blue-700 shadow-md transition-colors"
            >
              <Plus className="w-4 h-4" /> Yeni Sipariş
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <select 
            value={dateRange} 
            onChange={(e: any) => setDateRange(e.target.value)} 
            className="text-xs font-bold bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">Tüm Zamanlar</option>
            <option value="today">Bugün</option>
            <option value="week">Son 1 Hafta</option>
            <option value="month">Son 1 Ay</option>
          </select>

          <select 
            value={orderTypeFilter} 
            onChange={(e) => setOrderTypeFilter(e.target.value)} 
            className="text-xs font-bold bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">Tüm Türler</option>
            <option value="promosyon">Promosyon</option>
            <option value="toptan">Toptan</option>
            <option value="ozel_uretim">Özel Üretim</option>
          </select>

          <select 
            value={stageFilter} 
            onChange={(e) => setStageFilter(e.target.value)} 
            className="text-xs font-bold bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">Tüm Aşamalar</option>
            <option value="pazarlama">Pazarlama</option>
            <option value="grafiker">Tasarım (Grafiker)</option>
            <option value="muhasebe">Muhasebe</option>
            <option value="uretim">Üretim</option>
            <option value="depo">Depo / Sevkiyat</option>
            <option value="tamamlandi">Tamamlandı</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Toplam Sipariş" value={stats.total} icon={<ShoppingBag className="w-5 h-5" />} color="blue" />
        <StatCard label="Bekleyen" value={stats.pending} icon={<Clock className="w-5 h-5" />} color="amber" />
        <StatCard label="Geciken" value={stats.delayed} icon={<AlertCircle className="w-5 h-5" />} color="red" />
        <StatCard label="Tamamlanan" value={stats.completed} icon={<CheckCircle2 className="w-5 h-5" />} color="green" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Tasarım Bekleyen" value={stats.design} icon={<Palette className="w-5 h-5" />} color="purple" />
        <StatCard label="Ödeme Bekleyen" value={stats.accounting} icon={<DollarSign className="w-5 h-5" />} color="emerald" />
        <StatCard label="Üretimde" value={stats.production} icon={<Wrench className="w-5 h-5" />} color="orange" />
        <StatCard label="Sevkiyat Bekleyen" value={stats.shipping} icon={<Truck className="w-5 h-5" />} color="indigo" />
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Sipariş Listesi ({filteredOrders.length})</h3>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs font-bold uppercase tracking-widest">Eşleşen sipariş bulunamadı.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
                  <th className="px-6 py-4">Sipariş Kodu</th>
                  <th className="px-6 py-4">Müşteri</th>
                  <th className="px-6 py-4">Tür</th>
                  <th className="px-6 py-4">Aşama</th>
                  <th className="px-6 py-4">Termin</th>
                  <th className="px-6 py-4 text-right">Tutar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
                {filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{order.order_number}</td>
                    <td className="px-6 py-4">{order.customer_company || order.customer_name}</td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight">
                        {order.order_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight ${
                        order.current_stage === 'tamamlandi' ? 'bg-green-50 text-green-700' :
                        order.current_stage === 'uretim' ? 'bg-orange-50 text-orange-700' :
                        order.current_stage === 'grafiker' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {order.current_stage}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black">
                      {order.deadline_date ? format(new Date(order.deadline_date), 'dd.MM.yyyy') : '-'}
                    </td>
                    <td className="px-6 py-4 text-right font-extrabold text-slate-900">
                      {order.total_amount ? `${order.total_amount.toLocaleString('tr-TR')} ${order.currency || 'TRY'}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Micro-Component Stat Card
function StatCard({ label, value, icon, color }: { label: string, value: number, icon: any, color: string }) {
  const colorMap: any = {
    blue: "text-blue-600 bg-blue-50",
    amber: "text-amber-600 bg-amber-50",
    red: "text-red-600 bg-red-50",
    green: "text-green-600 bg-green-50",
    purple: "text-purple-600 bg-purple-50",
    emerald: "text-emerald-600 bg-emerald-50",
    orange: "text-orange-600 bg-orange-50",
    indigo: "text-indigo-600 bg-indigo-50",
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center gap-4 shadow-sm">
      <div className={`w-12 h-12 flex items-center justify-center rounded-2xl ${colorMap[color] || 'bg-slate-100 text-slate-600'}`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-xl font-black text-slate-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
