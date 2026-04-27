"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useCompany } from "@/context/company-context";
import { supabase } from "@/lib/supabase/client";
import { Layers, Plus, Search, Edit2, Trash2, AlertTriangle, X } from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string;
  raw_material_type?: string;
  product_color?: string;
}

interface ProductionRecipe {
  id: string;
  company_id: string;
  product_id: string;
  recipe_name: string;
  raw_material_type?: string;
  polyurethane_gram?: number;
  iso_gram?: number;
  memory_gram?: number;
  eva_gram?: number;
  sponge_gram?: number;
  xpe_gram?: number;
  fabric_type?: string;
  fabric_amount?: number;
  label_type?: string;
  label_description?: string;
  adhesive_material?: string;
  waste_percentage?: number;
  notes?: string;
  created_at?: string;
}

export default function RecipesPage() {
  const { profile } = useAuth();
  const { selectedCompanyId, selectedCompany, companies, setSelectedCompanyId } = useCompany();

  const [recipes, setRecipes] = useState<ProductionRecipe[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<ProductionRecipe>>({
    product_id: "",
    recipe_name: "",
    raw_material_type: "",
    polyurethane_gram: undefined,
    iso_gram: undefined,
    memory_gram: undefined,
    eva_gram: undefined,
    sponge_gram: undefined,
    xpe_gram: undefined,
    fabric_type: "",
    fabric_amount: undefined,
    label_type: "Tek",
    label_description: "",
    adhesive_material: "",
    waste_percentage: 0,
    notes: ""
  });

  // Şirket seçili mi kontrolü
  useEffect(() => {
    if (selectedCompanyId === "ALL" && companies.length > 0) {
      setSelectedCompanyId(companies[0].id);
    }
  }, [selectedCompanyId, companies, setSelectedCompanyId]);

  const fetchData = async () => {
    const targetCompanyId = selectedCompanyId && selectedCompanyId !== "ALL" 
      ? selectedCompanyId 
      : profile?.company_id;

    if (!targetCompanyId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Bağımsız sorgular (Timeout için AbortController kullanılabilir ama Supabase client direkt async)
      const productsPromise = supabase
        .from("products")
        .select("id, name, sku")
        .eq("company_id", targetCompanyId);

      const recipesPromise = supabase
        .from("production_recipes")
        .select("id, company_id, product_id, recipe_name, raw_material_type, polyurethane_gram, iso_gram, memory_gram, eva_gram, sponge_gram, xpe_gram, fabric_type, fabric_amount, label_type, label_description, adhesive_material, waste_percentage, notes, created_at")
        .eq("company_id", targetCompanyId);

      const [prodRes, recRes] = await Promise.all([productsPromise, recipesPromise]);

      if (prodRes.error) throw new Error(`Ürünler: ${prodRes.error.message}`);
      if (recRes.error) {
        if (recRes.error.code === "42P01" || recRes.error.message?.includes("does not exist")) {
          throw new Error("Reçete tablosu bulunamadı. Veritabanı migration çalıştırılmalı.");
        }
        throw new Error(`Reçeteler: ${recRes.error.message}`);
      }

      setProducts(prodRes.data || []);
      setRecipes(recRes.data || []);
    } catch (err: any) {
      console.error("Fetch Data Error:", err);
      setError(`Reçeteler yüklenemedi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile, selectedCompanyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (selectedCompanyId === "ALL") {
      setFormError("Lütfen kayıt yapmadan önce tek bir şirket seçin.");
      return;
    }

    const targetCompanyId = selectedCompanyId && selectedCompanyId !== "ALL" 
      ? selectedCompanyId 
      : profile?.company_id;

    if (!targetCompanyId) {
      setFormError("Şirket seçimi yüklenemedi.");
      return;
    }

    if (!formData.product_id) {
      setFormError("Lütfen bir ürün seçin.");
      return;
    }

    if (!formData.recipe_name?.trim()) {
      setFormError("Reçete adı boş bırakılamaz.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...formData,
        company_id: targetCompanyId,
        polyurethane_gram: formData.polyurethane_gram ? Number(formData.polyurethane_gram) : null,
        iso_gram: formData.iso_gram ? Number(formData.iso_gram) : null,
        memory_gram: formData.memory_gram ? Number(formData.memory_gram) : null,
        eva_gram: formData.eva_gram ? Number(formData.eva_gram) : null,
        sponge_gram: formData.sponge_gram ? Number(formData.sponge_gram) : null,
        xpe_gram: formData.xpe_gram ? Number(formData.xpe_gram) : null,
        fabric_amount: formData.fabric_amount ? Number(formData.fabric_amount) : null,
        waste_percentage: formData.waste_percentage ? Number(formData.waste_percentage) : 0
      };

      if (editingId) {
        const { error } = await supabase
          .from("production_recipes")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("production_recipes")
          .insert([payload]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      setFormData({
        product_id: "",
        recipe_name: "",
        raw_material_type: "",
        polyurethane_gram: undefined,
        iso_gram: undefined,
        memory_gram: undefined,
        eva_gram: undefined,
        sponge_gram: undefined,
        xpe_gram: undefined,
        fabric_type: "",
        fabric_amount: undefined,
        label_type: "Tek",
        label_description: "",
        adhesive_material: "",
        waste_percentage: 0,
        notes: ""
      });
      setEditingId(null);
      await fetchData();
    } catch (err: any) {
      setFormError(err.message || "Kaydedilirken bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu reçeteyi silmek istediğinize emin misiniz?")) return;
    try {
      const { error } = await supabase
        .from("production_recipes")
        .delete()
        .eq("id", id);
      if (error) throw error;
      await fetchData();
    } catch (err: any) {
      alert("Silme başarısız: " + err.message);
    }
  };

  const openEdit = (rec: ProductionRecipe) => {
    setEditingId(rec.id);
    setFormData({ ...rec });
    setIsModalOpen(true);
  };

  const openAdd = () => {
    setEditingId(null);
    setFormData({
      product_id: "",
      recipe_name: "",
      raw_material_type: "",
      polyurethane_gram: undefined,
      iso_gram: undefined,
      memory_gram: undefined,
      eva_gram: undefined,
      sponge_gram: undefined,
      xpe_gram: undefined,
      fabric_type: "",
      fabric_amount: undefined,
      label_type: "Tek",
      label_description: "",
      adhesive_material: "",
      waste_percentage: 0,
      notes: ""
    });
    setIsModalOpen(true);
  };

  const filteredRecipes = recipes.filter(rec => {
    const pName = products.find(p => p.id === rec.product_id)?.name?.toLowerCase() || "";
    const rName = rec.recipe_name.toLowerCase();
    const search = searchTerm.toLowerCase();
    return pName.includes(search) || rName.includes(search);
  });

  const targetCompanyId = selectedCompanyId && selectedCompanyId !== "ALL" 
    ? selectedCompanyId 
    : profile?.company_id;

  if (!targetCompanyId) {
    return (
      <div className="p-8 text-center text-slate-500 font-bold mt-20">
        Lütfen reçete işlemleri için bir şirket seçin.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] mt-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-xs font-bold text-slate-500 mt-4">Yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-blue-600" /> Üretim Reçeteleri (BOM)
          </h1>
          <p className="text-slate-500 text-xs font-medium mt-1">Üretim hammadde ve bileşen reçetelerini yönetin.</p>
        </div>
        <button 
          onClick={openAdd} 
          className="flex items-center gap-2 bg-blue-600 text-white text-xs font-bold px-5 py-3 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-colors"
        >
          <Plus className="w-4 h-4" /> Yeni Reçete
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-xs font-bold border border-red-100 mb-6 flex items-center gap-2 animate-in fade-in-50">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden p-6">
        <div className="relative max-w-sm mb-6">
          <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Reçete veya Ürün Adı Ara..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>

        {filteredRecipes.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-semibold text-xs">Henüz reçete bulunmuyor.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-4 rounded-tl-xl">Ürün</th>
                  <th className="px-6 py-4">Reçete Adı</th>
                  <th className="px-6 py-4">Hammadde</th>
                  <th className="px-6 py-4">Fire (%)</th>
                  <th className="px-6 py-4 text-right rounded-tr-xl">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700 text-xs font-medium">
                {filteredRecipes.map(rec => {
                  const prod = products.find(p => p.id === rec.product_id);
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {prod ? `${prod.name} (${prod.sku})` : "Bilinmeyen Ürün"}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">{rec.recipe_name}</td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                          {rec.raw_material_type || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-black">{rec.waste_percentage || 0}%</td>
                      <td className="px-6 py-4 flex justify-end gap-2">
                        <button onClick={() => openEdit(rec)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(rec.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-100 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-extrabold text-slate-900">{editingId ? "Reçete Düzenle" : "Yeni Reçete"}</h2>
              <button onClick={() => { setIsModalOpen(false); setFormError(null); }} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="bg-red-50 text-red-600 border border-red-100 rounded-xl p-4 text-xs font-semibold flex items-center gap-2 animate-in fade-in-50">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">ÜRÜN SEÇİMİ *</label>
                  <select 
                    value={formData.product_id || ""} 
                    onChange={e => setFormData({ ...formData, product_id: e.target.value })} 
                    required 
                    className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Seçiniz</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">REÇETE ADI *</label>
                  <input 
                    type="text" 
                    value={formData.recipe_name || ""} 
                    onChange={e => setFormData({ ...formData, recipe_name: e.target.value })} 
                    required 
                    className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" 
                    placeholder="Örn: X30 Kışlık Reçetesi" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">ANA HAMMADDE TÜRÜ</label>
                  <select 
                    value={formData.raw_material_type || ""} 
                    onChange={e => setFormData({ ...formData, raw_material_type: e.target.value })} 
                    className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Seçiniz</option>
                    <option value="Poliüretan">Poliüretan</option>
                    <option value="Eva">Eva</option>
                    <option value="Kumaş">Kumaş</option>
                    <option value="İzo">İzo</option>
                    <option value="Memory">Memory</option>
                    <option value="XPE">XPE</option>
                    <option value="Sünger">Sünger</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">FİRE ORANI (%)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={formData.waste_percentage === undefined ? "" : formData.waste_percentage} 
                    onChange={e => setFormData({ ...formData, waste_percentage: e.target.value === "" ? 0 : parseFloat(e.target.value) })} 
                    className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" 
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <h3 className="text-xs font-black text-slate-800 mb-3 uppercase tracking-wider">Hammadde Gramajları</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">POLİÜRETAN (GR)</label>
                    <input type="number" step="0.1" value={formData.polyurethane_gram === undefined ? "" : formData.polyurethane_gram} onChange={e => setFormData({ ...formData, polyurethane_gram: e.target.value === "" ? undefined : parseFloat(e.target.value) })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">İZO (GR)</label>
                    <input type="number" step="0.1" value={formData.iso_gram === undefined ? "" : formData.iso_gram} onChange={e => setFormData({ ...formData, iso_gram: e.target.value === "" ? undefined : parseFloat(e.target.value) })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">MEMORY (GR)</label>
                    <input type="number" step="0.1" value={formData.memory_gram === undefined ? "" : formData.memory_gram} onChange={e => setFormData({ ...formData, memory_gram: e.target.value === "" ? undefined : parseFloat(e.target.value) })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">EVA (GR)</label>
                  <input type="number" step="0.1" value={formData.eva_gram === undefined ? "" : formData.eva_gram} onChange={e => setFormData({ ...formData, eva_gram: e.target.value === "" ? undefined : parseFloat(e.target.value) })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">SÜNGER (GR)</label>
                  <input type="number" step="0.1" value={formData.sponge_gram === undefined ? "" : formData.sponge_gram} onChange={e => setFormData({ ...formData, sponge_gram: e.target.value === "" ? undefined : parseFloat(e.target.value) })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">XPE (GR)</label>
                  <input type="number" step="0.1" value={formData.xpe_gram === undefined ? "" : formData.xpe_gram} onChange={e => setFormData({ ...formData, xpe_gram: e.target.value === "" ? undefined : parseFloat(e.target.value) })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">KUMAŞ TÜRÜ</label>
                  <input type="text" value={formData.fabric_type || ""} onChange={e => setFormData({ ...formData, fabric_type: e.target.value })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" placeholder="Örn: Pamuklu, Polar" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">KUMAŞ MİKTARI (METRE)</label>
                  <input type="number" step="0.01" value={formData.fabric_amount === undefined ? "" : formData.fabric_amount} onChange={e => setFormData({ ...formData, fabric_amount: e.target.value === "" ? undefined : parseFloat(e.target.value) })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">ETİKET TÜRÜ</label>
                  <select value={formData.label_type || "Tek"} onChange={e => setFormData({ ...formData, label_type: e.target.value })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100">
                    <option value="Tek">Tek</option>
                    <option value="Çift">Çift</option>
                    <option value="Özel">Özel</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">YARDIMCI MALZEME</label>
                  <input type="text" value={formData.adhesive_material || ""} onChange={e => setFormData({ ...formData, adhesive_material: e.target.value })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" placeholder="Örn: Sıcak Tutkal" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">ETİKET AÇIKLAMASI</label>
                <input type="text" value={formData.label_description || ""} onChange={e => setFormData({ ...formData, label_description: e.target.value })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" placeholder="Örn: Standart X30" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">NOTLAR</label>
                <textarea value={formData.notes || ""} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100 h-20 resize-none" placeholder="Üretim ekibi için notlar..."></textarea>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button type="button" disabled={saving} onClick={() => { setIsModalOpen(false); setFormError(null); }} className="px-5 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-50">İptal</button>
                <button type="submit" disabled={saving} className="px-5 py-3 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
