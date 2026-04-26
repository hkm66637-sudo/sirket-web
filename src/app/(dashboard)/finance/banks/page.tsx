"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import { 
  Building2, 
  Plus, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Wallet, 
  Calendar,
  MoreHorizontal,
  PlusCircle,
  TrendingUp,
  History
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import Badge from "@/components/ui/badge";
import { useCompany } from "@/context/company-context";
import AddBankModal from "@/components/finance/AddBankModal";
import Link from "next/link";
import { useRouter } from "next/navigation";
import EditBankModal from "@/components/finance/EditBankModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Toast from "@/components/ui/Toast";
import { Edit3, Trash2, X } from "lucide-react";

export default function BanksPage() {
  const { profile, loading: authLoading } = useAuth();
  const { companies, selectedCompanyId, loading: companyLoading } = useCompany();
  const router = useRouter();
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<any | null>(null);
  const [deletingBank, setDeletingBank] = useState<any | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // canManage is true for admin and super_admin
  const canManage = profile?.role === "admin" || profile?.role === "super_admin" || profile?.role === "muhasebe_muduru";

  const fetchBanksData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Banks
      let banksQuery = supabase.from("banks").select("*").eq("aktif_mi", true);
      if (selectedCompanyId && selectedCompanyId !== "ALL") {
        banksQuery = banksQuery.or(`company_id.eq.${selectedCompanyId},company_id.is.null`);
      }
      const { data: banksData, error: banksError } = await banksQuery;

      if (banksError) throw banksError;

      // 2. Fetch Finance Records to calculate balances
      let recordsQuery = supabase.from("finance_records").select("amount, type, banka_id, date, company_id, status");
      if (selectedCompanyId && selectedCompanyId !== "ALL") {
        recordsQuery = recordsQuery.or(`company_id.eq.${selectedCompanyId},company_id.is.null`);
      }
      const { data: recordsData, error: recordsError } = await recordsQuery;

      if (recordsError) throw recordsError;

      // 3. Process data
      const processedBanks = (banksData || []).map(bank => {
        const bankRecords = (recordsData || []).filter(r => r.banka_id === bank.id);
        
        let totalIn = 0;
        let totalOut = 0;

        bankRecords.forEach(r => {
          if (r.status === "İptal Edildi") return;
          const amt = Math.abs(Number(r.amount) || 0);
          const type = String(r.type || "").toLowerCase();

          if (type === "gelir" || type === "income" || type === "deposit") {
            totalIn += amt;
          } else if (type === "gider" || type === "expense" || type === "withdrawal" || type === "outgoing") {
            totalOut += amt;
          }
        });

        const lastTransaction = bankRecords.length > 0 
          ? bankRecords.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date 
          : null;

        return {
          ...bank,
          totalIn,
          totalOut,
          currentBalance: Number(bank.baslangic_bakiyesi || 0) + totalIn - totalOut,
          lastTransaction,
          companyName: companies.find(c => c.id === bank.company_id)?.company_name
        };
      });

      setBanks(processedBanks);
    } catch (err: any) {
      console.error("Banka verileri yüklenemedi:", {
        message: err?.message,
        details: err?.details,
        code: err?.code,
        raw: String(err)
      });
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId, companies]);

  const handleDeleteBank = async () => {
    if (!deletingBank) return;
    setLoading(true);
    try {
      // Soft delete: set aktif_mi to false
      const { error } = await supabase
        .from("banks")
        .update({ aktif_mi: false })
        .eq("id", deletingBank.id);

      if (error) throw error;

      setToastMsg({ message: "Banka hesabı başarıyla pasife alındı (silindi).", type: "success" });
      fetchBanksData();
    } catch (err: any) {
      console.error("Banka silme hatası:", err);
      setToastMsg({ message: `Silme başarısız: ${err.message}`, type: "error" });
    } finally {
      setLoading(false);
      setDeletingBank(null);
    }
  };

  useEffect(() => {
    if (authLoading || companyLoading) return;
    fetchBanksData();
  }, [fetchBanksData, authLoading, companyLoading]);

  const totalAssets = banks.reduce((sum, bank) => sum + bank.currentBalance, 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header & Total Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Banka Yönetimi</h1>
          <p className="text-slate-500 text-sm font-medium">Hesap bakiyelerinizi ve nakit hareketlerinizi gerçek zamanlı izleyin.</p>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Toplam Banka Varlığı</p>
            <h2 className="text-3xl font-black text-blue-600 font-mono tracking-tighter italic">
              {formatCurrency(totalAssets)}
            </h2>
          </div>
          {canManage && (
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="primary flex items-center gap-2 px-6 py-4 shadow-xl shadow-blue-600/20"
            >
              <PlusCircle className="w-5 h-5" /> Yeni Banka Tanımla
            </button>
          )}
        </div>
      </div>

      {/* Banks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="glass-card h-[280px] animate-pulse bg-slate-100" />
          ))
        ) : banks.map(bank => (
          <Link 
            key={bank.id} 
            href={`/finance/banks/${bank.id}`}
            className="glass-card group overflow-hidden relative border-t-4 border-blue-500 hover:shadow-2xl hover:shadow-blue-600/10 transition-all duration-500 cursor-pointer block"
          >
            <div className="p-8">
              <div className="flex justify-between items-start mb-8">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm transition-all group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white">
                  <Building2 className="w-7 h-7 text-blue-600 group-hover:text-white" />
                </div>
                {canManage && (
                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === bank.id ? null : bank.id);
                      }}
                      className={cn(
                        "p-2 rounded-xl transition-all relative z-20",
                        activeMenuId === bank.id ? "bg-slate-900 text-white" : "text-slate-300 hover:text-slate-900 hover:bg-slate-50"
                      )}
                    >
                      {activeMenuId === bank.id ? <X className="w-5 h-5" /> : <MoreHorizontal className="w-5 h-5" />}
                    </button>
                    
                    {activeMenuId === bank.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-[30] animate-in slide-in-from-top-2 duration-200">
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setEditingBank(bank);
                            setActiveMenuId(null);
                          }}
                          className="w-full px-4 py-2 text-left text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Düzenle
                        </button>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDeletingBank(bank);
                            setActiveMenuId(null);
                          }}
                          className="w-full px-4 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Sil
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mb-8">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-none">{bank.banka_adi}</h3>
                  {selectedCompanyId === "ALL" && (
                    <span className="text-[8px] font-black bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                      {bank.companyName}
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">{bank.hesap_adi}</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Güncel Bakiye</p>
                    <h4 className="text-2xl font-black text-slate-900 font-mono tracking-tighter">
                      {formatCurrency(bank.currentBalance)}
                    </h4>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Başlangıç</p>
                    <p className="text-xs font-bold text-slate-500 font-mono">{formatCurrency(bank.baslangic_bakiyesi)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-green-500 uppercase tracking-widest flex items-center gap-1 mb-1">
                      <ArrowUpCircle className="w-2.5 h-2.5" /> Toplam Giriş
                    </span>
                    <span className="text-xs font-black text-slate-700 font-mono">+{formatCurrency(bank.totalIn)}</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[9px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1 justify-end mb-1">
                      <ArrowDownCircle className="w-2.5 h-2.5" /> Toplam Çıkış
                    </span>
                    <span className="text-xs font-black text-slate-700 font-mono">-{formatCurrency(bank.totalOut)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer with last transaction date */}
            <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                <History className="w-3 h-3" />
                {bank.lastTransaction 
                  ? `Son Hareket: ${new Date(bank.lastTransaction).toLocaleDateString("tr-TR")}` 
                  : "Hareket Yok"}
              </div>
              <Badge variant="success" className="bg-green-100 text-green-600 border-green-200">AKTİF</Badge>
            </div>

            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-600/5 rounded-full blur-2xl group-hover:bg-blue-600/10 transition-colors" />
          </Link>
        ))}

        {/* Add New Bank Placeholder */}
        {!loading && canManage && (
          <div 
            onClick={() => setIsAddModalOpen(true)}
            className="border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center p-8 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer group min-h-[350px]"
          >
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:scale-110 shadow-lg group-hover:shadow-blue-600/20 mb-4">
              <Plus className="w-8 h-8" />
            </div>
            <p className="text-sm font-black text-slate-400 group-hover:text-blue-600 uppercase tracking-widest transition-colors">Banka Ekle</p>
          </div>
        )}
      </div>

      <AddBankModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchBanksData}
      />

      <EditBankModal 
        isOpen={!!editingBank}
        bank={editingBank}
        onClose={() => setEditingBank(null)}
        onSuccess={fetchBanksData}
      />

      <ConfirmDialog 
        isOpen={!!deletingBank}
        title="Banka Hesabını Sil?"
        description={`"${deletingBank?.banka_adi} - ${deletingBank?.hesap_adi}" hesabı pasife alınacak. Bu bankaya bağlı eski kayıtlar korunmaya devam eder.`}
        variant="danger"
        confirmText="Evet, Pasife Al"
        onConfirm={handleDeleteBank}
        onCancel={() => setDeletingBank(null)}
        loading={loading}
      />

      {toastMsg && (
        <Toast 
          message={toastMsg.message}
          type={toastMsg.type}
          onClose={() => setToastMsg(null)}
        />
      )}
    </div>
  );
}
