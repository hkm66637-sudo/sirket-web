"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import { 
  ArrowLeft, 
  ShoppingBag, 
  User, 
  Package, 
  DollarSign, 
  CheckCircle2, 
  Palette, 
  Wrench, 
  Truck, 
  MessageCircle,
  Clock
} from "lucide-react";
import { format } from "date-fns";

interface OrderDetail {
  id: string;
  order_number: string;
  customer_name: string;
  customer_company?: string;
  phone?: string;
  email?: string;
  tax_office?: string;
  tax_number?: string;
  delivery_address?: string;
  invoice_address?: string;
  order_type: string;
  current_stage: string;
  status: string;
  total_amount?: number;
  currency?: string;
  deadline_date?: string;
  design_required?: boolean;
  production_required?: boolean;
  delivery_method?: string;
  customer_note?: string;
  marketing_note?: string;
  package_count?: number;
  cargo_company?: string;
  tracking_number?: string;
}

interface ItemDetail {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
}

interface Comment {
  id: string;
  comment: string;
  created_at: string;
}

interface HistoryLog {
  id: string;
  old_status?: string;
  new_status?: string;
  old_stage?: string;
  new_stage?: string;
  note?: string;
  changed_at: string;
}

export default function CorporateOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const orderId = unwrappedParams.id;

  const router = useRouter();
  const { profile } = useAuth();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [items, setItems] = useState<ItemDetail[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [history, setHistory] = useState<HistoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Action inputs
  const [newComment, setNewComment] = useState("");
  const [updating, setUpdating] = useState(false);
  const [cargoCompany, setCargoCompany] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [packageCount, setPackageCount] = useState<number>(1);

  const fetchFullDetails = async () => {
    try {
      setLoading(true);
      
      const { data: oData, error: oErr } = await supabase.from("corporate_orders").select("*").eq("id", orderId).single();
      if (oErr) throw oErr;
      setOrder(oData);

      const { data: iData } = await supabase.from("corporate_order_items").select("*").eq("order_id", orderId);
      setItems(iData || []);

      const { data: cData } = await supabase.from("corporate_order_comments").select("*").eq("order_id", orderId).order("created_at", { ascending: false });
      setComments(cData || []);

      const { data: hData } = await supabase.from("corporate_order_status_history").select("*").eq("order_id", orderId).order("changed_at", { ascending: false });
      setHistory(hData || []);

      if (oData?.cargo_company) setCargoCompany(oData.cargo_company);
      if (oData?.tracking_number) setTrackingNumber(oData.tracking_number);
      if (oData?.package_count) setPackageCount(oData.package_count);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFullDetails();
  }, [orderId]);

  const updateOrderState = async (nextStage: string, nextStatus: string, actionNote: string, extraData = {}) => {
    if (!order) return;
    try {
      setUpdating(true);
      const { error: updErr } = await supabase
        .from("corporate_orders")
        .update({ 
          current_stage: nextStage, 
          status: nextStatus,
          ...extraData 
        })
        .eq("id", order.id);

      if (updErr) throw updErr;

      await supabase
        .from("corporate_order_status_history")
        .insert([{
          order_id: order.id,
          old_status: order.status,
          new_status: nextStatus,
          old_stage: order.current_stage,
          new_stage: nextStage,
          note: actionNote,
          changed_by: profile?.id
        }]);

      // Push Notification
      let targetRole = 'pazarlama_muduru';
      if (nextStage === 'grafiker') targetRole = 'grafiker';
      if (nextStage === 'muhasebe') targetRole = 'muhasebe_muduru';
      if (nextStage === 'uretim') targetRole = 'uretim_muduru';
      if (nextStage === 'depo') targetRole = 'depo_muduru';

      await supabase
        .from("corporate_order_notifications")
        .insert([{
          title: `Yeni Görev: #${order.order_number}`,
          message: `Sipariş ${nextStage} aşamasına geçti. Durum: ${nextStatus}`,
          order_id: order.id,
          target_role: targetRole,
          is_read: false
        }]);

      await fetchFullDetails();
    } catch (err: any) {
      alert("Hata: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !order) return;
    try {
      setUpdating(true);
      await supabase.from("corporate_order_comments").insert([{ order_id: order.id, comment: newComment, created_by: profile?.id }]);
      setNewComment("");
      await fetchFullDetails();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-xs font-black text-slate-400 animate-pulse">Yükleniyor...</div>;
  if (!order) return <div className="p-12 text-center text-red-500 font-bold">Sipariş bulunamadı.</div>;

  const userRole = profile?.role;
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <button onClick={() => router.back()} className="p-2 hover:bg-slate-50 border border-slate-100 rounded-xl transition-colors"><ArrowLeft className="w-4 h-4 text-slate-600" /></button>
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-blue-600" /> Sipariş #{order.order_number}</h1>
          <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mt-0.5">Aşama: {order.current_stage} | Durum: {order.status}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Info */}
        <div className="md:col-span-2 space-y-6">
          {/* Customer */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><User className="w-4 h-4" /> Müşteri Bilgileri</h3>
            <div className="grid grid-cols-2 text-xs font-semibold text-slate-700 gap-2">
              <p><span className="text-slate-400">Yetkili:</span> {order.customer_name}</p>
              <p><span className="text-slate-400">Firma:</span> {order.customer_company || '-'}</p>
              <p><span className="text-slate-400">Tel:</span> {order.phone || '-'}</p>
              <p><span className="text-slate-400">Eposta:</span> {order.email || '-'}</p>
            </div>
          </div>

          {/* Product Items */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Package className="w-4 h-4" /> Ürün & Ödeme</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 font-bold uppercase border-b border-slate-50">
                    <th className="py-2">Ürün</th>
                    <th className="py-2">Miktar</th>
                    <th className="py-2 text-right">Birim Fiyat</th>
                    <th className="py-2 text-right">Toplam</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700 font-semibold divide-y divide-slate-50">
                  {items.map(item => (
                    <tr key={item.id}>
                      <td className="py-2 font-bold">{item.product_name}</td>
                      <td className="py-2">{item.quantity}</td>
                      <td className="py-2 text-right">{item.price.toLocaleString('tr-TR')} {order.currency}</td>
                      <td className="py-2 text-right font-black">{item.total.toLocaleString('tr-TR')} {order.currency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-100 pt-3 text-right font-black text-slate-900 text-sm">
              Genel Tutar: {order.total_amount?.toLocaleString('tr-TR')} {order.currency}
            </div>
          </div>

          {/* Interaction Comments */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><MessageCircle className="w-4 h-4" /> Yorumlar / Notlar</h3>
            
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl" placeholder="Açıklama veya yorum ekleyin..." />
              <button disabled={updating} type="submit" className="px-4 py-3 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors">Gönder</button>
            </form>

            <div className="space-y-2 max-h-48 overflow-y-auto pt-2">
              {comments.map(c => (
                <div key={c.id} className="bg-slate-50 p-3 rounded-xl text-xs font-semibold text-slate-700">
                  <p>{c.comment}</p>
                  <p className="text-[9px] text-slate-400 mt-1">{format(new Date(c.created_at), 'dd.MM.yyyy HH:mm')}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Role Actions & Timeline */}
        <div className="space-y-6">
          {/* Actions Block */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" /> Operasyon Paneli</h3>
            
            <div className="flex flex-col gap-2">
              {/* Marketing Actions */}
              {(isAdmin || userRole === 'pazarlama_muduru') && order.current_stage === 'pazarlama' && (
                <>
                  <button disabled={updating} onClick={() => updateOrderState(order.design_required ? 'grafiker' : 'muhasebe', 'Tasarım/Mali Onay', 'Pazarlama onayladı.')} className="px-4 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 shadow-md">Süreci Başlat</button>
                </>
              )}

              {/* Graphic Designer Actions */}
              {(isAdmin || userRole === 'grafiker') && order.current_stage === 'grafiker' && (
                <>
                  <button disabled={updating} onClick={() => updateOrderState('grafiker', 'Tasarım Tamamlandı', 'Tasarım onay aşamasına iletildi.')} className="px-4 py-2.5 bg-purple-600 text-white text-xs font-bold rounded-xl hover:bg-purple-700">Tasarım Tamamlandı</button>
                  <button disabled={updating} onClick={() => updateOrderState('muhasebe', 'Mali Kontrol', 'Tasarım aşaması onaylandı, Muhasebeye geçiliyor.')} className="px-4 py-2.5 bg-green-600 text-white text-xs font-bold rounded-xl hover:bg-green-700">Muhasebeye Gönder</button>
                </>
              )}

              {/* Accounting Actions */}
              {(isAdmin || userRole === 'muhasebe_muduru') && order.current_stage === 'muhasebe' && (
                <>
                  <button disabled={updating} onClick={() => updateOrderState('muhasebe', 'Ödeme Bekliyor', 'Ödeme tahsilat takibi yapılıyor.')} className="px-4 py-2.5 bg-amber-500 text-white text-xs font-bold rounded-xl hover:bg-amber-600">Ödeme Bekliyor</button>
                  <button disabled={updating} onClick={() => updateOrderState('muhasebe', 'Kısmi Ödeme Alındı', 'Kısmi ödeme yapıldı.')} className="px-4 py-2.5 bg-indigo-500 text-white text-xs font-bold rounded-xl hover:bg-indigo-600">Kısmi Ödeme Alındı</button>
                  <button disabled={updating} onClick={() => updateOrderState('uretim', 'Üretim Sırasında', 'Tam ödeme yapıldı. Üretime yönlendirildi.')} className="px-4 py-2.5 bg-green-600 text-white text-xs font-bold rounded-xl hover:bg-green-700">Ödeme Tamam & Üretime Geç</button>
                </>
              )}

              {/* Production Actions */}
              {(isAdmin || userRole === 'uretim_muduru') && order.current_stage === 'uretim' && (
                <>
                  <button disabled={updating} onClick={() => updateOrderState('uretim', 'Üretime Başlandı', 'İmalat operasyonları başlatıldı.')} className="px-4 py-2.5 bg-orange-500 text-white text-xs font-bold rounded-xl hover:bg-orange-600">Üretime Başlandı</button>
                  <button disabled={updating} onClick={() => updateOrderState('depo', 'Sevkiyat Bekliyor', 'Üretim bitti. Depolamaya geçildi.')} className="px-4 py-2.5 bg-green-600 text-white text-xs font-bold rounded-xl hover:bg-green-700">Üretim Tamamlandı</button>
                </>
              )}

              {/* Warehouse Actions */}
              {(isAdmin || userRole === 'depo_muduru') && order.current_stage === 'depo' && (
                <div className="space-y-2 border-t border-slate-50 pt-2">
                  <input type="text" placeholder="Kargo Firması" value={cargoCompany} onChange={e => setCargoCompany(e.target.value)} className="w-full text-[11px] font-bold px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl" />
                  <input type="text" placeholder="Takip Numarası" value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} className="w-full text-[11px] font-bold px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl" />
                  <input type="number" placeholder="Paket Sayısı" value={packageCount} onChange={e => setPackageCount(parseInt(e.target.value) || 1)} className="w-full text-[11px] font-bold px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl" />
                  
                  <button disabled={updating} onClick={() => updateOrderState('depo', 'Kargoya Verildi', 'Sipariş kargoya verildi.', { cargo_company: cargoCompany, tracking_number: trackingNumber, package_count: packageCount })} className="px-4 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 w-full flex items-center justify-center gap-1"><Truck className="w-4 h-4" /> Kargoya Verildi</button>
                  <button disabled={updating} onClick={() => updateOrderState('tamamlandi', 'Teslim Edildi', 'Paket alıcıya ulaştı.')} className="px-4 py-2.5 bg-green-600 text-white text-xs font-bold rounded-xl hover:bg-green-700 w-full flex items-center justify-center gap-1"><CheckCircle2 className="w-4 h-4" /> Teslim Edildi</button>
                </div>
              )}
            </div>
          </div>

          {/* Timeline Activity Log */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-4 max-h-[400px] overflow-y-auto">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Clock className="w-4 h-4" /> Süreç Geçmişi</h3>
            <div className="relative border-l border-slate-100 pl-4 ml-2 space-y-4">
              {history.map(h => (
                <div key={h.id} className="text-xs font-semibold text-slate-700 relative">
                  <div className="w-2.5 h-2.5 bg-slate-200 border-2 border-white rounded-full absolute -left-[21px] top-1" />
                  <p className="font-bold">{h.new_stage} - {h.new_status}</p>
                  <p className="text-slate-400 font-medium text-[10px]">{h.note}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">{format(new Date(h.changed_at), 'dd.MM.yyyy HH:mm')}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
