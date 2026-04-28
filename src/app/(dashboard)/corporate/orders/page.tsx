"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useCompany } from "@/context/company-context";
import { supabase } from "@/lib/supabase";
import { 
  ShoppingBag, 
  Search, 
  Eye, 
  CheckCircle, 
  ArrowRightCircle, 
  AlertTriangle, 
  X,
  FileText,
  Upload
} from "lucide-react";
import { format } from "date-fns";

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
  design_required?: boolean;
}

export default function CorporateOrders() {
  const router = useRouter();
  const { profile } = useAuth();
  const { selectedCompanyId } = useCompany();

  const [orders, setOrders] = useState<CorporateOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [activeOrder, setActiveOrder] = useState<CorporateOrder | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("corporate_orders")
        .select("id, order_number, customer_name, customer_company, order_type, current_stage, status, responsible_role, total_amount, currency, deadline_date, created_at, design_required")
        .order("created_at", { ascending: false });

      if (selectedCompanyId && selectedCompanyId !== "ALL") {
        query = query.eq("company_id", selectedCompanyId);
      }

      const { data, error: fetchErr } = await query;

      const rawOrders = data || [];
      const userRole = profile?.role;
      const isAdmin = userRole === 'admin' || userRole === 'super_admin';

      const filteredByRole = rawOrders.filter((order: CorporateOrder) => {
        if (isAdmin) return true;
        if (userRole === 'pazarlama_muduru') return true;
        if (userRole === 'grafiker') return order.current_stage === 'grafiker';
        if (userRole === 'muhasebe_muduru') return order.current_stage === 'muhasebe';
        if (userRole === 'uretim_muduru') return order.current_stage === 'uretim';
        if (userRole === 'depo_muduru') return order.current_stage === 'depo';
        return false;
      });

      setOrders(filteredByRole);
    } catch (err: any) {
      console.error("Orders list error:", err);
      setError(err.message || "Hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCompanyId, profile]);

  const handleNextStage = async (order: CorporateOrder) => {
    if (!confirm("Siparişi bir sonraki aşamaya taşımak istediğinize emin misiniz?")) return;
    try {
      setUpdating(true);
      
      let nextStage: CorporateOrder['current_stage'] = 'tamamlandi';
      let nextRole = 'super_admin';

      switch (order.current_stage) {
        case 'pazarlama':
          nextStage = order.design_required ? 'grafiker' : 'muhasebe';
          nextRole = order.design_required ? 'grafiker' : 'muhasebe_muduru';
          break;
        case 'grafiker':
          nextStage = 'muhasebe';
          nextRole = 'muhasebe_muduru';
          break;
        case 'muhasebe':
          nextStage = 'uretim';
          nextRole = 'uretim_muduru';
          break;
        case 'uretim':
          nextStage = 'depo';
          nextRole = 'depo_muduru';
          break;
        case 'depo':
          nextStage = 'tamamlandi';
          nextRole = 'super_admin';
          break;
        default:
          break;
      }

      const { error: updErr } = await supabase
        .from("corporate_orders")
        .update({ 
          current_stage: nextStage, 
          responsible_role: nextRole,
          status: 'İşlemde'
        })
        .eq("id", order.id);

      if (updErr) throw updErr;

      // Status history entry
      await supabase
        .from("corporate_order_status_history")
        .insert([{
          order_id: order.id,
          old_status: order.status,
          new_status: 'İşlemde',
          old_stage: order.current_stage,
          new_stage: nextStage,
          note: 'Aşama ilerletildi.',
          changed_by: profile?.id
        }]);

      await fetchData();
    } catch (err: any) {
      alert("Aşama ilerletilemedi: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder || !newNote.trim()) return;
    try {
      setUpdating(true);
      const { error: noteErr } = await supabase
        .from("corporate_order_comments")
        .insert([{
          order_id: activeOrder.id,
          comment: newNote,
          created_by: profile?.id
        }]);

      if (noteErr) throw noteErr;

      setIsNoteModalOpen(false);
      setNewNote("");
      alert("Not eklendi.");
    } catch (err: any) {
      alert("Not eklenemedi: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const search = searchTerm.toLowerCase();
    return (
      order.order_number.toLowerCase().includes(search) ||
      order.customer_name.toLowerCase().includes(search) ||
      (order.customer_company && order.customer_company.toLowerCase().includes(search))
    );
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Siparişler Yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-3xl p-8 text-center max-w-xl mx-auto mt-12">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
        <h2 className="text-sm font-bold text-slate-800 mb-1">Hata Oluştu</h2>
        <p className="text-slate-500 text-xs mb-4 font-semibold">{error}</p>
        <button onClick={fetchData} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700">Tekrar Dene</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-blue-600" /> Siparişlerim
          </h1>
          <p className="text-slate-500 text-xs font-medium mt-1">Görevinize atanan kurumsal siparişleri listeleyin.</p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-4 top-3 text-slate-400" />
          <input 
            type="text" 
            placeholder="Sipariş, Müşteri Ara..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="text-xs font-bold bg-slate-50 border border-slate-100 pl-10 pr-4 py-2.5 rounded-xl w-full text-slate-700 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 text-slate-400 font-bold text-xs uppercase tracking-widest">Atanmış sipariş bulunmuyor.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
                  <th className="px-6 py-4">Sipariş No</th>
                  <th className="px-6 py-4">Müşteri</th>
                  <th className="px-6 py-4">Tür</th>
                  <th className="px-6 py-4">Aşama</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Termin</th>
                  <th className="px-6 py-4">Tutar</th>
                  <th className="px-6 py-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
                {filteredOrders.map(order => {
                  const isDelayed = order.deadline_date && new Date(order.deadline_date) < new Date() && order.current_stage !== 'tamamlandi';
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">{order.order_number}</td>
                      <td className="px-6 py-4">
                        <p className="text-slate-900 font-bold">{order.customer_name}</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{order.customer_company || '-'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-tight">
                          {order.order_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                          {order.current_stage}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                          order.status === 'Yeni' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className={`px-6 py-4 font-black ${isDelayed ? 'text-red-500 animate-pulse' : 'text-slate-700'}`}>
                        {order.deadline_date ? format(new Date(order.deadline_date), 'dd.MM.yyyy') : '-'}
                      </td>
                      <td className="px-6 py-4 font-extrabold text-slate-900">
                        {order.total_amount ? `${order.total_amount.toLocaleString('tr-TR')} ${order.currency}` : '-'}
                      </td>
                      <td className="px-6 py-4 flex justify-end gap-2 items-center h-full pt-6">
                        <button 
                          onClick={() => router.push(`/corporate/orders/${order.id}`)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Detay Görüntüle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button 
                          disabled={updating}
                          onClick={() => { setActiveOrder(order); setIsNoteModalOpen(true); }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Not Ekle"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        
                        {order.current_stage !== 'tamamlandi' && (
                          <button 
                            disabled={updating}
                            onClick={() => handleNextStage(order)}
                            className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors flex items-center gap-1"
                            title="Sonraki Aşama"
                          >
                            <ArrowRightCircle className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Note Modal */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-100 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Not Ekle</h3>
              <button onClick={() => setIsNoteModalOpen(false)} className="p-1 hover:bg-slate-50 rounded-lg"><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddNote} className="space-y-4">
              <textarea 
                required 
                value={newNote} 
                onChange={e => setNewNote(e.target.value)} 
                className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl h-24 resize-none" 
                placeholder="İlgili sipariş üzerine ek notunuz..."
              />
              <div className="flex justify-end gap-2">
                <button type="button" disabled={updating} onClick={() => setIsNoteModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-500 rounded-xl hover:bg-slate-50">Kapat</button>
                <button type="submit" disabled={updating} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-blue-700">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
