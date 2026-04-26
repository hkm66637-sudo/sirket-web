"use client";

import React, { useEffect, useState } from "react";
import { ProductionService } from "@/services/production-service";
import { useAuth } from "@/context/auth-context";
import { ShoppingCart, Search, Trash2, CheckCircle2, Clock, Truck } from "lucide-react";

export default function PurchaseRequestsPage() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let isMounted = true;
    let timer = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
        setError("Veri yükleme zaman aşımına uğradı");
      }
    }, 8000);

    const fetchData = async () => {
      try {
        setLoading(true);
        if (!profile?.company_id) {
          return;
        }
        const data = await ProductionService.getPurchaseRequests(profile.company_id);
        console.log("Page data:", data);
        if (isMounted) {
          setRequests(data || []);
        }
      } catch (error: any) {
        console.error("Page fetch error:", error);
        if (isMounted) {
          setError(error.message || "Veri alınamadı");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
        clearTimeout(timer);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [profile]);

  const loadData = async () => {
    if (!profile?.company_id) return;
    try {
      const data = await ProductionService.getPurchaseRequests(profile.company_id);
      setRequests(data || []);
    } catch (err: any) {
      console.error(err);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await ProductionService.updatePurchaseRequestStatus(id, newStatus);
      loadData();
    } catch (err: any) {
      alert("Durum güncellenemedi: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Talebi silmek istediğinize emin misiniz?")) return;
    try {
      await ProductionService.deletePurchaseRequest(id);
      loadData();
    } catch (err: any) {
      alert("Hata: " + err.message);
    }
  };

  const filtered = requests.filter(r => r.raw_materials?.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <div className="p-8 text-slate-500 font-bold animate-pulse text-center mt-20">Yükleniyor...</div>;
  if (error) return <div className="p-8 text-red-500 font-bold text-center mt-20">{error}</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-blue-600" /> Satın Alma Talepleri
          </h1>
          <p className="text-slate-500 text-xs font-medium mt-1">Stok yetersizliğinden otomatik doğan veya manuel açılan hammadde siparişleri.</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden p-6">
        <div className="relative max-w-sm mb-6">
          <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Hammadde veya Tedarikçi Ara..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4 rounded-tl-xl">Tarih</th>
                <th className="px-6 py-4">Hammadde</th>
                <th className="px-6 py-4">İstenen Miktar</th>
                <th className="px-6 py-4">Tedarikçi</th>
                <th className="px-6 py-4">Durum</th>
                <th className="px-6 py-4 text-right rounded-tr-xl">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700 text-xs font-medium">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-500">{new Date(r.created_at).toLocaleDateString("tr-TR")}</td>
                  <td className="px-6 py-4 font-black text-slate-900">{r.raw_materials?.name}</td>
                  <td className="px-6 py-4 font-bold text-blue-600">{r.quantity_needed} {r.raw_materials?.unit}</td>
                  <td className="px-6 py-4">{r.supplier_name || "-"}</td>
                  <td className="px-6 py-4">
                    <select 
                      value={r.status}
                      onChange={e => updateStatus(r.id, e.target.value)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border outline-none cursor-pointer ${
                        r.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        r.status === 'ordered' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}
                    >
                      <option value="pending">Bekliyor</option>
                      <option value="ordered">Sipariş Verildi</option>
                      <option value="received">Teslim Alındı</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 flex justify-end gap-2">
                    <button onClick={() => handleDelete(r.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-slate-400 font-semibold">Talep bulunamadı.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
