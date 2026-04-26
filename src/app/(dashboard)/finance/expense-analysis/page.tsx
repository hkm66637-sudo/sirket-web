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
import { TrendingDown, Activity, Package, User, Building, Landmark, MoreHorizontal } from "lucide-react";
import { useCompany } from "@/context/company-context";
import Badge from "@/components/ui/badge";
import AdvancedDatePicker from "@/components/ui/AdvancedDatePicker";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { tr } from "date-fns/locale";

const COLORS = ["#ef4444", "#f87171", "#fb923c", "#fcd34d", "#c084fc", "#94a3b8"];

export default function ExpenseAnalysisPage() {
  const { profile } = useAuth();
  const { selectedCompanyId } = useCompany();
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [totalRealized, setTotalRealized] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
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
  const [strategicData, setStrategicData] = useState<{ financial: any[], operational: any[] }>({ financial: [], operational: [] });

  useEffect(() => {
    if (profile && profile.role === "operasyon") {
      router.push("/");
      return;
    }

    const fetchData = async () => {
      setLoading(true);

      const startDate = dateFilter.startDate.toISOString();
      const endDate = dateFilter.endDate.toISOString();

      let query = supabase
        .from("finance_records")
        .select("*")
        .eq("type", "gider")
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
        setStrategicData({ financial: [], operational: [] });
        setTotalRealized(0);
        setTotalPending(0);
        setLoading(false);
        return;
      }

      // 2. monthlyRecords is now simply the records returned from SQL
      const monthlyRecords = records;

      // 3. Flexibly matching statuses
      const isRealized = (s: string) => s === "Ödendi" || s === "ÖDENDİ" || String(s).trim() === "Ödendi";
      const isPending = (s: string) => s === "Bekliyor" || s === "Gecikti";

      const realizedRecords = monthlyRecords.filter(r => isRealized(r.status));
      const pendingRecords = monthlyRecords.filter(r => isPending(r.status));

      const realizedTotal = realizedRecords.reduce((sum, r) => sum + Number(r.amount), 0);
      const pendingTotal = pendingRecords.reduce((sum, r) => sum + Number(r.amount), 0);

      setTotalRealized(realizedTotal);
      setTotalPending(pendingTotal);

      // Categories (Realized only)
      const categories = realizedRecords.reduce((acc: any, curr: any) => {
        acc[curr.category] = (acc[curr.category] || 0) + Number(curr.amount);
        return acc;
      }, {});
      
      const chartData = Object.entries(categories).map(([name, value]) => ({ name, value }));
      setData(chartData);

      // Strategic Mapping
      const financialKeywords = ["kredi", "çek", "banka", "finans", "taksit", "borç", "tedarikçi"];
      const financial: any[] = [];
      const operational: any[] = [];

      Object.entries(categories).forEach(([name, value]) => {
         const lowerName = name.toLowerCase();
         const isFinancial = financialKeywords.some(kw => lowerName.includes(kw));
         if (isFinancial) {
             financial.push({ label: name, value: value });
         } else {
             operational.push({ label: name, value: value });
         }
      });

      setStrategicData({ financial, operational });
      setLoading(false);
    };

    fetchData();
  }, [profile, router, selectedCompanyId, dateFilter]);

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 border-4 border-red-100 border-t-red-500 rounded-full animate-spin" />
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Giderler Analiz Ediliyor...</p>
        </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">Gider Analizi</h1>
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
              <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Ödenen Gider</p>
              <p className="text-xl font-black text-slate-900">{formatCurrency(totalRealized)}</p>
           </div>
           <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm min-w-[160px]">
              <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Bekleyen Gider</p>
              <p className="text-xl font-black text-slate-900">{formatCurrency(totalPending)}</p>
           </div>
           <button 
             onClick={() => router.push("/finance/transactions")}
             className="px-6 py-4 bg-slate-900 text-white rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-xl shadow-slate-200"
           >
             İşlemleri Gör
           </button>
        </div>
      </div>

      {totalRealized === 0 ? (
        <div className="glass-card p-20 text-center flex flex-col items-center gap-6 animate-in slide-in-from-bottom-4 duration-700">
            <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center">
                <TrendingDown className={cn("w-12 h-12 transition-colors", totalPending > 0 ? "text-orange-300" : "text-slate-200")} />
            </div>
            <div className="max-w-md mx-auto">
                <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase italic">
                  {totalPending > 0 ? "Ödeme Bekleyen Kayıtlar Var" : "Gider Kaydı Bulunmuyor"}
                </h3>
                <p className="text-sm text-slate-500 mt-2 font-medium leading-relaxed">
                    {totalPending > 0 
                      ? `Bu ay için toplam ${formatCurrency(totalPending)} tutarında ödenmeyi bekleyen gideriniz bulunuyor. Bu kayıtları "Ödendi" durumuna çektiğinizde analiz grafikleri oluşacaktır.`
                      : "Bu ay için sisteme girilmiş herhangi bir gider kaydı bulunamadı. Yeni bir gider ekleyerek analizi başlatabilirsiniz."}
                </p>
                {totalPending > 0 && (
                   <button 
                     onClick={() => router.push("/finance/transactions")}
                     className="mt-8 px-8 py-4 bg-orange-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
                   >
                     Ödemeleri Güncelle
                   </button>
                )}
            </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="glass-card p-8">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-8 italic">Kategori Dağılımı</h2>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      innerRadius={100}
                      outerRadius={140}
                      paddingAngle={2}
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
                    <Legend iconType="rect" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card flex flex-col p-8">
              <h2 className="text-sm font-black text-slate-900 mb-8 uppercase tracking-widest italic">Gider Kalemleri</h2>
              <div className="space-y-6 flex-1">
                {data.sort((a,b) => b.value - a.value).map((item, index) => (
                  <div key={item.name} className="relative">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-700">{item.name}</span>
                        <Badge variant="outline" className="text-[9px] font-black italic">%{((item.value / totalRealized) * 100).toFixed(1)}</Badge>
                      </div>
                      <span className="text-sm font-black text-slate-900">{formatCurrency(item.value)}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden shadow-inner">
                      <div 
                        className="h-full rounded-full transition-all duration-700 delay-200" 
                        style={{ 
                          width: `${(item.value / totalRealized) * 100}%`,
                          backgroundColor: COLORS[index % COLORS.length]
                        }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-card p-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-4 bg-red-50 text-red-500 rounded-[1.5rem]"><Landmark className="w-6 h-6" /></div>
                <h2 className="text-lg font-black text-slate-900 uppercase italic tracking-tight">Finansal Giderler</h2>
              </div>
              <div className="space-y-4">
                {strategicData.financial.length > 0 ? strategicData.financial.map(row => (
                  <div key={row.label} className="flex justify-between items-center p-5 bg-slate-50/50 rounded-2xl border border-slate-100/50 transition-all hover:bg-white hover:shadow-lg hover:shadow-slate-100">
                    <span className="text-sm font-bold text-slate-600">{row.label}</span>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900">{formatCurrency(row.value)}</p>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Pay: %{((row.value / totalRealized) * 100).toFixed(1)}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-xs text-slate-400 font-medium italic text-center py-6 bg-slate-50 rounded-2xl">Bu grupta gerçekleşmiş gider bulunmuyor.</p>
                )}
              </div>
            </div>

            <div className="glass-card p-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-4 bg-blue-50 text-blue-500 rounded-[1.5rem]"><Activity className="w-6 h-6" /></div>
                <h2 className="text-lg font-black text-slate-900 uppercase italic tracking-tight">Operasyonel Giderler</h2>
              </div>
              <div className="space-y-4">
                {strategicData.operational.length > 0 ? strategicData.operational.map(row => (
                  <div key={row.label} className="flex justify-between items-center p-5 bg-slate-50/50 rounded-2xl border border-slate-100/50 transition-all hover:bg-white hover:shadow-lg hover:shadow-slate-100">
                    <span className="text-sm font-bold text-slate-600">{row.label}</span>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900">{formatCurrency(row.value)}</p>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Pay: %{((row.value / totalRealized) * 100).toFixed(1)}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-xs text-slate-400 font-medium italic text-center py-6 bg-slate-50 rounded-2xl">Bu grupta gerçekleşmiş gider bulunmuyor.</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
