"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { ProductionService, Product, ProductionRecipe } from "@/services/production-service";
import { Layers, Plus, Search, Edit2, Trash2 } from "lucide-react";

export default function RecipesPage() {
  const { profile } = useAuth();
  
  const [recipes, setRecipes] = useState<ProductionRecipe[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Partial<ProductionRecipe> | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!profile?.company_id) {
      return;
    }

    const withTimeout = <T,>(promise: Promise<T>, ms: number, msg: string): Promise<T> => {
      let timeoutId: NodeJS.Timeout;
      const timeoutPromise = new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`Timeout: ${msg}`)), ms);
      });
      return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
    };

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let prodRes: Product[] = [];
        try {
          prodRes = await withTimeout(
            ProductionService.getProducts(profile.company_id!),
            25000,
            "getProducts query taking too long"
          );
        } catch (prodErr: any) {
          console.error("production_products fetch error:", prodErr);
          if (isMounted) {
            setError(`Ürünler yüklenemedi: ${prodErr.message}`);
            setLoading(false);
            return;
          }
        }

        let recRes: ProductionRecipe[] = [];
        try {
          recRes = await withTimeout(
            ProductionService.getProductionRecipes(),
            25000,
            "getProductionRecipes query taking too long"
          );
        } catch (recErr: any) {
          console.error("production_recipes fetch error message:", recErr.message);
          if (isMounted) {
            if (recErr.message?.includes("relation") && (recErr.message?.includes("does not exist") || recErr.message?.includes("42P01"))) {
              setError("Reçete tablosu bulunamadı. Veritabanı migration çalıştırılmalı.");
            } else {
              setError(`Reçeteler yüklenemedi: ${recErr.message}`);
            }
            setLoading(false);
            return;
          }
        }

        if (isMounted) {
          const productIds = prodRes.map(p => p.id);
          const filteredRecipes = recRes.filter(r => productIds.includes(r.product_id));
          setRecipes(filteredRecipes);
          setProducts(prodRes);
        }
      } catch (err: any) {
        console.error("General Recipe load error:", err);
        if (isMounted) {
          setError(err.message || "Bilinmeyen veri yükleme hatası");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchData();

    return () => {
      isMounted = false;
    };
  }, [profile]);

  const loadData = async () => {
    if (!profile?.company_id) return;
    try {
      const [prodRes, recRes] = await Promise.all([
        ProductionService.getProducts(profile.company_id),
        ProductionService.getProductionRecipes()
      ]);
      const productIds = prodRes.map(p => p.id);
      const filteredRecipes = recRes.filter(r => productIds.includes(r.product_id));
      setRecipes(filteredRecipes);
    } catch (err: any) {
      console.error("loadData error:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecipe || !editingRecipe.product_id || !editingRecipe.recipe_name) {
      alert("Lütfen zorunlu alanları doldurun.");
      return;
    }
    try {
      if (editingRecipe.id) {
        await ProductionService.updateStandaloneRecipe(editingRecipe.id, editingRecipe);
      } else {
        await ProductionService.createStandaloneRecipe(editingRecipe);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert("Hata: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Reçeteyi silmek istediğinize emin misiniz?")) return;
    try {
      await ProductionService.deleteStandaloneRecipe(id);
      loadData();
    } catch (err: any) {
      alert("Hata: " + err.message);
    }
  };

  const filtered = recipes.filter(r => {
    const pName = products.find(p => p.id === r.product_id)?.name || "";
    return r.recipe_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           pName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-xs font-bold text-slate-500">Yükleniyor...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-700 p-4 rounded-xl text-xs font-bold border border-red-100">{error}</div>
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
          <p className="text-slate-500 text-xs font-medium mt-1">Ürünlerin hammadde ve operasyon tariflerini düzenleyin.</p>
        </div>
        <button 
          onClick={() => { setEditingRecipe({ recipe_name: "", product_id: "", polyurethane_gram: 0, iso_gram: 0, waste_percentage: 0 }); setIsModalOpen(true); }} 
          className="flex items-center gap-2 bg-blue-600 text-white text-xs font-bold px-5 py-3 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-colors"
        >
          <Plus className="w-4 h-4" /> Yeni Reçete
        </button>
      </div>

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

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4 rounded-tl-xl">Reçete Adı</th>
                <th className="px-6 py-4">İlgili Ürün</th>
                <th className="px-6 py-4">Ana Hammadde</th>
                <th className="px-6 py-4">Fire Oranı (%)</th>
                <th className="px-6 py-4 text-right rounded-tr-xl">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700 text-xs font-medium">
              {filtered.map(r => {
                const prodName = products.find(p => p.id === r.product_id)?.name || "Bilinmeyen Ürün";
                return (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{r.recipe_name}</td>
                    <td className="px-6 py-4 font-semibold text-slate-600">{prodName}</td>
                    <td className="px-6 py-4">{r.raw_material_type || "-"}</td>
                    <td className="px-6 py-4 font-bold text-red-500">%{r.waste_percentage || 0}</td>
                    <td className="px-6 py-4 flex justify-end gap-2">
                      <button onClick={() => { setEditingRecipe(r); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(r.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-slate-400 font-semibold">Henüz reçete bulunmuyor.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECIPE MODAL */}
      {isModalOpen && editingRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-2xl w-full border border-slate-100 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-extrabold text-slate-900 mb-6">{editingRecipe.id ? "Reçete Düzenle" : "Yeni Reçete"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">ÜRÜN SEÇİMİ *</label>
                  <select 
                    value={editingRecipe.product_id || ""} 
                    onChange={e => setEditingRecipe({ ...editingRecipe, product_id: e.target.value })} 
                    required 
                    className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Ürün Seçiniz</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">REÇETE ADI *</label>
                  <input 
                    type="text" 
                    value={editingRecipe.recipe_name || ""} 
                    onChange={e => setEditingRecipe({ ...editingRecipe, recipe_name: e.target.value })} 
                    required 
                    className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">ANA HAMMADDE TÜRÜ</label>
                  <select 
                    value={editingRecipe.raw_material_type || ""} 
                    onChange={e => setEditingRecipe({ ...editingRecipe, raw_material_type: e.target.value })} 
                    className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Seçiniz</option>
                    <option value="Poliüretan">Poliüretan</option>
                    <option value="Memory">Memory</option>
                    <option value="Medikal Eva">Medikal Eva</option>
                    <option value="Eva">Eva</option>
                    <option value="Sünger">Sünger</option>
                    <option value="XPE">XPE</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">POLİÜRETAN MİKTARI (GR)</label>
                  <input type="number" step="any" value={editingRecipe.polyurethane_gram || 0} onChange={e => setEditingRecipe({ ...editingRecipe, polyurethane_gram: parseFloat(e.target.value) })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">İZO MİKTARI (GR)</label>
                  <input type="number" step="any" value={editingRecipe.iso_gram || 0} onChange={e => setEditingRecipe({ ...editingRecipe, iso_gram: parseFloat(e.target.value) })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">MEMORY (GR)</label>
                  <input type="number" step="any" value={editingRecipe.memory_gram || 0} onChange={e => setEditingRecipe({ ...editingRecipe, memory_gram: parseFloat(e.target.value) })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">EVA MİKTARI (GR)</label>
                  <input type="number" step="any" value={editingRecipe.eva_gram || 0} onChange={e => setEditingRecipe({ ...editingRecipe, eva_gram: parseFloat(e.target.value) })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">SÜNGER MİKTARI (GR)</label>
                  <input type="number" step="any" value={editingRecipe.sponge_gram || 0} onChange={e => setEditingRecipe({ ...editingRecipe, sponge_gram: parseFloat(e.target.value) })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">XPE MİKTARI (GR)</label>
                  <input type="number" step="any" value={editingRecipe.xpe_gram || 0} onChange={e => setEditingRecipe({ ...editingRecipe, xpe_gram: parseFloat(e.target.value) })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">KUMAŞ MİKTARI</label>
                  <input type="number" step="any" value={editingRecipe.fabric_amount || 0} onChange={e => setEditingRecipe({ ...editingRecipe, fabric_amount: parseFloat(e.target.value) })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">KULLANILAN KUMAŞ TÜRÜ</label>
                  <input type="text" placeholder="Örn: Siyah file kumaş" value={editingRecipe.fabric_type || ""} onChange={e => setEditingRecipe({ ...editingRecipe, fabric_type: e.target.value })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">ETİKET TÜRÜ</label>
                  <select 
                    value={editingRecipe.label_type || ""} 
                    onChange={e => setEditingRecipe({ ...editingRecipe, label_type: e.target.value })} 
                    className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Seçiniz</option>
                    <option value="Tek">Tek</option>
                    <option value="Çift">Çift</option>
                    <option value="Özel">Özel</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">ETİKET AÇIKLAMASI</label>
                  <input type="text" value={editingRecipe.label_description || ""} onChange={e => setEditingRecipe({ ...editingRecipe, label_description: e.target.value })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">YAPIŞTIRICI / YARDIMCI MALZEME</label>
                  <input type="text" value={editingRecipe.adhesive_material || ""} onChange={e => setEditingRecipe({ ...editingRecipe, adhesive_material: e.target.value })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">FİRE ORANI (%)</label>
                  <input type="number" step="any" value={editingRecipe.waste_percentage || 0} onChange={e => setEditingRecipe({ ...editingRecipe, waste_percentage: parseFloat(e.target.value) })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">NOTLAR</label>
                <textarea rows={3} value={editingRecipe.notes || ""} onChange={e => setEditingRecipe({ ...editingRecipe, notes: e.target.value })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50">İptal</button>
                <button type="submit" className="px-5 py-3 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-700">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
