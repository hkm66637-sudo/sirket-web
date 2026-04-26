"use client";

import React, { useEffect, useState } from "react";
import { ProductionService, Machine } from "@/services/production-service";
import { useAuth } from "@/context/auth-context";
import { Truck, Plus, Search, Edit2, Trash2, CheckCircle2, AlertTriangle, Settings2 } from "lucide-react";

export default function MachinesPage() {
  const { profile } = useAuth();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Machine>>({
    name: "",
    code: "",
    capacity_units_per_hour: 10,
    status: "active",
    description: "",
    last_maintenance_date: ""
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
          return;
        }
        const data = await ProductionService.getMachines(profile.company_id);
        console.log("Page data:", data);
        if (isMounted) {
          setMachines(data || []);
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
      const data = await ProductionService.getMachines(profile.company_id);
      setMachines(data || []);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return;
    try {
      if (editingId) {
        await ProductionService.updateMachine(editingId, formData);
      } else {
        await ProductionService.createMachine({ ...formData, company_id: profile.company_id } as Machine);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert("Hata: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Makineyi silmek istediğinize emin misiniz? (Bu makineye ait eski loglar bozulabilir)")) return;
    try {
      await ProductionService.deleteMachine(id);
      loadData();
    } catch (err: any) {
      alert("Hata: " + err.message);
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setFormData({ name: "", code: "", capacity_units_per_hour: 10, status: "active", description: "", last_maintenance_date: "" });
    setIsModalOpen(true);
  };

  const openEdit = (m: Machine) => {
    setEditingId(m.id);
    setFormData({ ...m, last_maintenance_date: m.last_maintenance_date || "" });
    setIsModalOpen(true);
  };

  const filtered = machines.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.code.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <div className="p-8 text-slate-500 font-bold animate-pulse text-center mt-20">Yükleniyor...</div>;
  if (error) return <div className="p-8 text-red-500 font-bold text-center mt-20">{error}</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Settings2 className="w-6 h-6 text-blue-600" /> Makine Parkuru
          </h1>
          <p className="text-slate-500 text-xs font-medium mt-1">Üretim istasyonlarını ve bakım süreçlerini yönetin.</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 text-white text-xs font-bold px-5 py-3 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-colors">
          <Plus className="w-4 h-4" /> Yeni Makine
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden p-6">
        <div className="relative max-w-sm mb-6">
          <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Makine Kodu veya Adı..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4 rounded-tl-xl">Kod</th>
                <th className="px-6 py-4">Adı</th>
                <th className="px-6 py-4">Kapasite (Adet/Saat)</th>
                <th className="px-6 py-4">Son Bakım</th>
                <th className="px-6 py-4">Durum</th>
                <th className="px-6 py-4 text-right rounded-tr-xl">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700 text-xs font-medium">
              {filtered.map(m => (
                <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-black text-slate-900">{m.code}</td>
                  <td className="px-6 py-4 font-bold">{m.name}</td>
                  <td className="px-6 py-4">{m.capacity_units_per_hour} / S</td>
                  <td className="px-6 py-4 text-slate-400">{m.last_maintenance_date || "-"}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
                      m.status === "active" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                      m.status === "maintenance" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                      "bg-red-50 text-red-600 border border-red-100"
                    }`}>
                      {m.status === "active" ? "Aktif" : m.status === "maintenance" ? "Bakımda" : "Arızalı"}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex justify-end gap-2">
                    <button onClick={() => openEdit(m)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(m.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 font-semibold">Makine kaydı bulunamadı.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full border border-slate-100 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-xl font-extrabold text-slate-900 mb-6">{editingId ? "Makine Düzenle" : "Yeni Makine"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">MAKİNE KODU</label>
                  <input type="text" value={formData.code || ""} onChange={e => setFormData({ ...formData, code: e.target.value })} required className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" placeholder="Örn: MKN-01" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">MAKİNE ADI</label>
                  <input type="text" value={formData.name || ""} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" placeholder="Örn: CNC Torna" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">KAPASİTE (Adet/Saat)</label>
                  <input type="number" step="0.01" value={formData.capacity_units_per_hour || 0} onChange={e => setFormData({ ...formData, capacity_units_per_hour: parseFloat(e.target.value) })} required className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">DURUM</label>
                  <select value={formData.status || "active"} onChange={e => setFormData({ ...formData, status: e.target.value as any })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100">
                    <option value="active">Aktif</option>
                    <option value="maintenance">Bakımda</option>
                    <option value="broken">Arızalı</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">SON BAKIM TARİHİ</label>
                <input type="date" value={formData.last_maintenance_date || ""} onChange={e => setFormData({ ...formData, last_maintenance_date: e.target.value })} className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100" />
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
