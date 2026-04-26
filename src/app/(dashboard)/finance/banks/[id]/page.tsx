"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import { useCompany } from "@/context/company-context";
import { 
  Building2, 
  ArrowLeft, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Plus, 
  Search,
  Filter,
  Download,
  Calendar,
  History,
  TrendingUp,
  Wallet,
  Landmark,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import Badge from "@/components/ui/badge";

export default function BankDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const { companies } = useCompany();
  
  const [bank, setBank] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "gelir" | "gider">("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const canView = profile?.role === "admin" || profile?.role === "finans";

  const fetchBankDetail = async () => {
    setLoading(true);
    try {
      // 1. Fetch Bank Info
      if (!bank) {
        const { data: bankData, error: bankError } = await supabase
          .from("banks")
          .select("*")
          .eq("id", id)
          .single();
        if (bankError) throw bankError;
        setBank(bankData);
      }
      
      // 2. Fetch Transactions with Backend Filters
      let query = supabase
        .from("finance_records")
        .select("*")
        .eq("banka_id", id);
      
      if (filterType !== "all") {
        query = query.eq("type", filterType);
      }

      if (filterStatus !== "all") {
        // DB status değerlerine göre eşleştirme
        if (filterStatus === "pending") query = query.ilike("status", "%bekliyor%");
        else if (filterStatus === "completed") query = query.or("status.ilike.%tahsil%,status.ilike.%ödendi%");
        else if (filterStatus === "cancelled") query = query.ilike("status", "%iptal%");
        else if (filterStatus === "overdue") query = query.ilike("status", "%gecik%");
      }
      
      const { data: recordsData, error: recordsError } = await query;
      if (recordsError) throw recordsError;

      setRecords(recordsData || []);
    } catch (err) {
      console.error("Banka detayı yüklenemedi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) {
      fetchBankDetail();
    }
  }, [id, canView, filterType, filterStatus]);

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="p-4 bg-red-50 rounded-full">
          <Landmark className="w-12 h-12 text-red-500" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Yetkisiz Erişim</h2>
        <p className="text-slate-500 font-medium">Bu sayfayı görüntüleme yetkiniz bulunmamaktadır.</p>
        <button 
          onClick={() => router.back()}
          className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm"
        >
          Geri Dön
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-40 bg-slate-100 rounded-[2.5rem]" />
        <div className="grid grid-cols-4 gap-6">
          {Array(4).fill(0).map((_, i) => <div key={i} className="h-24 bg-slate-50 rounded-2xl" />)}
        </div>
        <div className="h-[400px] bg-slate-50 rounded-[2.5rem]" />
      </div>
    );
  }

  if (!bank) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-black text-slate-900">Banka bulunamadı</h2>
        <button onClick={() => router.push("/finance/banks")} className="mt-4 text-blue-600 font-bold">Listeye Dön</button>
      </div>
    );
  }

  // Filter and sort records
  const filteredRecords = records
    .filter(r => {
      const matchSearch = r.description?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.category?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = filterType === "all" || r.type === filterType;
      const matchDate = (!dateRange.start || r.date >= dateRange.start) && 
                        (!dateRange.end || r.date <= dateRange.end);
      
      const status = (r.status || "Bekliyor").toLowerCase();
      let matchStatus = true;
      if (filterStatus !== "all") {
        if (filterStatus === "pending") matchStatus = status.includes("bekliyor") || status.includes("pending");
        else if (filterStatus === "completed") matchStatus = status.includes("tahsil") || status.includes("ödendi") || status.includes("completed");
        else if (filterStatus === "cancelled") matchStatus = status.includes("iptal") || status.includes("cancelled");
        else if (filterStatus === "overdue") matchStatus = status.includes("gecik") || status.includes("overdue");
      }

      return matchSearch && matchType && matchDate && matchStatus;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

  const getStatusBadge = (status: string) => {
    const s = (status || "Bekliyor").toLowerCase();
    
    if (s.includes("tahsil") || s.includes("ödendi") || s.includes("completed")) {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-medium border border-green-100">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>TAHSİL EDİLDİ</span>
        </div>
      );
    }
    
    if (s.includes("iptal") || s.includes("cancelled")) {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-medium border border-red-100">
          <XCircle className="w-3.5 h-3.5" />
          <span>İPTAL EDİLDİ</span>
        </div>
      );
    }
    
    if (s.includes("gecik") || s.includes("overdue")) {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-medium border border-amber-100">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>GECİKTİ</span>
        </div>
      );
    }
    
    // Default: Bekliyor
    return (
      <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-medium border border-orange-100">
        <Clock className="w-3.5 h-3.5" />
        <span>BEKLİYOR</span>
      </div>
    );
  };

  // Sağlıklı hesaplama için amount ve type kontrolü
  const calculateBankTotals = (recordsList: any[]) => {
    let income = 0;
    let expense = 0;
    
    recordsList.forEach(r => {
      // İptal edilenleri sayma (opsiyonel ama güvenli bakiye için)
      if (r.status === "İptal Edildi") return;
      
      const amt = Math.abs(Number(r.amount) || 0);
      const type = String(r.type || "").toLowerCase();
      
      // Tüm gelir/giriş tipleri
      if (type === "gelir" || type === "income" || type === "deposit") {
        income += amt;
      } 
      // Tüm gider/çıkış tipleri
      else if (type === "gider" || type === "expense" || type === "withdrawal" || type === "outgoing") {
        expense += amt;
      }
    });
    
    return { income, expense };
  };

  const { income: totalIn, expense: totalOut } = calculateBankTotals(records);
  const currentBalance = Number(bank.baslangic_bakiyesi || 0) + totalIn - totalOut;
  
  const { income: filteredIn, expense: filteredOut } = calculateBankTotals(filteredRecords);

  const companyName = companies.find(c => c.id === bank.company_id)?.company_name || bank.company_id;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Banka Listesine Dön
          </button>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-[2rem] flex items-center justify-center border border-white/10">
              <Building2 className="w-10 h-10 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-black tracking-tight">{bank.banka_adi}</h1>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 uppercase text-[10px] font-black tracking-widest px-3">
                  {companyName}
                </Badge>
              </div>
              <p className="text-slate-400 font-bold uppercase tracking-tighter text-sm mt-1">{bank.hesap_adi}</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-right space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Güncel Net Varlık</p>
          <h2 className="text-5xl font-black font-mono italic tracking-tighter text-blue-400">
            {formatCurrency(currentBalance, bank.para_birimi)}
          </h2>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[80px] -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[60px] -ml-20 -mb-20" />
      </div>

      {/* Stats Summary Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 flex items-center gap-5 border-l-4 border-l-slate-200">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
            <Wallet className="w-6 h-6 text-slate-600" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Başlangıç</p>
            <p className="font-bold text-slate-900 font-mono italic">{formatCurrency(bank.baslangic_bakiyesi, bank.para_birimi)}</p>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-5 border-l-4 border-l-green-500">
          <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Toplam Giriş</p>
            <p className="font-bold text-green-600 font-mono italic">+{formatCurrency(totalIn, bank.para_birimi)}</p>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-5 border-l-4 border-l-red-500">
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-red-600 rotate-180" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Toplam Çıkış</p>
            <p className="font-bold text-red-600 font-mono italic">-{formatCurrency(totalOut, bank.para_birimi)}</p>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-5 border-l-4 border-l-blue-500 bg-blue-500/5">
          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
            <History className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Hareket Sayısı</p>
            <p className="font-bold text-blue-600 font-mono italic">{records.length}</p>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="glass-card overflow-hidden">
        {/* Table Filters */}
        <div className="p-8 border-b border-slate-100 flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="İşlem veya kategori arayın..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 pr-6 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold w-64 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex p-1 bg-slate-100 rounded-xl w-fit">
                <button 
                  onClick={() => setFilterType("all")}
                  className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", filterType === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                >
                  Tüm İşlemler
                </button>
                <button 
                  onClick={() => setFilterType("gelir")}
                  className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", filterType === "gelir" ? "bg-white text-green-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                >
                  Giriş
                </button>
                <button 
                  onClick={() => setFilterType("gider")}
                  className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", filterType === "gider" ? "bg-white text-red-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                >
                  Çıkış
                </button>
              </div>

              <div className="flex p-1 bg-slate-100 rounded-xl overflow-x-auto no-scrollbar max-w-full">
                <button 
                  onClick={() => setFilterStatus("all")}
                  className={cn("whitespace-nowrap px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", filterStatus === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                >
                  Tüm Durumlar
                </button>
                <button 
                  onClick={() => setFilterStatus("pending")}
                  className={cn("whitespace-nowrap px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", filterStatus === "pending" ? "bg-white text-orange-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                >
                  Bekleyen
                </button>
                <button 
                  onClick={() => setFilterStatus("completed")}
                  className={cn("whitespace-nowrap px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", filterStatus === "completed" ? "bg-white text-green-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                >
                  Tamamlanan
                </button>
                <button 
                  onClick={() => setFilterStatus("cancelled")}
                  className={cn("whitespace-nowrap px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", filterStatus === "cancelled" ? "bg-white text-red-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                >
                  İptal Edilen
                </button>
                <button 
                  onClick={() => setFilterStatus("overdue")}
                  className={cn("whitespace-nowrap px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", filterStatus === "overdue" ? "bg-white text-amber-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                >
                  Gecikmiş
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input 
                  type="date" 
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="bg-transparent border-none text-[10px] font-black uppercase tracking-tight focus:ring-0 p-0"
                />
                <span className="text-slate-300">-</span>
                <input 
                  type="date" 
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="bg-transparent border-none text-[10px] font-black uppercase tracking-tight focus:ring-0 p-0"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="flex-1 lg:flex-none text-right px-6">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Seçili Aralık Net</p>
              <p className={cn("text-lg font-black font-mono italic", (filteredIn - filteredOut) >= 0 ? "text-green-600" : "text-red-600")}>
                {(filteredIn - filteredOut) >= 0 ? "+" : ""}{formatCurrency(filteredIn - filteredOut, bank.para_birimi)}
              </p>
            </div>
            <button className="p-4 bg-slate-50 text-slate-400 hover:text-slate-900 border border-slate-100 rounded-2xl transition-all">
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <button 
                    onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
                    className="flex items-center gap-2 hover:text-slate-900 transition-colors"
                  >
                    Tarih {sortOrder === "desc" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                  </button>
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tip</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Açıklama</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Durum</th>
                <th className="px-12 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Tutar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRecords.length > 0 ? filteredRecords.map((record) => (
                <tr 
                  key={record.id} 
                  className="group hover:bg-slate-50/80 transition-colors cursor-pointer"
                  onClick={() => {/* Open edit modal */}}
                >
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-900 tracking-tight">
                        {new Date(record.date).toLocaleDateString("tr-TR", { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        {new Date(record.date).toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    {record.type === "gelir" ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <ArrowUpCircle className="w-4 h-4" />
                        <span className="text-xs font-black uppercase tracking-widest">Giriş</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-600">
                        <ArrowDownCircle className="w-4 h-4" />
                        <span className="text-xs font-black uppercase tracking-widest">Çıkış</span>
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-xs font-bold px-3 py-1.5 bg-slate-100 rounded-lg text-slate-600 uppercase tracking-tighter">
                      {record.category}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800 line-clamp-1">{record.description || "Açıklama yok"}</span>
                      {record.document_no && (
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Belge: {record.document_no}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    {getStatusBadge(record.status)}
                  </td>
                  <td className="px-12 py-6 text-right">
                    <span className={cn(
                      "text-lg font-black font-mono italic",
                      record.type === "gelir" ? "text-green-600" : "text-red-500"
                    )}>
                      {record.type === "gelir" ? "+" : "-"}{formatCurrency(record.amount, bank.para_birimi)}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                        <History className="w-8 h-8" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-900 font-black">Bu bankaya ait hareket bulunamadı</p>
                        <p className="text-slate-400 text-sm font-medium">Uyguladığınız filtreleri temizleyebilir veya yeni işlem ekleyebilirsiniz.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
