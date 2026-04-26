"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  BarChart3, 
  ArrowRight,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

import { cn, formatCurrency } from "@/lib/utils";
import { useCompany } from "@/context/company-context";
import AdvancedDatePicker from "@/components/ui/AdvancedDatePicker";
import { startOfMonth, endOfMonth, format, eachMonthOfInterval, isSameMonth } from "date-fns";
import { tr } from "date-fns/locale";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  PieChart, 
  Pie,
  Legend,
  AreaChart,
  Area
} from "recharts";
import Badge from "@/components/ui/badge";

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

export default function ProfitLossPage() {
  const { profile, loading: authLoading } = useAuth();
  const { selectedCompanyId, companies, loading: companyLoading } = useCompany();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [platforms, setPlatforms] = useState<any[]>([]);
  
  // Filters
  const [dateFilter, setDateFilter] = useState<{ startDate: Date, endDate: Date, label: string }>(() => {
    const now = new Date();
    const s = startOfMonth(now);
    const e = endOfMonth(now);
    return {
      startDate: s,
      endDate: e,
      label: format(now, "MMMM yyyy", { locale: tr })
    };
  });
  const [localCompanyFilter, setLocalCompanyFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Stats
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0,
    margin: 0,
    pendingIncome: 0,
    pendingExpense: 0
  });

  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [expenseCategoryData, setExpenseCategoryData] = useState<any[]>([]);
  const [platformData, setPlatformData] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = dateFilter.startDate.toISOString();
      const endDate = dateFilter.endDate.toISOString();

      let query = supabase.from("finance_records").select("*, platforms(name), profiles:created_by(full_name)");
      
      // Date Range Filter
      query = query.gte("date", startDate).lte("date", endDate);

      // Company Filter
      if (localCompanyFilter === "COMMON") {
        query = query.is("company_id", null);
      } else if (localCompanyFilter !== "all") {
        query = query.eq("company_id", localCompanyFilter);
      } else if (selectedCompanyId && selectedCompanyId !== "ALL") {
        query = query.or(`company_id.eq.${selectedCompanyId},company_id.is.null`);
      }

      const { data: records, error } = await query.order("date", { ascending: true });
      
      if (error) throw error;
      
      if (records) {
        setData(records);
        calculateStats(records);
      }

      // Fetch platforms for filters
      const { data: platformList } = await supabase.from("platforms").select("*").eq("status", "active");
      if (platformList) setPlatforms(platformList);

    } catch (err) {
      console.error("ProfitLoss fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [dateFilter, localCompanyFilter, selectedCompanyId]);

  useEffect(() => {
    if (authLoading || companyLoading) return;
    
    const allowedRoles = ["super_admin", "admin", "finans", "muhasebe_muduru"];
    if (profile && !allowedRoles.includes(profile.role)) {
      router.push("/");
      return;
    }

    fetchData();
  }, [profile, authLoading, companyLoading, fetchData, router]);

  const calculateStats = (records: any[]) => {
    // 1. Filter out excluded records (ORTAK_CARI, etc.)
    const filteredRecords = records.filter(r => 
      r.payment_method !== "ORTAK_CARI" && 
      r.source_type !== "ORTAK_CARI" &&
      !r.description?.toLowerCase().includes("başlangıç bakiyesi") &&
      !r.description?.toLowerCase().includes("virman")
    );

    // 2. Realized Stats (Tahsil Edildi / Ödendi)
    const realizedIncome = filteredRecords
      .filter(r => r.type === "gelir" && (r.status === "Tahsil Edildi" || r.status === "Tamamlandı" || r.status === "completed"))
      .reduce((sum, r) => sum + Number(r.amount), 0);

    const realizedExpense = filteredRecords
      .filter(r => r.type === "gider" && (r.status === "Ödendi" || r.status === "Tamamlandı" || r.status === "completed"))
      .reduce((sum, r) => sum + Number(r.amount), 0);

    // 3. Pending Stats
    const pendingIncome = filteredRecords
      .filter(r => r.type === "gelir" && (r.status === "Bekliyor" || r.status === "pending"))
      .reduce((sum, r) => sum + Number(r.amount), 0);

    const pendingExpense = filteredRecords
      .filter(r => r.type === "gider" && (r.status === "Bekliyor" || r.status === "pending"))
      .reduce((sum, r) => sum + Number(r.amount), 0);

    const netProfit = realizedIncome - realizedExpense;
    const margin = realizedIncome > 0 ? (netProfit / realizedIncome) * 100 : 0;

    setStats({
      totalIncome: realizedIncome,
      totalExpense: realizedExpense,
      netProfit,
      margin,
      pendingIncome,
      pendingExpense
    });

    // 4. Monthly Distribution
    const months = eachMonthOfInterval({
      start: dateFilter.startDate,
      end: dateFilter.endDate
    });

    const mData = months.map(month => {
      const monthRecords = filteredRecords.filter(r => isSameMonth(new Date(r.date), month));
      const income = monthRecords
        .filter(r => r.type === "gelir" && (r.status === "Tahsil Edildi" || r.status === "Tamamlandı" || r.status === "completed"))
        .reduce((sum, r) => sum + Number(r.amount), 0);
      const expense = monthRecords
        .filter(r => r.type === "gider" && (r.status === "Ödendi" || r.status === "Tamamlandı" || r.status === "completed"))
        .reduce((sum, r) => sum + Number(r.amount), 0);
      
      return {
        name: format(month, "MMM", { locale: tr }),
        gelir: income,
        gider: expense,
        kar: income - expense
      };
    });
    setMonthlyData(mData);

    // 5. Category Distribution (Income)
    const incomeCats: any = {};
    filteredRecords
      .filter(r => r.type === "gelir" && (r.status === "Tahsil Edildi" || r.status === "Tamamlandı" || r.status === "completed"))
      .forEach(r => {
        const cat = r.category || "Diğer";
        incomeCats[cat] = (incomeCats[cat] || 0) + Number(r.amount);
      });
    setCategoryData(Object.entries(incomeCats).map(([name, value]) => ({ name, value })));

    // 6. Category Distribution (Expense)
    const expenseCats: any = {};
    filteredRecords
      .filter(r => r.type === "gider" && (r.status === "Ödendi" || r.status === "Tamamlandı" || r.status === "completed"))
      .forEach(r => {
        const cat = r.category || "Diğer";
        expenseCats[cat] = (expenseCats[cat] || 0) + Number(r.amount);
      });
    setExpenseCategoryData(Object.entries(expenseCats).map(([name, value]) => ({ name, value })));

    // 7. Platform Distribution
    const platData: any = {};
    filteredRecords
      .filter(r => r.type === "gelir" && (r.status === "Tahsil Edildi" || r.status === "Tamamlandı" || r.status === "completed"))
      .forEach(r => {
        const plat = r.platforms?.name || r.sub_platform || "Doğrudan / Diğer";
        platData[plat] = (platData[plat] || 0) + Number(r.amount);
      });
    setPlatformData(Object.entries(platData).map(([name, value]) => ({ name, value })).sort((a, b) => (b.value as number) - (a.value as number)));
  };

  const filteredTransactions = data.filter(r => {
    const matchesPlatform = platformFilter === "all" || (r.platforms?.name === platformFilter || r.sub_platform === platformFilter);
    const matchesCategory = categoryFilter === "all" || r.category === categoryFilter;
    const isNotExcluded = r.payment_method !== "ORTAK_CARI" && r.source_type !== "ORTAK_CARI";
    return matchesPlatform && matchesCategory && isNotExcluded;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" /> Kar / Zarar Analizi
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Şirketinizin net karlılık durumunu ve finansal verimliliğini izleyin.</p>
        </div>
        
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          <AdvancedDatePicker 
            initialRange={dateFilter}
            onApply={(range) => setDateFilter(range)}
          />
          <button 
            onClick={fetchData}
            className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
          >
            Verileri Yenile
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {/* Toplam Gelir */}
        <div className="glass-card p-6 border-l-[6px] border-green-500 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">GERÇEKLEŞEN GELİR</p>
            <h3 className="text-xl font-black text-green-600 font-mono italic">{formatCurrency(stats.totalIncome)}</h3>
            <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-green-500">
              <ArrowUpRight className="w-3 h-3" /> Tahsil Edilenler
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-green-50 rounded-full blur-2xl group-hover:bg-green-100/50 transition-colors" />
        </div>

        {/* Toplam Gider */}
        <div className="glass-card p-6 border-l-[6px] border-red-500 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">GERÇEKLEŞEN GİDER</p>
            <h3 className="text-xl font-black text-red-600 font-mono italic">{formatCurrency(stats.totalExpense)}</h3>
            <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-red-500">
              <ArrowDownRight className="w-3 h-3" /> Ödenenler
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-red-50 rounded-full blur-2xl group-hover:bg-red-100/50 transition-colors" />
        </div>

        {/* Net Kar / Zarar */}
        <div className={cn(
          "glass-card p-6 border-l-[6px] relative overflow-hidden group",
          stats.netProfit >= 0 ? "border-blue-600" : "border-amber-600"
        )}>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">NET KAR / ZARAR</p>
            <h3 className={cn(
              "text-xl font-black font-mono italic",
              stats.netProfit >= 0 ? "text-blue-600" : "text-amber-600"
            )}>{formatCurrency(stats.netProfit)}</h3>
            <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-slate-400">
              {stats.netProfit >= 0 ? "Pozitif Akış" : "Negatif Akış"}
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-blue-50 rounded-full blur-2xl group-hover:bg-blue-100/50 transition-colors" />
        </div>

        {/* Kar Marjı */}
        <div className="glass-card p-6 border-l-[6px] border-indigo-600 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">KAR MARJI %</p>
            <h3 className="text-xl font-black text-indigo-600 font-mono italic">%{stats.margin.toFixed(1)}</h3>
            <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
              Verimlilik Oranı
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-indigo-50 rounded-full blur-2xl group-hover:bg-indigo-100/50 transition-colors" />
        </div>

        {/* Bekleyen Tahsilat */}
        <div className="glass-card p-6 border-l-[6px] border-orange-500 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">BEKLEYEN TAHSİLAT</p>
            <h3 className="text-xl font-black text-orange-500 font-mono italic">{formatCurrency(stats.pendingIncome)}</h3>
            <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-slate-400">
              <Clock className="w-3 h-3" /> Potansiyel Gelir
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-orange-50 rounded-full blur-2xl group-hover:bg-orange-100/50 transition-colors" />
        </div>

        {/* Bekleyen Gider */}
        <div className="glass-card p-6 border-l-[6px] border-slate-600 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">BEKLEYEN ÖDEME</p>
            <h3 className="text-xl font-black text-slate-600 font-mono italic">{formatCurrency(stats.pendingExpense)}</h3>
            <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-slate-400">
              <Clock className="w-3 h-3" /> Yaklaşan Giderler
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-slate-100 rounded-full blur-2xl group-hover:bg-slate-200/50 transition-colors" />
        </div>
      </div>

      {/* Filters Panel */}
      <div className="glass-card p-6 bg-slate-900 border-none shadow-2xl shadow-slate-900/20 !overflow-visible">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Şirket Filtresi</label>
            <select 
              value={localCompanyFilter}
              onChange={(e) => setLocalCompanyFilter(e.target.value)}
              className="w-full bg-slate-800 border-slate-700 text-white rounded-xl py-3 px-4 text-xs font-bold focus:bg-slate-700 outline-none transition-all"
            >
              <option value="all">Tüm Şirketler</option>
              <option value="COMMON">🏛️ Ortak / Genel</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Platform Filtresi</label>
            <select 
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="w-full bg-slate-800 border-slate-700 text-white rounded-xl py-3 px-4 text-xs font-bold focus:bg-slate-700 outline-none transition-all"
            >
              <option value="all">Tüm Platformlar</option>
              {platforms.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              <option value="Doğrudan / Diğer">Doğrudan Satış / Diğer</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Kategori Filtresi</label>
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-800 border-slate-700 text-white rounded-xl py-3 px-4 text-xs font-bold focus:bg-slate-700 outline-none transition-all"
            >
              <option value="all">Tüm Kategoriler</option>
              {categoryData.concat(expenseCategoryData).map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => { setLocalCompanyFilter("all"); setPlatformFilter("all"); setCategoryFilter("all"); }}
              className="flex-1 py-3 px-4 bg-slate-700 text-white rounded-xl text-xs font-bold hover:bg-slate-600 transition-all uppercase tracking-widest"
            >
              Temizle
            </button>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly P&L Chart */}
        <div className="glass-card p-8 min-h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-black text-slate-900 tracking-tight italic">Aylık Kar / Zarar Gelişimi</h3>
            <BarChart3 className="w-5 h-5 text-blue-500 opacity-50" />
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorKar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}}
                  tickFormatter={(val) => `₺${val/1000}k`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(val: any) => formatCurrency(val)}
                />
                <Area type="monotone" dataKey="kar" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorKar)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Income & Expense Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass-card p-8 flex flex-col">
            <h3 className="text-sm font-black text-slate-900 tracking-tight mb-6 uppercase italic">Gelir Dağılımı</h3>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => formatCurrency(val)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {categoryData.slice(0, 4).map((c, i) => (
                  <div key={c.name} className="flex justify-between items-center text-[10px] font-bold">
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-slate-500 uppercase">{c.name}</span>
                    </span>
                    <span className="text-slate-900">{formatCurrency(c.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-card p-8 flex flex-col">
            <h3 className="text-sm font-black text-slate-900 tracking-tight mb-6 uppercase italic">Gider Dağılımı</h3>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={expenseCategoryData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {expenseCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => formatCurrency(val)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {expenseCategoryData.slice(0, 4).map((c, i) => (
                  <div key={c.name} className="flex justify-between items-center text-[10px] font-bold">
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-slate-500 uppercase">{c.name}</span>
                    </span>
                    <span className="text-slate-900">{formatCurrency(c.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Platform & Detail Table */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Platform Breakdown */}
        <div className="glass-card p-8 flex flex-col xl:col-span-1">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 border-b border-slate-50 pb-4">Platform Bazlı Gelir</h3>
          <div className="space-y-4">
            {platformData.map((p, i) => (
              <div key={p.name} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-[10px]">
                  {p.name[0]}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-700">{p.name}</span>
                    <span className="text-xs font-black text-slate-900 font-mono italic">{formatCurrency(p.value)}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full rounded-full" 
                      style={{ width: `${(p.value / stats.totalIncome) * 100}%` }} 
                    />
                  </div>
                </div>
              </div>
            ))}
            {platformData.length === 0 && (
              <p className="text-xs text-slate-400 italic text-center py-8">Veri bulunamadı.</p>
            )}
          </div>
        </div>

        {/* Transaction Table */}
        <div className="glass-card xl:col-span-2 overflow-hidden flex flex-col !gap-0">
          <div className="p-8 border-b border-slate-50">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Detaylı Kar / Zarar Dökümü</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase">Tarih</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase">Açıklama</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase">Kategori</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase text-right">Gelir</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase text-right">Gider</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredTransactions.slice(0, 10).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold text-slate-500">{format(new Date(item.date), "dd MMM yyyy", { locale: tr })}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-slate-800 truncate max-w-[200px]">{item.description}</p>
                      <p className="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">{item.platforms?.name || item.sub_platform || "-"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="default" className="text-[8px] uppercase tracking-tighter font-black">
                        {item.category}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-xs font-black font-mono text-green-600">
                        {item.type === "gelir" ? formatCurrency(item.amount) : "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-xs font-black font-mono text-red-600">
                        {item.type === "gider" ? formatCurrency(item.amount) : "-"}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic text-xs">Seçili kriterlerde kayıt bulunamadı.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredTransactions.length > 10 && (
            <div className="p-4 bg-slate-50 text-center">
              <button 
                onClick={() => router.push("/finance/transactions")}
                className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest flex items-center justify-center gap-2 mx-auto"
              >
                Tüm İşlemleri Gör <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
