"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import { 
  Plus, 
  Users, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Wallet,
  TrendingUp,
  TrendingDown,
  Building2,
  Calendar,
  MoreHorizontal,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  CreditCard,
  Pencil,
  Trash2,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { cn, formatCurrency } from "@/lib/utils";
import { useCompany } from "@/context/company-context";
import Badge from "@/components/ui/badge";
import PartnerTransactionModal from "@/components/finance/PartnerTransactionModal";
import Toast from "@/components/ui/Toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function PartnerAccountsPage() {
  const { profile } = useAuth();
  const { selectedCompanyId, companies } = useCompany();
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchPartners = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .order("name", { ascending: true });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Client-side Tekilleştirme: Aynı isimli kayıt varsa sadece ilkini al
        const uniquePartners = data.filter((p, index, self) => 
          index === self.findIndex((t) => t.name === p.name)
        );
        setPartners(uniquePartners);
      } else {
        // Eğer ortak yoksa belirtilen isimleri ekle (upsert ile çakışmayı önle)
        const names = ["Enis Uğuz", "Büşra Uğuz", "Hakim Uğuz"];
        const { data: newPartners } = await supabase
          .from("partners")
          .upsert(names.map(name => ({ name })), { onConflict: 'name' })
          .select();
        
        const uniqueNew = (newPartners || []).filter((p, index, self) => 
          index === self.findIndex((t) => t.name === p.name)
        );
        setPartners(uniqueNew);
      }
    } catch (err) {
      console.error("❌ Ortaklar yüklenemedi:", err);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("partner_transactions")
        .select(`
          *,
          partners (name),
          banks (banka_adi, hesap_adi)
        `)
        .order("date", { ascending: false });

      if (selectedCompanyId && selectedCompanyId !== "ALL") {
        query = query.eq("company_id", selectedCompanyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error("❌ Hareketler yüklenemedi:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    fetchPartners();
    fetchTransactions();
  }, [fetchPartners, fetchTransactions]);

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (transaction: any) => {
    setDeletingTransaction(transaction);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTransaction) return;
    setDeleteLoading(true);
    try {
      // 1. Önce finance_record'u sil (varsa)
      if (deletingTransaction.finance_record_id) {
        const { error: fError } = await supabase
          .from("finance_records")
          .delete()
          .eq("id", deletingTransaction.finance_record_id);
        if (fError) throw fError;
      }

      // 2. partner_transaction'ı sil
      const { error: pError } = await supabase
        .from("partner_transactions")
        .delete()
        .eq("id", deletingTransaction.id);
      
      if (pError) throw pError;

      setToast({ message: "İşlem başarıyla silindi!", type: "success" });
      fetchTransactions();
      setIsDeleteDialogOpen(false);
    } catch (err: any) {
      console.error("❌ Silme hatası:", err);
      setToast({ message: "İşlem silinemedi: " + (err.message || "Bilinmeyen hata"), type: "error" });
    } finally {
      setDeleteLoading(false);
      setDeletingTransaction(null);
    }
  };

  const canManage = profile && ["super_admin", "admin", "muhasebe_muduru"].includes(profile.role);

  // Hesaplamalar
  const partnerBalances = partners.map(partner => {
    const pTrans = transactions.filter(t => t.partner_id === partner.id);
    const totalDeposited = pTrans.filter(t => t.type === "deposit").reduce((sum, t) => sum + Number(t.amount), 0);
    const totalWithdrawn = pTrans.filter(t => t.type === "withdrawal").reduce((sum, t) => sum + Number(t.amount), 0);
    
    // Bakiye mantığı:
    // Opening Balance + withdrawal (şirketten aldı) - deposit (şirkete verdi)
    const openingBalance = Number(partner.opening_balance || 0);
    const balance = openingBalance + totalWithdrawn - totalDeposited;
    
    return {
      ...partner,
      openingBalance,
      deposited: totalDeposited,
      withdrawn: totalWithdrawn,
      balance: balance
    };
  });

  const totalReceivable = partnerBalances.reduce((sum, p) => sum + (p.balance > 0 ? p.balance : 0), 0);
  const totalPayable = partnerBalances.reduce((sum, p) => sum + (p.balance < 0 ? Math.abs(p.balance) : 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Ortak Cari Hesapları</h1>
          </div>
          <p className="text-slate-500 text-sm font-medium">Şirket ortaklarının finansal hareketlerini ve cari bakiyelerini takip edin.</p>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto px-6 py-4 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Yeni İşlem Ekle
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-6 group hover:border-blue-200 transition-all duration-300">
          <div className="w-16 h-16 rounded-[1.5rem] bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Ortaklardan Alacak</p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(totalReceivable)}</h3>
            <p className="text-[10px] font-bold text-slate-400 mt-1">Şirketin ortaklardan beklediği toplam</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-6 group hover:border-orange-200 transition-all duration-300">
          <div className="w-16 h-16 rounded-[1.5rem] bg-orange-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
            <TrendingDown className="w-8 h-8 text-orange-600" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Ortaklara Borç</p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(totalPayable)}</h3>
            <p className="text-[10px] font-bold text-slate-400 mt-1">Şirketin ortaklara ödemesi gereken toplam</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-6 group hover:border-slate-200 transition-all duration-300">
          <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
            <Wallet className="w-8 h-8 text-slate-600" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Net Durum</p>
            <h3 className={cn(
              "text-2xl font-black tracking-tight",
              (totalReceivable - totalPayable) >= 0 ? "text-blue-600" : "text-orange-600"
            )}>
              {formatCurrency(totalReceivable - totalPayable)}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 mt-1">Şirket lehine / aleyhine fark</p>
          </div>
        </div>
      </div>

      {/* Partner Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {partnerBalances.map(p => (
          <Link 
            key={p.id} 
            href={`/finance/partners/${p.id}`}
            className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden group hover:border-blue-500 transition-all duration-300 cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">{p.name}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cari Hesap Özeti</p>
                </div>
                <div className={cn(
                  "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm",
                  p.balance > 0 ? "bg-blue-50 text-blue-600" : p.balance < 0 ? "bg-orange-50 text-orange-600" : "bg-slate-50 text-slate-400"
                )}>
                  {p.balance > 0 ? "Borçlu" : p.balance < 0 ? "Alacaklı" : "Dengeli"}
                </div>
              </div>
 
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-slate-400 text-xs uppercase tracking-widest font-black italic opacity-70">Başlangıç</span>
                  <span className="text-slate-600">{formatCurrency(p.openingBalance)}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-slate-400 text-xs uppercase tracking-widest font-black">Yatırılan</span>
                  <span className="text-blue-600">+{formatCurrency(p.deposited)}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-slate-400 text-xs uppercase tracking-widest font-black">Çekilen</span>
                  <span className="text-orange-600">-{formatCurrency(p.withdrawn)}</span>
                </div>
                <div className="h-px bg-slate-100 my-2" />
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-slate-900 text-xs font-black uppercase tracking-[0.2em]">Bakiye</span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase">GÜNCEL DURUM</span>
                  </div>
                  <span className={cn(
                    "text-xl font-black tracking-tight",
                    p.balance > 0 ? "text-blue-600" : p.balance < 0 ? "text-orange-600" : "text-slate-900"
                  )}>
                    {formatCurrency(Math.abs(p.balance))}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-center gap-2 text-blue-600 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                <span className="text-[10px] font-black uppercase tracking-widest">Detayları Gör</span>
                <ExternalLink className="w-3 h-3" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Son Hareketler</h2>
            <p className="text-xs font-bold text-slate-400">Ortak cari hesaplarındaki en son işlemler.</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="İşlemlerde ara..." 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border-transparent rounded-xl text-xs font-bold focus:bg-white focus:border-blue-200 transition-all"
              />
            </div>
            <button className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-400 transition-all">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tarih</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ortak</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">İşlem</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Banka</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Tutar</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Durum</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="px-8 py-6 h-16 bg-slate-50/20" />
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center">
                    <div className="max-w-xs mx-auto">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-slate-300" />
                      </div>
                      <h3 className="text-sm font-black text-slate-900 mb-1">Henüz hareket yok</h3>
                      <p className="text-xs font-bold text-slate-400">Yeni bir işlem ekleyerek başlayın.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                          <Calendar className="w-5 h-5 text-slate-400" />
                        </div>
                        <span className="text-xs font-bold text-slate-600">{new Date(t.date).toLocaleDateString("tr-TR")}</span>
                      </div>
                    </td>
                    <td className="px-8 py-3">
                      <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{t.partners?.name}</span>
                    </td>
                    <td className="px-8 py-3">
                      <div className="flex items-center gap-2">
                        {t.type === "deposit" ? (
                          <ArrowUpCircle className="w-4 h-4 text-blue-500" />
                        ) : (
                          <ArrowDownCircle className="w-4 h-4 text-orange-500" />
                        )}
                        <span className={cn(
                          "text-xs font-bold",
                          t.type === "deposit" ? "text-blue-600" : "text-orange-600"
                        )}>
                          {t.type === "deposit" ? "Yatırılan Para" : "Çekilen Para"}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5 truncate max-w-[200px]">{t.description}</p>
                    </td>
                    <td className="px-8 py-3">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                          {companies?.find(c => c.id === t.company_id)?.company_name || "GENEL"}
                        </span>
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-semibold text-slate-700">{t.banks?.banka_adi}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className={cn(
                        "text-sm font-black tracking-tight",
                        t.type === "deposit" ? "text-blue-600" : "text-orange-600"
                      )}>
                        {t.type === "deposit" ? "+" : "-"}{formatCurrency(t.amount)}
                      </span>
                    </td>
                    <td className="px-8 py-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">{t.status}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canManage && (
                          <>
                            <button 
                              onClick={() => handleEdit(t)}
                              className="p-2 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600 transition-all"
                              title="Düzenle"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteClick(t)}
                              className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-all"
                              title="Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {!canManage && (
                          <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-300 cursor-not-allowed">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PartnerTransactionModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }}
        editTransaction={editingTransaction}
        onSuccess={() => {
          fetchTransactions();
          setToast({ message: editingTransaction ? "İşlem güncellendi!" : "İşlem başarıyla kaydedildi!", type: "success" });
        }}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="İşlemi Sil"
        description="Bu hareket kaydını silmek istediğinizden emin misiniz? Bu işlem banka bakiyesini ve ortak cari toplamlarını etkileyecektir."
        confirmText="Evet, Sil"
        cancelText="Vazgeç"
        variant="danger"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
