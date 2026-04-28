"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useCompany } from "@/context/company-context";
import { supabase } from "@/lib/supabase";
import { ShoppingBag, ArrowLeft, Save, AlertTriangle } from "lucide-react";

export default function NewCorporateOrder() {
  const router = useRouter();
  const { profile } = useAuth();
  const { selectedCompanyId } = useCompany();

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customer_name: "",
    customer_company: "",
    phone: "",
    email: "",
    tax_office: "",
    tax_number: "",
    delivery_address: "",
    invoice_address: "",
    order_type: "promosyon",
    product_name: "",
    quantity: 1,
    unit_price: 0,
    currency: "TRY",
    vat_rate: 20,
    deadline_date: "",
    customer_note: "",
    marketing_note: "",
    design_required: true,
    production_required: true,
    delivery_method: "Kargo"
  });

  const totalAmount = Number(formData.quantity) * Number(formData.unit_price);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const userRole = profile?.role;
    if (userRole !== 'admin' && userRole !== 'super_admin' && userRole !== 'pazarlama_muduru') {
      setFormError("Bu işlemi gerçekleştirmek için yetkiniz bulunmuyor.");
      return;
    }

    const companyId = selectedCompanyId && selectedCompanyId !== "ALL" 
      ? selectedCompanyId 
      : profile?.company_id;

    if (!companyId) {
      setFormError("Lütfen sipariş kaydı öncesinde bir şirket seçin.");
      return;
    }

    if (!formData.customer_name.trim() || !formData.product_name.trim()) {
      setFormError("Müşteri adı ve ürün adı boş bırakılamaz.");
      return;
    }

    try {
      setSaving(true);

      // Workflow Engine Rule
      // Promosyon OR design_required -> grafiker
      // Else -> muhasebe
      const targetStage = (formData.order_type === 'promosyon' || formData.design_required) 
        ? 'grafiker' 
        : 'muhasebe';

      const orderNumber = `KRP-${Date.now().toString().slice(-6)}`;

      // 1. Create Corporate Order
      const { data: orderData, error: orderErr } = await supabase
        .from("corporate_orders")
        .insert([{
          company_id: companyId,
          order_number: orderNumber,
          customer_name: formData.customer_name,
          customer_company: formData.customer_company,
          phone: formData.phone,
          email: formData.email,
          tax_office: formData.tax_office,
          tax_number: formData.tax_number,
          delivery_address: formData.delivery_address,
          invoice_address: formData.invoice_address,
          order_type: formData.order_type,
          current_stage: targetStage,
          status: 'Yeni',
          responsible_role: targetStage === 'grafiker' ? 'grafiker' : 'muhasebe_muduru',
          total_amount: totalAmount,
          currency: formData.currency,
          vat_rate: Number(formData.vat_rate),
          deadline_date: formData.deadline_date || null,
          created_by: profile?.id,
          design_required: formData.design_required,
          production_required: formData.production_required,
          delivery_method: formData.delivery_method,
          customer_note: formData.customer_note,
          marketing_note: formData.marketing_note
        }])
        .select()
        .single();

      if (orderErr) throw orderErr;

      // 2. Create Corporate Order Item
      const { error: itemErr } = await supabase
        .from("corporate_order_items")
        .insert([{
          order_id: orderData.id,
          product_name: formData.product_name,
          quantity: Number(formData.quantity),
          price: Number(formData.unit_price),
          total: totalAmount
        }]);

      if (itemErr) throw itemErr;

      // 3. Create Status History
      await supabase
        .from("corporate_order_status_history")
        .insert([{
          order_id: orderData.id,
          old_status: null,
          new_status: 'Yeni',
          old_stage: null,
          new_stage: targetStage,
          note: 'Sipariş pazarlama kanalı üzerinden oluşturuldu.',
          changed_by: profile?.id
        }]);

      router.push("/corporate");
    } catch (err: any) {
      console.error("Order save error:", err);
      setFormError(err.message || "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-50 rounded-xl transition-colors border border-slate-100"><ArrowLeft className="w-4 h-4 text-slate-600" /></button>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-blue-600" /> Yeni Kurumsal Sipariş</h1>
            <p className="text-slate-500 text-xs font-medium mt-0.5">Sipariş bilgilerini workflow adımlarına yönlendirin.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {formError && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-xs font-bold text-red-600 flex items-center gap-2 animate-in slide-in-from-top-1">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {formError}
          </div>
        )}

        {/* Customer Information */}
        <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Müşteri ve Cari Bilgiler</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">MÜŞTERİ YETKİLİ ADI *</label>
              <input type="text" value={formData.customer_name} onChange={e => setFormData({ ...formData, customer_name: e.target.value })} required className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl" placeholder="Örn: Ahmet Yılmaz" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">MÜŞTERİ FİRMA ADI</label>
              <input type="text" value={formData.customer_company} onChange={e => setFormData({ ...formData, customer_company: e.target.value })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl" placeholder="Örn: ABC Tekstil Ltd." />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">TELEFON</label>
              <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl" placeholder="05xx" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">EMAIL</label>
              <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl" placeholder="info@firma.com" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">VERGİ DAİRESİ</label>
              <input type="text" value={formData.tax_office} onChange={e => setFormData({ ...formData, tax_office: e.target.value })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">VERGİ NUMARASI</label>
              <input type="text" value={formData.tax_number} onChange={e => setFormData({ ...formData, tax_number: e.target.value })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">FATURA ADRESİ</label>
              <textarea value={formData.invoice_address} onChange={e => setFormData({ ...formData, invoice_address: e.target.value })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl h-20 resize-none" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">SEVKİYAT ADRESİ</label>
              <textarea value={formData.delivery_address} onChange={e => setFormData({ ...formData, delivery_address: e.target.value })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl h-20 resize-none" />
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Sipariş Kalem Detayları</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">SİPARİŞ TÜRÜ *</label>
              <select value={formData.order_type} onChange={(e: any) => setFormData({ ...formData, order_type: e.target.value })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl">
                <option value="promosyon">Promosyon</option>
                <option value="toptan">Toptan</option>
                <option value="ozel_uretim">Özel Üretim</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">ÜRÜN ADI *</label>
              <input type="text" value={formData.product_name} onChange={e => setFormData({ ...formData, product_name: e.target.value })} required className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl" placeholder="Örn: Baskılı Promosyon Çanta" />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">MİKTAR</label>
              <input type="number" min="1" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">BİRİM FİYAT</label>
              <input type="number" step="0.01" min="0" value={formData.unit_price} onChange={e => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">KDV ORANI (%)</label>
              <input type="number" value={formData.vat_rate} onChange={e => setFormData({ ...formData, vat_rate: parseInt(e.target.value) || 20 })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">DÖVİZ</label>
              <select value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl">
                <option value="TRY">TRY</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          <div className="text-right font-black text-slate-900 text-sm mt-2">
            Toplam Tutar: {totalAmount.toLocaleString('tr-TR')} {formData.currency}
          </div>
        </div>

        {/* Workflow Routing Logic */}
        <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">İş Akışı ve Lojistik Planlama</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">TERMİN TARİHİ</label>
              <input type="date" value={formData.deadline_date} onChange={e => setFormData({ ...formData, deadline_date: e.target.value })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">TESLİMAT / SEVKİYAT TÜRÜ</label>
              <select value={formData.delivery_method} onChange={e => setFormData({ ...formData, delivery_method: e.target.value })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl">
                <option value="Kargo">Kargo</option>
                <option value="Ambar">Ambar</option>
                <option value="Elden">Elden Teslim</option>
                <option value="Kendi_Aracimiz">Kendi Aracımız</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 py-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={formData.design_required} onChange={e => setFormData({ ...formData, design_required: e.target.checked })} className="w-4 h-4 text-blue-600 border-slate-200 rounded focus:ring-blue-500" />
              <div>
                <p className="text-xs font-bold text-slate-800">Grafik Tasarım / Onay Gerekli</p>
                <p className="text-[10px] font-medium text-slate-400">Özel logo veya baskı kurgusu grafiker onayına düşer.</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={formData.production_required} onChange={e => setFormData({ ...formData, production_required: e.target.checked })} className="w-4 h-4 text-blue-600 border-slate-200 rounded focus:ring-blue-500" />
              <div>
                <p className="text-xs font-bold text-slate-800">İmalat / Üretim Gerekli</p>
                <p className="text-[10px] font-medium text-slate-400">Hazır stok değilse üretim aşamasına yönlendirilir.</p>
              </div>
            </label>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">MÜŞTERİ ÖZEL NOTLARI</label>
            <textarea value={formData.customer_note} onChange={e => setFormData({ ...formData, customer_note: e.target.value })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl h-20 resize-none" placeholder="Örn: Paketleme şeffaf poşette olacak." />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" disabled={saving} onClick={() => router.push("/corporate")} className="px-5 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-50">İptal</button>
          <button type="submit" disabled={saving} className="px-6 py-3 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? "Kaydediliyor..." : "Siparişi Başlat"}
          </button>
        </div>
      </form>
    </div>
  );
}
