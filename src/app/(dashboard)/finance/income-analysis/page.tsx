"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { cn, formatCurrency } from "@/lib/utils";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import { TrendingUp, Globe, ShoppingCart, Briefcase, Zap } from "lucide-react";
import { useCompany } from "@/context/company-context";
import AdvancedDatePicker from "@/components/ui/AdvancedDatePicker";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { tr } from "date-fns/locale";

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function IncomeAnalysisPage() {
  const { profile } = useAuth();
  const { selectedCompanyId } = useCompany();
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [totalRealized, setTotalRealized] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [platformData, setPlatformData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Temporarily store debug stats in state to render on screen
  const [debugStats, setDebugStats] = useState<any>(null);

  useEffect(() => {
    if (profile && profile.role === "operasyon") {
      router.push("/");
      return;
    }

    const fetchData = async () => {
      setLoading(true);

      const startDate = dateFilter.startDate.toISOString();
      const endDate = dateFilter.endDate.toISOString();

      // 1. Fetch with Date Range (SQL Filter)
      // Standardize selection to include category names from the joined table
      let query = supabase
        .from("finance_records")
        .select(`
          *,
          finance_categories (
            name
          )
        `)
        .eq("type", "gelir")
        .gte("date", startDate)
        .lte("date", endDate);
      
      const isCompanyFiltered = selectedCompanyId && selectedCompanyId !== "ALL";
      if (isCompanyFiltered) {
        query = query.eq("company_id", selectedCompanyId);
      }

      const { data: records, error } = await query;
      
      if (error) {
         console.error("Fetch Data Error:", error);
         setLoading(false);
         return;
      }

      if (!records || records.length === 0) {
        setData([]);
        setPlatformData([]);
        setTotalRealized(0);
        setTotalPending(0);
        setLoading(false);
        return;
      }

      // 2. monthlyRecords is now simply the records returned from SQL
      const monthlyRecords = records;

      // 3. Status Filters (Flexible matches)
      const isRealized = (s: string) => s === "Tahsil Edildi" || s === "TAHSİL EDİLDİ" || String(s).trim() === "Tahsil Edildi";
      const isPending = (s: string) => s === "Bekliyor" || s === "Gecikti";

      const realizedRecords = monthlyRecords.filter(r => isRealized(r.status));
      const pendingRecords = monthlyRecords.filter(r => isPending(r.status));

      const realizedTotal = realizedRecords.reduce((sum, r) => sum + Number(r.amount), 0);
      const pendingTotal = pendingRecords.reduce((sum, r) => sum + Number(r.amount), 0);

      setTotalRealized(realizedTotal);
      setTotalPending(pendingTotal);

      // Categories (Realized only for analysis)
      const categories = realizedRecords.reduce((acc: any, curr: any) => {
        // Preference order: 1. Joined category name, 2. Text category field, 3. Fallback label
        const categoryName = curr.finance_categories?.name || curr.category || "Kategorisiz Gelir";
        
        acc[categoryName] = (acc[categoryName] || 0) + Number(curr.amount);
        return acc;
      }, {});
      
      setData(Object.entries(categories)
        .map(([name, value]) => ({ name, value }))
        .filter(item => item.name !== "undefined" && item.name !== "null") // Extra safety
      );

      // Platforms (Realized only)
      const platforms = realizedRecords.reduce((acc: any, curr: any) => {
        if (curr.sub_platform) {
          acc[curr.sub_platform] = (acc[curr.sub_platform] || 0) + Number(curr.amount);
        } else {
          acc["Diğer"] = (acc["Diğer"] || 0) + Number(curr.amount);
        }
        return acc;
      }, {});
      
      setPlatformData(Object.entries(platforms).map(([name, value]) => ({ name, value })));
      setLoading(false);
    };

    fetchData();
  }, [profile, router, selectedCompanyId, dateFilter]);

  if (loading) {
     return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Veriler Analiz Ediliyor...</p>
        </div>
     );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">Gelir Analizi</h1>
          <p className="text-slate-500 text-sm font-medium">Seçili dönem: {dateFilter.label}</p>
        </div>
        <div className="w-full md:w-auto min-w-[240px] relative z-[100]">
          <AdvancedDatePicker 
            initialRange={dateFilter}
            onApply={(range) => setDateFilter(range)}
            align="right"
          />
        </div>
        <div className="flex gap-4">
           <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm min-w-[160px]">
              <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Tahsil Edilen</p>
              <p className="text-xl font-black text-slate-900">{formatCurrency(totalRealized)}</p>
           </div>
           <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm min-w-[160px]">
              <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Bekleyen</p>
              <p className="text-xl font-black text-slate-900">{formatCurrency(totalPending)}</p>
           </div>
           <button 
             onClick={() => router.push("/finance/transactions")}
             className="px-6 py-4 bg-slate-900 text-white rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
           >
             İşlemleri Gör
           </button>
        </div>
      </div>

      {totalRealized === 0 ? (
        <div className="glass-card p-20 text-center flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center">
                <TrendingUp className={cn("w-12 h-12", totalPending > 0 ? "text-orange-300" : "text-slate-200")} />
            </div>
            <div className="max-w-md mx-auto">
                <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase italic">
                    {totalPending > 0 ? "Tahsilat Bekleniyor" : "Veri Bulunamadı"}
                </h3>
                <p className="text-sm text-slate-500 mt-2 font-medium leading-relaxed">
                    {totalPending > 0 
                      ? `Bu ay için toplam ${formatCurrency(totalPending)} tutarında bekleyen gelir kaydınız bulunuyor. Analizlerin oluşması için bu kayıtları "Tahsil Edildi" olarak güncellemelisiniz.`
                      : "Bu ay için henüz herhangi bir gelir kaydı bulunmuyor. Yeni bir gelir kaydı ekleyerek analize başlayabilirsiniz."}
                </p>
                {totalPending > 0 && (
                   <button 
                     onClick={() => router.push("/finance/transactions")}
                     className="mt-8 px-8 py-4 bg-orange-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
                   >
                     Bekleyenleri Güncelle
                   </button>
                )}
            </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="glass-card p-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2 italic">
                  <TrendingUp className="w-5 h-5 text-green-500" /> Kategori Dağılımı
                </h2>
              </div>

              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => formatCurrency(Number(value))}
                      contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                    />
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card flex flex-col">
              <div className="p-8 border-b border-slate-50 bg-slate-50/30">
                <h2 className="font-black text-slate-900 uppercase text-sm tracking-widest italic">Performans Detayları</h2>
              </div>
              <div className="p-8 flex-1 space-y-6">
                {data.sort((a,b) => b.value - a.value).map((item, index) => (
                  <div key={item.name} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-sm font-bold text-slate-700">{item.name}</span>
                      </div>
                      <span className="text-sm font-mono font-black text-slate-900">{formatCurrency(item.value)}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden shadow-inner">
                      <div 
                        className="h-full rounded-full transition-all duration-1000" 
                        style={{ 
                          width: `${(item.value / totalRealized) * 100}%`,
                          backgroundColor: COLORS[index % COLORS.length]
                        }} 
                      />
                    </div>
                    <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      <span>Pay: %{((item.value / totalRealized) * 100).toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-card p-10">
            <h2 className="text-lg font-black text-slate-900 mb-8 flex items-center gap-2 uppercase italic tracking-tight">
              <ShoppingCart className="w-5 h-5 text-blue-500" /> Platform Dağılım Analizi
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {platformData.map((plat, idx) => {
                const colors = ["text-orange-500", "text-blue-500", "text-green-500", "text-slate-500"];
                const bgs = ["bg-orange-50/50", "bg-blue-50/50", "bg-green-50/50", "bg-slate-50/50"];
                const icons = [Zap, Globe, ShoppingCart, Briefcase];
                const Icon = icons[idx % icons.length];
                
                return (
                  <div key={plat.name} className={cn("p-8 rounded-[2rem] border border-transparent transition-all text-center hover:shadow-xl hover:shadow-slate-200/50", bgs[idx % bgs.length])}>
                    <Icon className={cn("w-7 h-7 mx-auto mb-4", colors[idx % colors.length])} />
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">{plat.name}</p>
                    <p className={cn("text-xl font-black", colors[idx % colors.length])}>{formatCurrency(plat.value)}</p>
                    <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-tighter">Pay: %{((plat.value / totalRealized) * 100).toFixed(1)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
