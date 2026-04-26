"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StatCard from "@/components/dashboard/StatCard";
import { useAuth } from "@/context/auth-context";
import { DashboardService } from "@/services/dashboard-service";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  AlertCircle,
  ArrowRight,
  PieChart as PieChartIcon,
  Wallet,
  Target,
  Building2,
  RefreshCw,
  Users
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { useCompany } from "@/context/company-context";
import CompanySelector from "@/components/layout/CompanySelector";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";

import AdvancedDatePicker from "@/components/ui/AdvancedDatePicker";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { tr } from "date-fns/locale";

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

export default function Dashboard() {
  const router = useRouter();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { selectedCompanyId, loading: companyLoading } = useCompany();
  const [data, setData] = useState<any>(null);
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

  useEffect(() => {
    let isMounted = true;

    if (companyLoading) {
      console.log("⏳ Dashboard: Context bekleniyor...");
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log(`🚀 Dashboard: Fetch Started (${selectedCompanyId}) | Range: ${dateFilter.label}`);
        const dashboardData = await DashboardService.getDashboardData(selectedCompanyId, {
          startDate: dateFilter.startDate,
          endDate: dateFilter.endDate
        });
        
        if (isMounted) {
          setData(dashboardData);
          console.log("✅ Dashboard: Fetch Completed");
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("❌ Dashboard: Fetch Error", err);
          setError(err.message || "Veriler yüklenirken bir hata oluştu.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [selectedCompanyId, companyLoading, dateFilter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">Dashboard Hazırlanıyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-[2.5rem] p-12 text-center max-w-2xl mx-auto mt-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-black text-slate-900 mb-2">Sistem Hatası</h2>
        <p className="text-slate-500 text-sm mb-6 font-medium">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="primary flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" /> Yeniden Dene
        </button>
      </div>
    );
  }

  const { stats, banks, charts, operational } = data;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Şirket Özeti</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Veriler seçili şirkete ve tarih aralığına göre anlık güncellenir.</p>
        </div>
        <div className="w-full md:w-auto min-w-[240px] relative z-[100]">
          <AdvancedDatePicker 
            initialRange={dateFilter}
            onApply={(range) => setDateFilter(range)}
            align="right"
          />
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard 
          label="Toplam Banka Varlığı" 
          value={formatCurrency(stats.totalBankAssets)} 
          change="Tüm Aktif Hesaplar" 
          trend="up"
          icon={<Building2 className="w-6 h-6" />}
          color="blue"
        />
        <StatCard 
          label="Bu Ay Toplam Gelir" 
          value={formatCurrency(stats.income)} 
          change="Cari Ay Verisi" 
          trend="up"
          icon={<TrendingUp className="w-6 h-6" />}
          color="green"
        />
        <StatCard 
          label="Bu Ay Toplam Gider" 
          value={formatCurrency(stats.expense)} 
          change="Cari Ay Verisi" 
          trend="up"
          icon={<TrendingDown className="w-6 h-6" />}
          color="red"
        />
        <StatCard 
          label="Net Nakit Değişimi" 
          value={formatCurrency(stats.net)} 
          change="Gelir - Gider Farkı" 
          trend={stats.net >= 0 ? "up" : "down"}
          icon={<Target className="w-6 h-6" />}
          color={stats.net >= 0 ? "blue" : "red"}
        />
        <div 
          onClick={() => router.push("/tasks?filter=Gecikenler")}
          className="cursor-pointer group"
        >
          <StatCard 
            label="Geciken Görevler" 
            value={stats.delayedTasks} 
            change={stats.delayedTasks > 0 ? "Aksiyon Bekliyor" : "Planlı İlerleme"} 
            trend={stats.delayedTasks > 0 ? "down" : "up"}
            icon={<AlertCircle className="w-6 h-6" />}
            color="orange"
          />
        </div>
        <div 
          onClick={() => router.push("/finance/partners")}
          className="cursor-pointer group"
        >
          <StatCard 
            label="Ortaklardan Alacak" 
            value={formatCurrency(stats.partnerReceivables || 0)} 
            change="Ortak Cari Toplamı" 
            trend="up"
            icon={<Users className="w-6 h-6" />}
            color="blue"
          />
        </div>
        <div 
          onClick={() => router.push("/finance/partners")}
          className="cursor-pointer group"
        >
          <StatCard 
            label="Ortaklara Borç" 
            value={formatCurrency(stats.partnerPayables || 0)} 
            change="Ortak Cari Toplamı" 
            trend="down"
            icon={<Users className="w-6 h-6" />}
            color="orange"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bank Balances List */}
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Wallet className="w-4 h-4 text-blue-500" /> Banka Bakiyeleri
            </h3>
            <button 
              onClick={() => router.push("/finance/banks")}
              className="text-[10px] font-black text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest"
            >
              Yönetimi Gör
            </button>
          </div>
          <div className="space-y-4">
            {banks.length > 0 ? banks.map((bank: any) => (
              <div key={bank.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-bold group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  {bank.banka_adi[0]}
                </div>

                <div className="flex flex-col">
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
                    {bank.company_name || "GENEL"}
                  </span>

                  <span className="text-sm font-semibold text-slate-800">
                    {bank.banka_adi}
                  </span>

                  <span className="text-xs text-slate-400">
                    {bank.hesap_adi}
                  </span>
                </div>

                <div className="ml-auto text-sm font-black text-slate-900 font-mono italic">
                  {formatCurrency(bank.currentBalance)}
                </div>
              </div>
            )) : (
              <div className="p-8 text-center text-slate-400 italic text-xs">Aktif banka hesabı bulunmuyor.</div>
            )}
          </div>
        </div>

        {/* Analytics Section - Monthly Performance */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" /> Aylık Performans (k₺)
          </h3>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.performance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="ay" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: '800', color: '#1e293b', marginBottom: '4px' }}
                />
                <Bar dataKey="gelir" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} name="Gelir" />
                <Bar dataKey="gider" fill="#f87171" radius={[4, 4, 0, 0]} barSize={20} name="Gider" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-center gap-6">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" /> Gelir
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <div className="w-2.5 h-2.5 bg-red-400 rounded-full" /> Gider
            </div>
          </div>
        </div>
      </div>

      {/* Distribution Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Income Distribution */}
        <div className="glass-card p-6 flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-green-500" /> Kategori Bazlı Gelirler
          </h3>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.incomeDist.length > 0 ? charts.incomeDist : [{name: 'Veri Yok', value: 1}]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {charts.incomeDist.map((_: any, index: number) => (
                    <Cell key={`cell-inc-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                  {charts.incomeDist.length === 0 && <Cell fill="#f1f5f9" />}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {charts.incomeDist.length > 0 ? charts.incomeDist.slice(0, 4).map((item: any, i: number) => (
              <div key={item.name} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-slate-500 font-bold uppercase text-[10px] tracking-tight">{item.name}</span>
                </div>
                <span className="font-black text-slate-900">{formatCurrency(item.value)}</span>
              </div>
            )) : <div className="text-center text-[10px] text-slate-400 uppercase py-4">Bu ay henüz gelir kaydı yok.</div>}
          </div>
        </div>

        {/* Expense Distribution */}
        <div className="glass-card p-6 flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-red-500" /> Kategori Bazlı Giderler
          </h3>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.expenseDist.length > 0 ? charts.expenseDist : [{name: 'Veri Yok', value: 1}]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {charts.expenseDist.map((_: any, index: number) => (
                    <Cell key={`cell-exp-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                  {charts.expenseDist.length === 0 && <Cell fill="#f1f5f9" />}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {charts.expenseDist.length > 0 ? charts.expenseDist.slice(0, 4).map((item: any, i: number) => (
              <div key={item.name} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-slate-500 font-bold uppercase text-[10px] tracking-tight">{item.name}</span>
                </div>
                <span className="font-black text-slate-900">{formatCurrency(item.value)}</span>
              </div>
            )) : <div className="text-center text-[10px] text-slate-400 uppercase py-4">Bu ay henüz gider kaydı yok.</div>}
          </div>
        </div>
      </div>

      {/* Operational Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Tasks */}
        <div className="space-y-8">
          {/* Today's Tasks */}
          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 uppercase text-xs tracking-widest">
                <Clock className="w-4 h-4 text-blue-500" /> Bugün Yapılacaklar
              </h3>
              <button 
                onClick={() => router.push("/tasks")}
                className="text-blue-600 text-[10px] font-black hover:underline uppercase tracking-widest"
              >
                Tümünü Gör
              </button>
            </div>
            <div className="divide-y divide-slate-50">
              {operational.todayTasks.length > 0 ? operational.todayTasks.map((task: any) => (
                <div 
                  key={task.id} 
                  className="flex items-center gap-4 p-5 hover:bg-slate-50 transition-all group cursor-pointer"
                  onClick={() => router.push("/tasks")}
                >
                  <div className="w-5 h-5 rounded border-2 border-slate-200 group-hover:border-blue-400 transition-colors flex items-center justify-center">
                    {task.status === "Tamamlandı" && <div className="w-2 h-2 bg-blue-500 rounded-sm" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800 leading-tight">{task.title}</p>
                    <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-tight">
                      {task.module} • {task.priority}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0" />
                </div>
              )) : (
                <div className="p-16 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                  Bugün için görev planlanmamış.
                </div>
              )}
            </div>
          </div>

          {/* Delayed Tasks List */}
          <div className="glass-card overflow-hidden border-red-100">
            <div className="p-6 border-b border-red-50 flex justify-between items-center bg-red-50/30">
              <h3 className="font-bold text-red-600 flex items-center gap-2 uppercase text-xs tracking-widest">
                <AlertCircle className="w-4 h-4" /> Kritik Gecikmiş Görevler
              </h3>
              {stats.delayedTasks > 0 && <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-lg tracking-widest">{stats.delayedTasks} ADET</span>}
            </div>
            <div className="divide-y divide-red-50/50">
              {operational.delayedTasks.length > 0 ? operational.delayedTasks.map((task: any) => (
                <div 
                  key={task.id} 
                  className="flex items-center gap-4 p-5 hover:bg-red-50/50 transition-all cursor-pointer group"
                  onClick={() => router.push("/tasks?filter=Gecikenler")}
                >
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600 shadow-sm border border-red-200 group-hover:scale-110 transition-transform">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900 leading-tight">{task.title}</p>
                    <p className="text-[10px] font-black text-red-400 mt-1 uppercase tracking-tight">
                      {new Date(task.due_date).toLocaleDateString("tr-TR")} Tarihinde Gecikti
                    </p>
                  </div>
                  <div className="text-[10px] font-black text-blue-600 bg-white border border-blue-200 px-3 py-1.5 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                    GÜNCELLE
                  </div>
                </div>
              )) : (
                <div className="p-16 text-center text-green-500 text-[10px] font-bold uppercase tracking-widest">
                  Harika! Geciken görev bulunmuyor.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Finance Upcoming */}
        <div className="space-y-8">
          {/* Upcoming Payments */}
          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 uppercase text-xs tracking-widest">
                <TrendingDown className="w-4 h-4 text-red-500" /> Yaklaşan Ödemeler
              </h3>
              <DollarSign className="w-4 h-4 text-slate-300" />
            </div>
            <div className="divide-y divide-slate-50">
              {operational.upcomingPayments.length > 0 ? operational.upcomingPayments.map((p: any) => (
                <div 
                  key={p.id} 
                  className="flex justify-between items-center p-5 hover:bg-slate-50 transition-all cursor-pointer"
                  onClick={() => router.push("/finance")}
                >
                  <div>
                    <p className="text-sm font-bold text-slate-800 leading-tight">{p.description || "Gider Kaydı"}</p>
                    <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-tight">
                      {p.category} • {p.payment_method} {p.companies?.company_name && <span className="text-red-500 ml-1">• {p.companies.company_name}</span>}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-red-600 font-mono italic">-{formatCurrency(p.amount)}</p>
                    <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-tight">
                      {new Date(p.date).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                </div>
              )) : (
                <div className="p-16 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                  Yakın zamanda ödeme planlanmamış.
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Collections */}
          <div className="glass-card overflow-hidden border-green-100">
            <div className="p-6 border-b border-green-50 bg-green-50/30 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 uppercase text-xs tracking-widest">
                <TrendingUp className="w-4 h-4 text-green-600" /> Beklenen Tahsilatlar
              </h3>
              <Target className="w-4 h-4 text-green-400" />
            </div>
            <div className="divide-y divide-green-50/30">
              {operational.upcomingCollections.length > 0 ? operational.upcomingCollections.map((c: any) => (
                <div 
                  key={c.id} 
                  className="flex justify-between items-center p-5 hover:bg-green-50/20 transition-all cursor-pointer"
                  onClick={() => router.push("/finance")}
                >
                  <div>
                    <p className="text-sm font-bold text-slate-800 leading-tight">{c.description || "Gelir Kaydı"}</p>
                    <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-tight">
                      {c.category} • {c.payment_method} {c.companies?.company_name && <span className="text-green-600 ml-1">• {c.companies.company_name}</span>}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-green-600 font-mono italic">+{formatCurrency(c.amount)}</p>
                    <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-tight">
                      {new Date(c.date).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                </div>
              )) : (
                <div className="p-16 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                  Beklenen bir tahsilat bulunmuyor.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
