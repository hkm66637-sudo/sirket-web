"use client";

import React, { useEffect, useState } from "react";
import { ProductionService, Product, Machine, RawMaterial } from "@/services/production-service";
import { useAuth } from "@/context/auth-context";
import { Package, Plus, Search, Edit2, Trash2, Layers, X, Save } from "lucide-react";

export default function ProductsPage() {
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Product Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [newVar, setNewVar] = useState("");

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
        const [prodRes, machRes, rawRes] = await Promise.all([
          ProductionService.getProducts(profile.company_id),
          ProductionService.getMachines(profile.company_id),
          ProductionService.getRawMaterials(profile.company_id)
        ]);
        console.log("Page data:", { prodRes, machRes, rawRes });
        if (isMounted) {
          setProducts(prodRes || []);
          setMachines(machRes || []);
          setRawMaterials(rawRes || []);
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
      const [prodRes, machRes, rawRes] = await Promise.all([
        ProductionService.getProducts(profile.company_id),
        ProductionService.getMachines(profile.company_id),
        ProductionService.getRawMaterials(profile.company_id)
      ]);
      setProducts(prodRes);
      setMachines(machRes);
      setRawMaterials(rawRes);
    } catch (err: any) {
      console.error(err);
    }
  };

  // -- PRODUCT ACTIONS --
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id || !editingProduct) return;
    try {
      if (editingProduct.id) {
        await ProductionService.updateProduct(editingProduct.id, editingProduct);
      } else {
        await ProductionService.createProduct({ ...editingProduct, company_id: profile.company_id } as Product);
      }
      setIsProductModalOpen(false);
      loadData();
    } catch (err: any) {
      alert("Hata: " + err.message);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Ürünü silmek istediğinize emin misiniz?")) return;
    try {
      await ProductionService.deleteProduct(id);
      loadData();
    } catch (err: any) {
      alert("Hata: " + err.message);
    }
  };



  const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <div className="p-8 text-slate-500 font-bold animate-pulse text-center mt-20">Yükleniyor...</div>;
  if (error) return <div className="p-8 text-red-500 font-bold text-center mt-20">{error}</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" /> Ürünler & Reçeteler
          </h1>
          <p className="text-slate-500 text-xs font-medium mt-1">Ürettiğiniz mamulleri ve standart reçetelerini tanımlayın.</p>
        </div>
        <button onClick={() => { setEditingProduct({ name: "", sku: "", average_duration_minutes: 60 }); setIsProductModalOpen(true); }} className="flex items-center gap-2 bg-blue-600 text-white text-xs font-bold px-5 py-3 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-colors">
          <Plus className="w-4 h-4" /> Yeni Ürün
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden p-6">
        <div className="relative max-w-sm mb-6">
          <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="SKU veya Ürün Adı Ara..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4 rounded-tl-xl">SKU</th>
                <th className="px-6 py-4">Ürün Adı</th>
                <th className="px-6 py-4">Varsayılan Makine</th>
                <th className="px-6 py-4">Süre (Dk)</th>
                <th className="px-6 py-4 text-right rounded-tr-xl">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700 text-xs font-medium">
              {filtered.map(p => {
                const mac = machines.find(m => m.id === p.default_machine_id);
                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-black text-slate-900">{p.sku}</td>
                    <td className="px-6 py-4 font-bold">{p.name}</td>
                    <td className="px-6 py-4">{mac ? mac.name : "-"}</td>
                    <td className="px-6 py-4">{p.average_duration_minutes} dk</td>
                    <td className="px-6 py-4 flex justify-end gap-2">
                      <button onClick={() => { setEditingProduct(p); setIsProductModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => deleteProduct(p.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-slate-400 font-semibold">Ürün bulunamadı.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRODUCT MODAL */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-xl w-full border border-slate-100 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-extrabold text-slate-900 mb-6">{editingProduct.id ? "Ürün Düzenle" : "Yeni Ürün"}</h2>
            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">STOK KODU (SKU) *</label>
                  <input type="text" value={editingProduct.sku || ""} onChange={e => setEditingProduct({ ...editingProduct, sku: e.target.value })} required className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">ÜRÜN ADI *</label>
                  <input type="text" value={editingProduct.name || ""} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} required className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">ÜRÜN GRUBU / KATEGORİ</label>
                  <input type="text" value={editingProduct.category || ""} onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">ANA HAMMADDE TÜRÜ *</label>
                  <select value={editingProduct.raw_material_type || ""} onChange={e => setEditingProduct({ ...editingProduct, raw_material_type: e.target.value })} required className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100">
                    <option value="">Seçiniz</option>
                    <option value="Poliüretan">Poliüretan</option>
                    <option value="Memory">Memory</option>
                    <option value="Medikal Eva">Medikal Eva</option>
                    <option value="Eva">Eva</option>
                    <option value="Sünger">Sünger</option>
                    <option value="XPE">XPE</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">ÜRÜN RENGİ</label>
                  <input type="text" value={editingProduct.product_color || ""} onChange={e => setEditingProduct({ ...editingProduct, product_color: e.target.value })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">HAMMADDE RENGİ</label>
                  <input type="text" value={editingProduct.material_color || ""} onChange={e => setEditingProduct({ ...editingProduct, material_color: e.target.value })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">ÜRETİLDİĞİ MAKİNE</label>
                  <select value={editingProduct.machine_id || editingProduct.default_machine_id || ""} onChange={e => setEditingProduct({ ...editingProduct, machine_id: e.target.value || undefined, default_machine_id: e.target.value || undefined })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100">
                    <option value="">Seçiniz (Opsiyonel)</option>
                    {machines.map(m => <option key={m.id} value={m.id}>{m.name} ({m.code})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">ÜRÜN ETİKETİ</label>
                  <input type="text" placeholder="Örn: X30 Comfort Etiketi" value={editingProduct.product_label || ""} onChange={e => setEditingProduct({ ...editingProduct, product_label: e.target.value })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">ÜRÜN GÖRSELİ (URL)</label>
                  <input type="text" placeholder="https://..." value={editingProduct.image_url || ""} onChange={e => setEditingProduct({ ...editingProduct, image_url: e.target.value })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">KESİM BIÇAĞI / KALIP MODELİ</label>
                  <input type="text" placeholder="Örn: 211 model" value={editingProduct.cutting_blade_model || ""} onChange={e => setEditingProduct({ ...editingProduct, cutting_blade_model: e.target.value })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">ÜRETİM SÜRESİ (DK)</label>
                  <input type="number" value={editingProduct.production_time_minutes || editingProduct.average_duration_minutes || 60} onChange={e => setEditingProduct({ ...editingProduct, production_time_minutes: parseInt(e.target.value), average_duration_minutes: parseInt(e.target.value) })} required className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">GÜNLÜK ÜRETİM KAPASİTESİ</label>
                  <input type="number" value={editingProduct.daily_production_capacity || 0} onChange={e => setEditingProduct({ ...editingProduct, daily_production_capacity: parseInt(e.target.value) })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">KALIP SAYISI</label>
                  <input type="number" value={editingProduct.mold_count || 0} onChange={e => setEditingProduct({ ...editingProduct, mold_count: parseInt(e.target.value) })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" />
                </div>
              </div>

              {/* Variations */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">VARYASYONLAR (BEDEN / NUMARA)</label>
                <div className="flex gap-2 mb-2">
                  <input 
                    type="text" 
                    placeholder="Örn: 38 veya M" 
                    value={newVar} 
                    onChange={e => setNewVar(e.target.value)} 
                    className="flex-1 text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" 
                  />
                  <button 
                    type="button" 
                    onClick={() => {
                      if (!newVar.trim()) return;
                      const currentVars = editingProduct.variations || [];
                      if (!currentVars.includes(newVar.trim())) {
                        setEditingProduct({ ...editingProduct, variations: [...currentVars, newVar.trim()] });
                      }
                      setNewVar("");
                    }}
                    className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200"
                  >
                    Ekle
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {(editingProduct.variations || []).map((v, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm">
                      {v}
                      <button 
                        type="button" 
                        onClick={() => {
                          const currentVars = editingProduct.variations || [];
                          setEditingProduct({ ...editingProduct, variations: currentVars.filter(item => item !== v) });
                        }}
                        className="text-blue-500 hover:text-blue-900 text-xs font-black ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                {/* Hazır Setler */}
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="text-[10px] font-bold text-slate-400 block w-full mb-1">HAZIR VARYASYON SETLERİ</span>
                  <button 
                    type="button" 
                    onClick={() => setEditingProduct({ ...editingProduct, variations: ["36-37", "38-39", "40-41", "42-43", "44-45", "46-47"] })}
                    className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded hover:bg-blue-50 hover:text-blue-600 border border-slate-200"
                  >
                    Çiftli (36-47)
                  </button>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button type="button" onClick={() => setIsProductModalOpen(false)} className="px-5 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50">İptal</button>
                <button type="submit" className="px-5 py-3 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-700">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}



    </div>
  );
}
