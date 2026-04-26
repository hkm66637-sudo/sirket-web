"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Search, 
  Download,
  Filter,
  Wallet,
  ChevronDown,
  Tag,
  CheckCircle2,
  Clock,
  XCircle,
  Building2,
  TrendingUp,
  TrendingDown,
  Edit3,
  Copy,
  Trash
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useCompany } from "@/context/company-context";
import Badge from "@/components/ui/badge";
import FormField from "@/components/ui/form-field";
import Select from "@/components/ui/select";
import Input from "@/components/ui/input";
import AddTransactionModal from "@/components/finance/AddTransactionModal";
import EditTransactionModal from "@/components/finance/EditTransactionModal";
import AdvancedDatePicker from "@/components/ui/AdvancedDatePicker";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { tr } from "date-fns/locale";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Toast from "@/components/ui/Toast";
import StatusUpdateModal from "@/components/finance/StatusUpdateModal";
import * as XLSX from "xlsx";

const statusIcons: any = {
  "Ödendi": <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />,
  "Bekliyor": <Clock className="w-3.5 h-3.5 text-orange-500" />,
  "İptal Edildi": <XCircle className="w-3.5 h-3.5 text-red-500" />,
  "Tahsil Edildi": <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />,
  "Gecikti": <Clock className="w-3.5 h-3.5 text-red-600" />,
};

const statusVariants: any = {
  "Ödendi": "success",
  "Bekliyor": "warning",
  "İptal Edildi": "danger",
  "Tahsil Edildi": "info",
  "Gecikti": "danger",
};

export default function FinanceManagementPage() {
  const { profile, loading: authLoading } = useAuth();
  const { selectedCompanyId, companies, loading: companyLoading } = useCompany();
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any | null>(null);
  const [copyingTransaction, setCopyingTransaction] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<"all" | "gelir" | "gider">("all");
  const [specificCategory, setSpecificCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [localCompanyFilter, setLocalCompanyFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
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

  const [stats, setStats] = useState({ gelir: 0, gider: 0, net: 0 });
  const [upcoming, setUpcoming] = useState<any[]>([]);

  // Status updates & Toast
  const [statusModalItem, setStatusModalItem] = useState<any | null>(null);
  const [mounted, setMounted] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{message: string, type: 'success' | 'error' | 'info' | 'warning'} | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant?: "danger" | "info";
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  // We define logic inline in useEffect to easily use isMounted.
  // We keep dependencies clear.


  // Real-time Stats Calculation (Derive from data)
  useEffect(() => {
    // data already filtered by month in fetchData
    const gelir = data
      .filter(r => r.type === "gelir" && r.status === "Tahsil Edildi")
      .reduce((s, r) => s + Number(r.amount), 0);
      
    const gider = data
      .filter(r => r.type === "gider" && r.status === "Ödendi")
      .reduce((s, r) => s + Number(r.amount), 0);
      
    setStats({ gelir, gider, net: gelir - gider });
    
    setUpcoming(data.filter(r => r.status === "Bekliyor").slice(0, 10));
  }, [data]);

  // Filtered data for table and export
  const filteredData = data.filter(r => 
    (r.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.category || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.document_no || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    const allowedRoles = ["super_admin", "admin", "muhasebe_muduru"];
    if (profile?.role && !allowedRoles.includes(profile.role)) {
      setToastMsg({ message: "Rapor almak için yetkiniz bulunmuyor.", type: "error" });
      return;
    }

    console.log("📊 TABLE DATA (filteredData):", filteredData);

    if (!filteredData || filteredData.length === 0) {
      setToastMsg({ message: "Raporlanacak kayıt bulunamadı.", type: "warning" });
      return;
    }

    setIsExporting(true);
    try {
      // 1. Prepare Export Rows with explicit mapping
      const exportRows = filteredData.map(item => ({
        "Tarih": item.date || item.transaction_date ? format(new Date(item.date || item.transaction_date), "dd.MM.yyyy") : "-",
        "Şirket": item.company_name || (item.company_id ? companies.find(c => c.id === item.company_id)?.company_name : "ORTAK / GENEL") || "-",
        "İşlem Tipi": (item.type || "").toUpperCase(),
        "İşlem Detayı": item.description || item.title || "-",
        "Kategori": item.category || item.category_name || "-",
        "Platform": item.platforms?.name || item.platform_name || item.sub_platform || "-",
        "Kaynak / Banka": item.bank_name || (item.banka_id ? "BANKA HESABI" : (item.payment_method || "-")),
        "İşlem Yöntemi": item.payment_method || "-",
        "Tutar": Number(item.amount || 0),
        "Para Birimi": item.currency || "TL",
        "Durum": item.status || "-",
        "Oluşturan": item.profiles?.full_name || item.created_by_name || "Sistem",
        "Kayıt Tarihi": item.created_at ? format(new Date(item.created_at), "dd.MM.yyyy HH:mm") : "-"
      }));

      console.log("📊 EXPORT ROWS (mapped):", exportRows);

      // 2. Construct Workbook
      const workbook = XLSX.utils.book_new();
      
      // Create summary data as first few rows
      const summaryData = [
        ["FİNANS YÖNETİM RAPORU"],
        ["Tarih Aralığı:", dateFilter.label],
        ["Şirket:", localCompanyFilter === "all" ? "Tümü" : (companies.find(c => c.id === localCompanyFilter)?.company_name || "Seçili")],
        ["Toplam Kayıt:", filteredData.length],
        ["Toplam Gelir:", stats.gelir],
        ["Toplam Gider:", stats.gider],
        ["Net Durum:", stats.net],
        [], // Empty row
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(summaryData);
      
      // Add the table data starting from A9
      XLSX.utils.sheet_add_json(worksheet, exportRows, { origin: "A9" });

      // Auto-size columns
      const maxWidths = Object.keys(exportRows[0] || {}).map(key => 
        Math.max(key.length, ...exportRows.map(row => String((row as any)[key]).length))
      );
      worksheet["!cols"] = maxWidths.map(w => ({ wch: w + 5 }));

      XLSX.utils.book_append_sheet(workbook, worksheet, "Finans Raporu");

      const fileName = `finans-raporu-${format(new Date(), "yyyy-MM-dd")}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      setToastMsg({ message: "Rapor başarıyla oluşturuldu.", type: "success" });
    } catch (err: any) {
      console.error("❌ Export error full details:", err);
      setToastMsg({ message: `Rapor oluşturulurken bir hata oluştu.`, type: "error" });
    } finally {
      setIsExporting(false);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = dateFilter.startDate.toISOString();
      const endDate = dateFilter.endDate.toISOString();

      let query = supabase.from("finance_records").select("*, profiles:created_by(full_name), platforms(name)");
      
      // Date Range Filter
      query = query.gte("date", startDate).lte("date", endDate);

      if (typeFilter !== "all") query = query.eq("type", typeFilter);
      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      if (specificCategory !== "all") query = query.eq("category", specificCategory);
      if (paymentMethodFilter !== "all") query = query.eq("payment_method", paymentMethodFilter);
      
      
      if (localCompanyFilter === "COMMON") {
        query = query.is("company_id", null);
      } else if (localCompanyFilter !== "all") {
        query = query.eq("company_id", localCompanyFilter);
      } else if (selectedCompanyId && selectedCompanyId !== "ALL") {
        query = query.or(`company_id.eq.${selectedCompanyId},company_id.is.null`);
      }

      const { data: records, error } = await query.order("date", { ascending: false });
      
      if (error) {
         console.error("Finance fetch error:", {
           message: error.message,
           details: error.details,
           code: error.code,
           raw: String(error)
         });
      } else if (records) {
        setData(records);
      }
    } catch (err: any) {
       console.error("Finance fetch exception:", err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, specificCategory, paymentMethodFilter, selectedCompanyId, dateFilter]);

  useEffect(() => {
    if (authLoading || companyLoading) return;

    if (profile && profile.role === "operasyon") {
      router.push("/");
      return;
    }

    fetchData();
  }, [profile, router, authLoading, companyLoading, fetchData]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    const allowedRoles = ["super_admin", "admin", "finans", "muhasebe_muduru", "muhasebe_personeli"];
    if (profile?.role && !allowedRoles.includes(profile.role)) {
      setToastMsg({ message: "Bu işlem için yetkiniz bulunmuyor.", type: "error" });
      return;
    }
    
    setStatusModalItem(null);
    setUpdatingStatus(id);
    
    try {
      console.log(`🔄 Updating status for record ${id} to ${newStatus}`);
      const { error } = await supabase
        .from("finance_records")
        .update({ status: newStatus })
        .eq("id", id);
        
      if (error) {
        console.error("📊 STATUS UPDATE ERROR:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      // Update local data array (Optimistic update)
      setData(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
      setUpcoming(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
      
      setToastMsg({ message: "Durum başarıyla güncellendi.", type: "success" });
    } catch (err: any) {
      console.error("❌ Durum güncelleme hatası:", err);
      setToastMsg({ message: `Güncelleme başarısız: ${err.message || "Bilinmeyen bir hata oluştu"}`, type: "error" });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleCopy = (item: any) => {
    setCopyingTransaction(item);
    setIsAddModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: "Kaydı Sil?",
      description: "Bu finans kaydı kalıcı olarak silinecek. Bu işlem geri alınamaz ve banka bakiyelerini etkileyebilir.",
      variant: "danger",
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        setLoading(true);
        try {
          const { error } = await supabase
            .from("finance_records")
            .delete()
            .eq("id", id);
            
          if (error) throw error;
          
          setToastMsg({ message: "Kayıt başarıyla silindi.", type: "success" });
          fetchData();
        } catch (err: any) {
          console.error("Silme hatası:", err);
          setToastMsg({ message: `Silme başarısız: ${err.message}`, type: "error" });
        } finally {
          setLoading(false);
        }
      }
    });
  };



  return (
    <div className="relative">
      {/* Custom UI Components */}
      {toastMsg && (
        <Toast 
          message={toastMsg.message} 
          type={toastMsg.type} 
          onClose={() => setToastMsg(null)} 
        />
      )}

      <ConfirmDialog 
        {...confirmConfig}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        loading={loading}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pb-6">
      <div className="lg:col-span-3 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 transition-all hover:shadow-xl hover:shadow-slate-200/40">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Finans Yönetimi</h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Gelir ve gider akışını tek bir merkezden profesyonelce kontrol edin.</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={handleExport}
              disabled={isExporting}
              className="secondary px-6 rounded-2xl disabled:opacity-50"
            >
              {isExporting ? (
                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Rapor Al
            </button>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="primary px-8 rounded-2xl shadow-lg shadow-blue-600/20"
            >
              <Plus className="w-5 h-5 mr-2" /> Yeni Kayıt Ekle
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 border-l-[6px] border-green-600 relative overflow-hidden group">
            <div className="relative z-10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{dateFilter.label} TOPLAM GELİR</p>
                <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black text-green-600 font-mono tracking-tight">{formatCurrency(stats.gelir)}</h3>
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                </div>
            </div>
            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-green-50/30 rounded-full blur-2xl group-hover:bg-green-100/40 transition-colors" />
          </div>

          <div className="glass-card p-6 border-l-[6px] border-red-600 relative overflow-hidden group">
            <div className="relative z-10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{dateFilter.label} TOPLAM GİDER</p>
                <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black text-red-600 font-mono tracking-tight">{formatCurrency(stats.gider)}</h3>
                    <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                        <TrendingDown className="w-5 h-5" />
                    </div>
                </div>
            </div>
            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-red-50/30 rounded-full blur-2xl group-hover:bg-red-100/40 transition-colors" />
          </div>

          <div 
            onClick={() => document.getElementById('advanced-date-picker')?.scrollIntoView({ behavior: 'smooth' })}
            className="glass-card p-6 border-l-[6px] border-blue-600 relative overflow-hidden group cursor-pointer active:scale-95 transition-all"
          >
            <div className="relative z-10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{dateFilter.label} NET DURUM</p>
                <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black text-blue-600 font-mono tracking-tight">{formatCurrency(stats.net)}</h3>
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                        <Wallet className="w-5 h-5" />
                    </div>
                </div>
            </div>
            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-blue-50/30 rounded-full blur-2xl group-hover:bg-blue-100/40 transition-colors" />
          </div>
        </div>

        {/* Filters Panel */}
        <div className="glass-card p-6 bg-slate-900 border-none shadow-2xl shadow-slate-900/20 !overflow-visible relative z-[100]">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-2 text-slate-400">
            <Filter className="w-3.5 h-3.5 text-blue-500" /> AKILLI FİLTRELEME
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 items-end">
            <div id="advanced-date-picker" className="col-span-1 sm:col-span-2">
              <FormField label="Tarih / Dönem Filtresi">
                <AdvancedDatePicker 
                  initialRange={dateFilter}
                  onApply={(range) => setDateFilter(range)}
                />
              </FormField>
            </div>
            <FormField label="Şirket / Ortak">
              <Select 
                className="bg-slate-800 border-slate-700 text-white focus:bg-slate-700 rounded-xl"
                value={localCompanyFilter}
                onChange={(e) => setLocalCompanyFilter(e.target.value)}
              >
                <option value="all">Hepsi</option>
                <option value="COMMON">🏛️ Ortak Kayıtlar</option>
                {(companies || []).map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
              </Select>
            </FormField>
            <FormField label="Kayıt Tipi">
              <Select 
                className="bg-slate-800 border-slate-700 text-white focus:bg-slate-700 transition-all rounded-xl"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
              >
                <option value="all">Tüm İşlemler</option>
                <option value="gelir">Sadece Gelirler</option>
                <option value="gider">Sadece Giderler</option>
              </Select>
            </FormField>
            
            <FormField label="Kaynak Tipi">
              <Select className="bg-slate-800 border-slate-700 text-white focus:bg-slate-700 rounded-xl">
                <option value="all">Farketmez</option>
                <option value="eticaret">E-Ticaret</option>
                <option value="toptan">Toptan Satış</option>
              </Select>
            </FormField>

            <FormField label="Kategori">
              <Select 
                className="bg-slate-800 border-slate-700 text-white focus:bg-slate-700 rounded-xl"
                value={specificCategory}
                onChange={(e) => setSpecificCategory(e.target.value)}
              >
                <option value="all">Hepsi</option>
                {["B2B Satış", "E-Ticaret", "Hammadde", "Personel", "Kira", "Reklam", "Kargo", "Vergi", "Genel"].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </FormField>

            <FormField label="Durum">
              <Select 
                className="bg-slate-800 border-slate-700 text-white focus:bg-slate-700 rounded-xl"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tümü</option>
                <option value="Tahsil Edildi">Tahsilat Tamam</option>
                <option value="Ödendi">Ödeme Tamam</option>
                <option value="Bekliyor">İşlem Bekliyor</option>
                <option value="İptal Edildi">İptal Edilenler</option>
              </Select>
            </FormField>

            <FormField label="İşlem Yöntemi">
              <Select 
                className="bg-slate-800 border-slate-700 text-white focus:bg-slate-700 rounded-xl"
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
              >
                <option value="all">Tümü</option>
                <option value="NAKIT">Nakit</option>
                <option value="BANKA">Havale / EFT</option>
                <option value="KREDI_KARTI">Kredi Kartı</option>
                <option value="CEK_SENET">Çek / Senet</option>
                <option value="ORTAK_CARI">Ortak Cari</option>
              </Select>
            </FormField>

            <FormField label="Hızlı Arama">
              <Input 
                placeholder="Açıklama veya Belge..." 
                icon={<Search className="w-4 h-4" />}
                className="bg-slate-800 border-slate-700 text-white focus:bg-slate-700 placeholder:text-slate-500 rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </FormField>
          </div>
        </div>

        {/* Integrated Management Table */}
        <div className="glass-card overflow-hidden relative z-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/80">
                  <th className="table-header !py-3 !px-4 w-12 !pr-0">Tip</th>
                  <th className="table-header !py-3 !px-4">İşlem Detayı</th>
                  <th className="table-header !py-3 !px-4 hidden md:table-cell">Kategori</th>
                  <th className="table-header !py-3 !px-4 hidden lg:table-cell">Kaynak / Belge</th>
                  <th className="table-header !py-3 !px-4 text-right whitespace-nowrap">Tutar</th>
                  <th className="table-header !py-3 !px-4 text-center whitespace-nowrap">Durum</th>
                  <th className="table-header !py-3 !px-4 text-right w-28">İŞLEM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kayıtlar Yükleniyor...</p>
                    </div>
                  </td></tr>
                ) : filteredData.length > 0 ? filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/20 transition-all group border-b border-slate-100 last:border-0">
                    <td className="table-cell !py-3 !px-4 !pr-0">
                      {item.type === "gelir" ? (
                        <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center text-green-600 shadow-sm border border-green-100 group-hover:scale-105 transition-transform">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center text-red-600 shadow-sm border border-red-100 group-hover:scale-105 transition-transform">
                          <TrendingDown className="w-4 h-4" />
                        </div>
                      )}
                    </td>
                    <td className="table-cell !py-3 !px-4">
                      <div className="flex flex-col min-w-0">
                        <p className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors truncate text-sm">{item.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-tight">
                            {new Date(item.date).toLocaleDateString("tr-TR", { day: 'numeric', month: 'short' })}
                          </p>
                          <span className="w-1 h-1 rounded-full bg-slate-200" />
                          <p className="text-[8px] font-bold text-blue-500/70 uppercase tracking-tighter italic">
                            {item.profiles?.full_name || "Sistem"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell !py-3 !px-4 hidden md:table-cell">
                      <div className="flex flex-col items-start gap-1">
                        {item.category === "E-Ticaret" && (item.platforms?.name || item.sub_platform) && (
                          <span className="text-[7px] font-black text-blue-500 uppercase tracking-tighter leading-none mb-0.5">
                            {item.platforms?.name || item.sub_platform}
                          </span>
                        )}
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 rounded-lg border border-slate-100">
                          <Tag className="w-2 h-2 text-slate-400" />
                          <span className="text-[8px] font-black text-slate-600 uppercase tracking-tight">{item.category}</span>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell !py-3 !px-4 hidden lg:table-cell">
                      <div className="flex flex-col items-start gap-0.5">
                        <div className="flex items-center gap-1 text-slate-500">
                            {item.company_id ? (
                                <Building2 className="w-2 h-2 text-slate-300" />
                            ) : (
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                            <span className={cn(
                                "text-[8px] font-black uppercase tracking-tight truncate max-w-[70px]",
                                !item.company_id ? "text-blue-500" : "text-slate-500"
                            )}>
                                {item.company_id ? (companies || []).find(c => c.id === item.company_id)?.company_name || "Şirket" : "ORTAK"}
                            </span>
                        </div>
                        <span className="text-[7px] font-bold font-mono text-slate-400 bg-slate-100 px-1 py-0 rounded italic">#{item.document_no || "KAYITSIZ"}</span>
                      </div>
                    </td>
                    <td className="table-cell !py-3 !px-4 text-right">
                      <p className={cn(
                        "text-sm font-black font-mono tracking-tighter italic",
                        item.type === "gelir" ? "text-green-600" : "text-red-600"
                      )}>
                        {item.type === "gelir" ? "+" : "-"}{formatCurrency(item.amount, item.currency)}
                      </p>
                    </td>
                    <td className="table-cell !py-3 !px-4 text-center relative">
                      <div 
                        className="flex justify-center cursor-pointer group"
                        onClick={() => {
                          const allowedRoles = ["super_admin", "admin", "finans", "muhasebe_muduru", "muhasebe_personeli"];
                          if (profile?.role && allowedRoles.includes(profile.role)) {
                            setStatusModalItem(item);
                          }
                        }}
                      >
                        <Badge 
                          variant={statusVariants[item.status] || "default"} 
                          className={cn(
                            "flex items-center gap-1.5 px-2 py-1 transition-all outline outline-2 outline-transparent",
                            updatingStatus === item.id ? "opacity-50" : "group-hover:outline-blue-500/20 group-hover:shadow-sm"
                          )}
                        >
                          {updatingStatus === item.id ? (
                            <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            statusIcons[item.status] || <Clock className="w-3 h-3" />
                          )}
                          <span className="text-[9px] uppercase font-black tracking-tighter">{item.status}</span>
                          {profile?.role && ["super_admin", "admin", "finans", "muhasebe_muduru", "muhasebe_personeli"].includes(profile.role) && (
                            <ChevronDown className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity ml-1" />
                          )}
                        </Badge>
                      </div>
                    </td>
                    <td className="table-cell !py-3 !px-4 text-right">
                      <div className="flex justify-end items-center gap-0.5">
                        {profile?.role && ["super_admin", "admin", "finans", "muhasebe_muduru"].includes(profile.role) && (
                          <>
                            <button 
                              onClick={() => setEditingTransaction(item)}
                              className="p-1 text-slate-400 hover:text-blue-600 transition-all rounded-lg hover:bg-blue-50"
                              title="Düzenle"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleCopy(item)}
                              className="p-1 text-slate-400 hover:text-green-600 transition-all rounded-lg hover:bg-green-50"
                              title="Kopyala"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDelete(item.id)}
                              className="p-1 text-slate-400 hover:text-red-600 transition-all rounded-lg hover:bg-red-50"
                              title="Sil"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                    <tr><td colSpan={7} className="text-center py-16 text-slate-400 italic text-sm">Aranan kriterlere uygun kayıt bulunamadı.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sidebar: Upcoming & Insights */}
      <div className="space-y-8">
        {/* Upcoming Panel */}
        <div className="glass-card flex flex-col p-6 !gap-0">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 border-b border-slate-100 pb-3">Bekleyen İşlemler</h3>
          <div className="space-y-2 mt-2">
            {upcoming.length > 0 ? upcoming.map(r => (
              <div 
                key={r.id} 
                onClick={() => setEditingTransaction(r)}
                className="p-4 rounded-2xl hover:bg-slate-50 transition-all group cursor-pointer border border-transparent hover:border-slate-100"
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-black text-slate-800 leading-tight group-hover:text-blue-600 transition-colors uppercase italic">{r.description}</p>
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    r.type === 'gelir' ? "bg-green-500" : "bg-red-500"
                  )} />
                </div>
                <div className="flex justify-between items-end">
                  <p className={cn(
                      "text-xs font-black font-mono italic",
                      r.type === 'gelir' ? "text-green-600" : "text-red-600"
                  )}>{r.type === 'gelir' ? "+" : "-"}{formatCurrency(r.amount, r.currency)}</p>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter opacity-70 italic">
                      {new Date(r.date).toLocaleDateString("tr-TR")} • {new Date(r.created_at).toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                      {r.profiles?.full_name || "Sistem"}
                    </p>
                  </div>
                </div>
              </div>
            )) : (
                <p className="text-xs text-slate-400 italic text-center py-8">Bekleyen işlem bulunmuyor.</p>
            )}
          </div>
        </div>

        {/* Insight Card */}
        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-slate-900/40">
          <div className="relative z-10">
            <h4 className="font-black text-xl mb-3 tracking-tight italic">Nakit Akış Analizi</h4>
            <p className="text-slate-400 text-xs leading-relaxed mb-8">
              Geçen aya oranla giderlerinizde <span className="text-green-400 font-black italic">%8 tasarruf</span> görüyoruz. Tebrikler!
            </p>
            <button className="w-full bg-blue-600 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:scale-105 transition-transform active:scale-95">
              DETAYLI ANALİZE GİT
            </button>
          </div>
          <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-blue-600 opacity-20 transform -rotate-12 blur-xl rounded-full" />
        </div>
      </div>

      {/* Modals */}
      <AddTransactionModal 
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setCopyingTransaction(null);
        }}
        onSuccess={fetchData}
        initialData={copyingTransaction}
      />
      <EditTransactionModal 
        isOpen={!!editingTransaction}
        transaction={editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onSuccess={fetchData}
      />
    </div>
      <StatusUpdateModal 
        isOpen={!!statusModalItem}
        onClose={() => setStatusModalItem(null)}
        onSelect={(newStatus) => handleStatusChange(statusModalItem.id, newStatus)}
        currentStatus={statusModalItem?.status || ""}
        type={statusModalItem?.type || "gelir"}
        loading={updatingStatus === statusModalItem?.id}
      />
    </div>
  );
}
