"use client";

import React, { useEffect, useState } from "react";
import { ProductionService, RawMaterial } from "@/services/production-service";
import { useAuth } from "@/context/auth-context";
import { PackageOpen, Plus, Search, Edit2, Trash2, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";

export default function RawMaterialsPage() {
  const { profile } = useAuth();
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<RawMaterial>>({
    name: "",
    unit: "adet",
    current_stock: 0,
    minimum_stock: 0,
    critical_stock: 0,
    supplier_name: "",
    lead_time_days: 3
  });

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
          // If profile is not ready yet, we wait, but since dependency is [profile], it will re-run.
          return;
        }
        const data = await ProductionService.getRawMaterials(profile.company_id);
        console.log("Page data:", data);
        if (isMounted) {
          setMaterials(data || []);
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
      const data = await ProductionService.getRawMaterials(profile.company_id);
      setMaterials(data || []);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return;
    try {
      if (editingId) {
        await ProductionService.updateRawMaterial(editingId, formData);
      } else {
        await ProductionService.createRawMaterial({ ...formData, company_id: profile.company_id } as RawMaterial);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert("İşlem başarısız: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Silmek istediğinize emin misiniz?")) return;
    try {
      await ProductionService.deleteRawMaterial(id);
      loadData();
    } catch (err: any) {
      alert("Silme başarısız: " + err.message);
    }
  };

  const openEdit = (mat: RawMaterial) => {
    setEditingId(mat.id);
    setFormData(mat);
    setIsModalOpen(true);
  };

  const openAdd = () => {
    setEditingId(null);
    setFormData({
      name: "", unit: "adet", current_stock: 0, minimum_stock: 0, critical_stock: 0, supplier_name: "", lead_time_days: 3
    });
    setIsModalOpen(true);
  };

  const filtered = materials.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <div className="p-8 text-slate-500 font-bold animate-pulse text-center mt-20">Yükleniyor...</div>;
  if (error) return <div className="p-8 text-red-500 font-bold text-center mt-20">{error}</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <PackageOpen className="w-6 h-6 text-blue-600" /> Hammaddeler & Stok
          </h1>
          <p className="text-slate-500 text-xs font-medium mt-1">Üretim kalemlerinizin depo stoklarını ve tedarik verilerini yönetin.</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 text-white text-xs font-bold px-5 py-3 rounded-xl shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-colors shrink-0">
          <Plus className="w-4 h-4" /> Yeni Hammadde
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden p-6">
        <div className="relative max-w-sm mb-6">
          <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Hammadde Ara..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4 rounded-tl-xl">Adı</th>
                <th className="px-6 py-4">Birim</th>
                <th className="px-6 py-4">Mevcut Stok</th>
                <th className="px-6 py-4">Rezerve</th>
                <th className="px-6 py-4">Tedarikçi</th>
                <th className="px-6 py-4">Durum</th>
                <th className="px-6 py-4 text-right rounded-tr-xl">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700 text-xs font-medium">
              {filtered.map(mat => {
                const available = Number(mat.current_stock) - Number(mat.reserved_stock || 0);
                let statusIcon = <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
                let statusText = "Yeterli";
                let statusBg = "bg-emerald-50 text-emerald-600 border-emerald-100";

                if (available <= Number(mat.critical_stock)) {
                  statusIcon = <AlertTriangle className="w-4 h-4 text-red-500" />;
                  statusText = "Kritik";
                  statusBg = "bg-red-50 text-red-600 border-red-100";
                } else if (available <= Number(mat.minimum_stock)) {
                  statusIcon = <AlertCircle className="w-4 h-4 text-amber-500" />;
                  statusText = "Sınırda";
                  statusBg = "bg-amber-50 text-amber-600 border-amber-100";
                }

                return (
                  <tr key={mat.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{mat.name}</td>
                    <td className="px-6 py-4">{mat.unit}</td>
                    <td className="px-6 py-4 font-black">{mat.current_stock}</td>
                    <td className="px-6 py-4 text-slate-400">{mat.reserved_stock || 0}</td>
                    <td className="px-6 py-4">{mat.supplier_name || "-"}</td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border w-fit font-bold text-[10px] uppercase tracking-wider ${statusBg}`}>
                        {statusIcon} {statusText}
                      </div>
                    </td>
                    <td className="px-6 py-4 flex justify-end gap-2">
                      <button onClick={() => openEdit(mat)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(mat.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 font-semibold">Hammadde bulunamadı.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full border border-slate-100 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-xl font-extrabold text-slate-900 mb-6">{editingId ? "Hammadde Düzenle" : "Yeni Hammadde"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">HAMMADDE ADI</label>
                <input type="text" value={formData.name || ""} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">BİRİM</label>
                  <input type="text" value={formData.unit || ""} onChange={e => setFormData({ ...formData, unit: e.target.value })} required className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" placeholder="adet, kg, mt" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">FİİLİ STOK (Fiziksel)</label>
                  <input type="number" step="0.01" value={formData.current_stock || 0} onChange={e => setFormData({ ...formData, current_stock: parseFloat(e.target.value) })} required className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">MİNİMUM STOK (Uyarı)</label>
                  <input type="number" step="0.01" value={formData.minimum_stock || 0} onChange={e => setFormData({ ...formData, minimum_stock: parseFloat(e.target.value) })} required className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">KRİTİK STOK (Risk)</label>
                  <input type="number" step="0.01" value={formData.critical_stock || 0} onChange={e => setFormData({ ...formData, critical_stock: parseFloat(e.target.value) })} required className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">TEDARİKÇİ</label>
                  <input type="text" value={formData.supplier_name || ""} onChange={e => setFormData({ ...formData, supplier_name: e.target.value })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">TEDARİK SÜRESİ (GÜN)</label>
                  <input type="number" value={formData.lead_time_days || 0} onChange={e => setFormData({ ...formData, lead_time_days: parseInt(e.target.value) })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors">İptal</button>
                <button type="submit" className="px-5 py-3 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-colors">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
