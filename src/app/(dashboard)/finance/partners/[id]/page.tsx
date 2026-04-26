"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import { 
  ArrowLeft,
  Calendar,
  Building2,
  CreditCard,
  ArrowUpCircle,
  ArrowDownCircle,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Wallet,
  Pencil,
  Trash2,
  MoreHorizontal,
  Plus
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useCompany } from "@/context/company-context";
import Badge from "@/components/ui/badge";
import PartnerTransactionModal from "@/components/finance/PartnerTransactionModal";
import Toast from "@/components/ui/Toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EditPartnerModal from "@/components/finance/EditPartnerModal";

export default function PartnerDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const { companies, selectedCompanyId } = useCompany();
  
  const [partner, setPartner] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCompany, setFilterCompany] = useState("all");

  const fetchPartnerData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Partner
      const { data: partnerData, error: partnerError } = await supabase
        .from("partners")
        .select("*")
        .eq("id", id)
        .single();
      
      if (partnerError) throw partnerError;
      setPartner(partnerData);

      // 2. Fetch Transactions
      let query = supabase
        .from("partner_transactions")
        .select(`
          *,
          banks (banka_adi, hesap_adi)
        `)
        .eq("partner_id", id)
        .order("date", { ascending: false });

      if (filterType !== "all") query = query.eq("type", filterType);
      if (filterStatus !== "all") query = query.eq("status", filterStatus);
      if (filterCompany !== "all") query = query.eq("company_id", filterCompany);

      const { data: transData, error: transError } = await query;
      if (transError) throw transError;
      setTransactions(transData || []);

    } catch (err) {
      console.error("❌ Veri yüklenemedi:", err);
      setToast({ message: "Veriler yüklenirken bir hata oluştu.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [id, filterType, filterStatus, filterCompany]);

  useEffect(() => {
    fetchPartnerData();
  }, [fetchPartnerData]);

  const handleDeleteConfirm = async () => {
    if (!deletingTransaction) return;
    setDeleteLoading(true);
    try {
      if (deletingTransaction.finance_record_id) {
        await supabase.from("finance_records").delete().eq("id", deletingTransaction.finance_record_id);
      }
      const { error } = await supabase.from("partner_transactions").delete().eq("id", deletingTransaction.id);
      if (error) throw error;

      setToast({ message: "İşlem silindi.", type: "success" });
      fetchPartnerData();
      setIsDeleteDialogOpen(false);
    } catch (err) {
      setToast({ message: "Silme hatası.", type: "error" });
    } finally {
      setDeleteLoading(false);
      setDeletingTransaction(null);
    }
  };

  const canManage = profile && ["super_admin", "admin", "muhasebe_muduru"].includes(profile.role);

  // Stats
  const totalDeposited = transactions.filter(t => t.type === "deposit").reduce((sum, t) => sum + Number(t.amount), 0);
  const totalWithdrawn = transactions.filter(t => t.type === "withdrawal").reduce((sum, t) => sum + Number(t.amount), 0);
  const openingBalance = Number(partner?.opening_balance || 0);
  const currentBalance = openingBalance + totalWithdrawn - totalDeposited;

  const filteredTransactions = transactions.filter(t => 
    (t.description || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!partner && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-12 h-12 text-slate-300" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Ortak bulunamadı.</p>
        <button onClick={() => router.back()} className="secondary px-6 py-3 rounded-xl">Geri Dön</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-400 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">{partner?.name}</h1>
              <Badge variant={currentBalance > 0 ? "warning" : currentBalance < 0 ? "info" : "default"} className="px-3 py-1">
                {currentBalance > 0 ? "Borçlu" : currentBalance < 0 ? "Alacaklı" : "Dengeli"}
              </Badge>
            </div>
            <p className="text-slate-500 text-sm font-medium">Ortak cari hesap detayları ve işlem dökümü.</p>
          </div>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          {canManage && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex-1 md:flex-none px-6 py-4 bg-slate-50 text-slate-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
            >
              <Pencil className="w-4 h-4" />
              Profili Düzenle
            </button>
          )}
          <button
            onClick={() => setIsTransactionModalOpen(true)}
            className="flex-1 md:flex-none px-6 py-4 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Yeni İşlem
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm group">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Başlangıç Bakiyesi</p>
          <h3 className="text-xl font-black text-slate-700">{formatCurrency(openingBalance)}</h3>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm group">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-blue-500">Toplam Yatırılan</p>
          <h3 className="text-xl font-black text-blue-600">+{formatCurrency(totalDeposited)}</h3>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm group">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-orange-500">Toplam Çekilen</p>
          <h3 className="text-xl font-black text-orange-600">-{formatCurrency(totalWithdrawn)}</h3>
        </div>
        <div className={cn(
          "p-6 rounded-[2rem] border shadow-sm group",
          currentBalance > 0 ? "bg-orange-50/30 border-orange-100" : currentBalance < 0 ? "bg-blue-50/30 border-blue-100" : "bg-slate-50 border-slate-100"
        )}>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Güncel Net Bakiye</p>
          <h3 className={cn(
            "text-2xl font-black tracking-tight",
            currentBalance > 0 ? "text-orange-600" : currentBalance < 0 ? "text-blue-600" : "text-slate-900"
          )}>
            {formatCurrency(Math.abs(currentBalance))}
          </h3>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <div className="relative col-span-1 md:col-span-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Açıklamalarda ara..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-transparent rounded-xl text-xs font-bold focus:bg-white focus:border-blue-200 transition-all"
            />
          </div>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-3 bg-slate-50 border-transparent rounded-xl text-xs font-bold focus:bg-white focus:border-blue-200 transition-all"
          >
            <option value="all">Tüm Tipler</option>
            <option value="deposit">Yatırılan</option>
            <option value="withdrawal">Çekilen</option>
          </select>
          <select 
            value={filterCompany} 
            onChange={(e) => setFilterCompany(e.target.value)}
            className="px-4 py-3 bg-slate-50 border-transparent rounded-xl text-xs font-bold focus:bg-white focus:border-blue-200 transition-all"
          >
            <option value="all">Tüm Şirketler</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
          </select>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 bg-slate-50 border-transparent rounded-xl text-xs font-bold focus:bg-white focus:border-blue-200 transition-all"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="Tahsil Edildi">Tahsil Edildi</option>
            <option value="Bekliyor">Bekliyor</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tarih</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Şirket</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Banka / Kaynak</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">İşlem Tipi</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Tutar</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Durum</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array(5).fill(0).map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={7} className="px-8 py-6 h-16 bg-slate-50/20" /></tr>)
              ) : filteredTransactions.length === 0 ? (
                <tr><td colSpan={7} className="px-8 py-20 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">Kayıt bulunamadı.</td></tr>
              ) : filteredTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-4">
                    <span className="text-xs font-bold text-slate-600">{new Date(t.date).toLocaleDateString("tr-TR")}</span>
                  </td>
                  <td className="px-8 py-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">
                      {companies.find(c => c.id === t.company_id)?.company_name || "GENEL"}
                    </span>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-bold text-slate-600">{t.banks?.banka_adi || "Nakit / Diğer"}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-2">
                      {t.type === "deposit" ? <ArrowUpCircle className="w-4 h-4 text-blue-500" /> : <ArrowDownCircle className="w-4 h-4 text-orange-500" />}
                      <span className={cn("text-xs font-bold", t.type === "deposit" ? "text-blue-600" : "text-orange-600")}>
                        {t.type === "deposit" ? "Yatırılan" : "Çekilen"}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <span className={cn("text-sm font-black tracking-tight", t.type === "deposit" ? "text-blue-600" : "text-orange-600")}>
                      {t.type === "deposit" ? "+" : "-"}{formatCurrency(t.amount)}
                    </span>
                  </td>
                  <td className="px-8 py-4">
                    <Badge variant={t.status === "Tahsil Edildi" ? "success" : "warning"} className="text-[9px] uppercase font-black px-2 py-0.5">
                      {t.status}
                    </Badge>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      {canManage && (
                        <>
                          <button onClick={() => { setEditingTransaction(t); setIsTransactionModalOpen(true); }} className="p-2 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600 transition-all"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => { setDeletingTransaction(t); setIsDeleteDialogOpen(true); }} className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-all"><Trash2 className="w-4 h-4" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <PartnerTransactionModal 
        isOpen={isTransactionModalOpen}
        onClose={() => { setIsTransactionModalOpen(false); setEditingTransaction(null); }}
        editTransaction={editingTransaction}
        onSuccess={fetchPartnerData}
      />
      <EditPartnerModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        partner={partner}
        onSuccess={fetchPartnerData}
      />
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="İşlemi Sil"
        description="Bu hareket kaydını silmek istediğinizden emin misiniz?"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteDialogOpen(false)}
        loading={deleteLoading}
        variant="danger"
      />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
