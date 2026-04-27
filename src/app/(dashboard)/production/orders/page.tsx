"use client";

import React, { useEffect, useState } from "react";
import { ProductionService, ProductionOrder, Product, Machine } from "@/services/production-service";
import { useAuth } from "@/context/auth-context";
import { Clock, Factory, ShieldAlert, CheckCircle, PlusCircle } from "lucide-react";

export default function ProductionOrdersPage() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderNo, setOrderNo] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [targetDate, setTargetDate] = useState("");
  const [priority, setPriority] = useState<'normal' | 'acil' | 'cok_acil'>("normal");
  const [selectedMachine, setSelectedMachine] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    let isMounted = true;
    let timer = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
        setError("Veri yükleme zaman aşımına uğradı");
      }
    }, 12000);

    const fetchData = async () => {
      try {
        setLoading(true);
        if (!profile?.company_id) {
          return;
        }
        const [o, p, m] = await Promise.all([
          ProductionService.getOrders(profile.company_id),
          ProductionService.getProducts(profile.company_id),
          ProductionService.getMachines(profile.company_id),
        ]);
        console.log("Orders page data:", { o, p, m });
        if (isMounted) {
          setOrders(o || []);
          setProducts(p || []);
          setMachines(m || []);
        }
      } catch (err: any) {
        console.error("Orders page fetch error:", err);
        if (isMounted) {
          setError(err.message || "İş emirleri yüklenemedi");
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
      const [o, p, m] = await Promise.all([
        ProductionService.getOrders(profile.company_id),
        ProductionService.getProducts(profile.company_id),
        ProductionService.getMachines(profile.company_id),
      ]);
      setOrders(o || []);
      setProducts(p || []);
      setMachines(m || []);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return;
    setActionError("");
    try {
      await ProductionService.createOrder({
        company_id: profile.company_id,
        order_no: orderNo,
        customer_name: customerName,
        product_id: selectedProduct,
        quantity,
        target_date: targetDate,
        priority,
        machine_id: selectedMachine || undefined,
        status: "bekliyor"
      });
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setActionError(err.message || "İş emri oluşturulamadı.");
    }
  };

  const handleTakeToProduction = async (id: string) => {
    if (!profile?.company_id) return;
    setActionError("");
    try {
      await ProductionService.takeToProduction(id, profile.company_id);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleFinalizeProduction = async (id: string) => {
    if (!profile?.company_id) return;
    setActionError("");
    try {
      await ProductionService.finalizeProduction(id, profile.company_id);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      bekliyor: "bg-slate-100 text-slate-700",
      üretime_alındı: "bg-blue-100 text-blue-700",
      üretimde: "bg-indigo-100 text-indigo-700",
      tamamlandı: "bg-green-100 text-green-700",
      muhasebe_onayı: "bg-amber-100 text-amber-700",
      sevkiyata_hazır: "bg-teal-100 text-teal-700",
      sevk_edildi: "bg-emerald-100 text-emerald-700"
    };
    return map[status] || "bg-slate-100 text-slate-600";
  };

  if (loading) return <div className="p-8 text-slate-500 font-bold">Yükleniyor...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-600" /> Üretim Siparişleri & İş Emirleri
          </h1>
          <p className="text-slate-500 text-xs font-medium mt-1">Süreçleri başlatın, stok ayırın ve üretimi takip edin.</p>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-colors"
        >
          <PlusCircle className="w-4 h-4" /> Yeni Sipariş / İş Emri
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Sipariş No</th>
                <th className="px-6 py-4">Müşteri</th>
                <th className="px-6 py-4">Ürün</th>
                <th className="px-6 py-4">Miktar</th>
                <th className="px-6 py-4">Termin</th>
                <th className="px-6 py-4">Öncelik</th>
                <th className="px-6 py-4">Durum</th>
                <th className="px-6 py-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700 text-xs font-medium">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">{o.order_no}</td>
                  <td className="px-6 py-4">{o.customer_name}</td>
                  <td className="px-6 py-4 font-semibold">{(o as any).products?.name}</td>
                  <td className="px-6 py-4">{o.quantity}</td>
                  <td className="px-6 py-4 text-slate-500">{o.target_date}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      o.priority === 'cok_acil' ? 'bg-red-100 text-red-600' : 
                      o.priority === 'acil' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {o.priority.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-widest ${getStatusBadge(o.status)}`}>
                      {o.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    {o.status === "bekliyor" && (
                      <button 
                        onClick={() => handleTakeToProduction(o.id)}
                        className="bg-blue-600 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg shadow-sm hover:bg-blue-700"
                      >
                        Üretime Al
                      </button>
                    )}
                    {o.status === "üretime_alındı" && (
                      <button 
                        onClick={() => handleFinalizeProduction(o.id)}
                        className="bg-green-600 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg shadow-sm hover:bg-green-700"
                      >
                        Üretimi Bitir
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 font-semibold">Kayıtlı iş emri bulunamadı.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 max-w-lg w-full mx-4 border border-slate-100 shadow-2xl relative animate-in zoom-in-95">
            <h2 className="text-xl font-extrabold text-slate-900 mb-6">Yeni Üretim Siparişi</h2>
            {actionError && <p className="bg-red-50 text-red-600 p-3 text-xs font-bold rounded-xl mb-4">{actionError}</p>}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">SİPARİŞ NO</label>
                  <input type="text" value={orderNo} onChange={(e) => setOrderNo(e.target.value)} required className="w-full text-xs font-semibold px-4 py-3 border border-slate-200 rounded-xl focus:border-blue-500" placeholder="Örn: ORD-102" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">MÜŞTERİ ADI</label>
                  <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required className="w-full text-xs font-semibold px-4 py-3 border border-slate-200 rounded-xl focus:border-blue-500" placeholder="Örn: X Pazarlama" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">ÜRETİLECEK ÜRÜN</label>
                <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} required className="w-full text-xs font-semibold px-4 py-3 border border-slate-200 rounded-xl focus:border-blue-500">
                  <option value="">Seçiniz</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">MİKTAR</label>
                  <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value))} required className="w-full text-xs font-semibold px-4 py-3 border border-slate-200 rounded-xl focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">TERMİN TARİHİ</label>
                  <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} required className="w-full text-xs font-semibold px-4 py-3 border border-slate-200 rounded-xl focus:border-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">ÖNCELİK</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value as any)} className="w-full text-xs font-semibold px-4 py-3 border border-slate-200 rounded-xl focus:border-blue-500">
                    <option value="normal">Normal</option>
                    <option value="acil">Acil</option>
                    <option value="cok_acil">Çok Acil</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">MAKİNE TERCİHİ</label>
                  <select value={selectedMachine} onChange={(e) => setSelectedMachine(e.target.value)} className="w-full text-xs font-semibold px-4 py-3 border border-slate-200 rounded-xl focus:border-blue-500">
                    <option value="">Otomatik</option>
                    {machines.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.code})</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50">İptal</button>
                <button type="submit" className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-lg shadow-blue-600/30">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
