"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import { 
  Plus, 
  Search, 
  Filter, 
  Tag, 
  CheckCircle2, 
  XCircle, 
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  PieChart,
  BarChart3,
  Calendar,
  Building2,
  Bookmark,
  Trash2,
  Edit3,
  Eye,
  ArrowRight,
  Loader2,
  AlertCircle,
  Users,
  Globe,
  Briefcase
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useCompany } from "@/context/company-context";
import Badge from "@/components/ui/badge";
import FormField from "@/components/ui/form-field";
import Select from "@/components/ui/select";
import Input from "@/components/ui/input";
import { 
  PieChart as RePieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as ReTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

const scopeConfig: any = {
  single: { label: "Tek Şirket", icon: <Building2 className="w-3.5 h-3.5" />, color: "text-blue-600", bg: "bg-blue-50" },
  multiple: { label: "Çoklu Şirket", icon: <Users className="w-3.5 h-3.5" />, color: "text-indigo-600", bg: "bg-indigo-50" },
  all: { label: "Tüm Şirketler", icon: <Globe className="w-3.5 h-3.5" />, color: "text-green-600", bg: "bg-green-50" },
  common: { label: "Ortak Genel", icon: <Briefcase className="w-3.5 h-3.5" />, color: "text-orange-600", bg: "bg-orange-50" },
};

export default function CategoryManagementPage() {
  const { profile } = useAuth();
  const { selectedCompanyId, companies } = useCompany();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "gelir" | "gider">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "passive">("all");
  const [scopeFilter, setScopeFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const [stats, setStats] = useState({
    total: 0,
    activeGelir: 0,
    activeGider: 0,
    topCategory: "",
    topExpenseThisMonth: { name: "", amount: 0 },
    topIncomeThisMonth: { name: "", amount: 0 }
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch categories with their scope and linked companies
      let catQuery = supabase
        .from("finance_categories")
        .select("*, category_companies(company_id)");
      
      if (typeFilter !== "all") catQuery = catQuery.eq("type", typeFilter);
      if (statusFilter === "active") catQuery = catQuery.eq("is_active", true);
      if (statusFilter === "passive") catQuery = catQuery.eq("is_active", false);
      if (scopeFilter !== "all") catQuery = catQuery.eq("scope", scopeFilter);
      
      const { data: catData, error: catError } = await catQuery.order("name");
      if (catError) throw catError;

      // 2. Fetch transaction summaries
      let recQuery = supabase.from("finance_records").select("category_id, type, amount, date, status, company_id");
      
      if (companyFilter !== "all") recQuery = recQuery.eq("company_id", companyFilter);
      else if (selectedCompanyId !== "ALL") recQuery = recQuery.eq("company_id", selectedCompanyId);

      const { data: recData, error: recError } = await recQuery;
      if (recError) throw recError;

      // 3. Process data
      const processed = (catData || []).map(cat => {
        const catRecs = (recData || []).filter(r => r.category_id === cat.id);
        const totalAmount = catRecs.reduce((sum, r) => sum + Number(r.amount), 0);
        const lastDate = catRecs.length > 0 ? catRecs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date : null;
        
        // Map linked company IDs to names
        const linkedCompanyIds = cat.category_companies?.map((cc: any) => cc.company_id) || [];
        const linkedCompanies = companies.filter(c => 
          cat.scope === 'single' ? c.id === cat.company_id : linkedCompanyIds.includes(c.id)
        );

        return {
          ...cat,
          transactionCount: catRecs.length,
          totalAmount,
          lastTransactionDate: lastDate,
          linkedCompanies
        };
      });

      // Filter by company in memory if needed for complex scopes
      let finalData = processed;
      if (companyFilter !== "all") {
        finalData = processed.filter(cat => {
          if (cat.scope === 'all' || cat.scope === 'common') return true;
          if (cat.scope === 'single' && cat.company_id === companyFilter) return true;
          if (cat.scope === 'multiple' && cat.category_companies.some((cc: any) => cc.company_id === companyFilter)) return true;
          return false;
        });
      }

      setCategories(finalData);

      // Stats calculation
      const gelirCats = finalData.filter(c => c.type === "gelir" && c.is_active);
      const giderCats = finalData.filter(c => c.type === "gider" && c.is_active);
      const topCat = [...finalData].sort((a,b) => b.transactionCount - a.transactionCount)[0]?.name || "-";
      
      const now = new Date();
      const thisMonthRecs = (recData || []).filter(r => {
        const d = new Date(r.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });

      const catGrouped = thisMonthRecs.reduce((acc: any, r) => {
        if (!acc[r.category_id]) acc[r.category_id] = { amount: 0, type: r.type };
        acc[r.category_id].amount += Number(r.amount);
        return acc;
      }, {});

      let topExp = { name: "-", amount: 0 };
      let topInc = { name: "-", amount: 0 };

      Object.keys(catGrouped).forEach(id => {
        const cat = processed.find(c => c.id === id);
        if (!cat) return;
        if (cat.type === "gider" && catGrouped[id].amount > topExp.amount) {
          topExp = { name: cat.name, amount: catGrouped[id].amount };
        }
        if (cat.type === "gelir" && catGrouped[id].amount > topInc.amount) {
          topInc = { name: cat.name, amount: catGrouped[id].amount };
        }
      });

      setStats({
        total: finalData.length,
        activeGelir: gelirCats.length,
        activeGider: giderCats.length,
        topCategory: topCat,
        topExpenseThisMonth: topExp,
        topIncomeThisMonth: topInc
      });

    } catch (err) {
      console.error("Fetch categories error:", err);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, scopeFilter, companyFilter, selectedCompanyId, companies]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleCategoryStatus = async (cat: any) => {
    try {
      const { error } = await supabase
        .from("finance_categories")
        .update({ is_active: !cat.is_active })
        .eq("id", cat.id);
      
      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error("Toggle status error:", err);
    }
  };

  const deleteCategory = async (id: string) => {
    const cat = categories.find(c => c.id === id);
    if (cat?.transactionCount > 0) {
      alert("Bu kategoriye ait işlem kayıtları bulunduğu için silemezsiniz. Bunun yerine pasif yapabilirsiniz.");
      setShowDeleteConfirm(null);
      return;
    }

    try {
      const { error } = await supabase
        .from("finance_categories")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      setShowDeleteConfirm(null);
      fetchData();
    } catch (err) {
      console.error("Delete category error:", err);
    }
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">Kategori Yönetimi</h1>
          <p className="text-slate-500 font-bold text-sm mt-1 uppercase tracking-widest">Scoped & Shared Category Management System</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="group flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all hover:bg-blue-600 hover:shadow-2xl hover:shadow-blue-600/30 active:scale-95"
        >
          <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
          Yeni Kategori Ekle
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Toplam Kategori" value={stats.total} icon={<Tag className="w-6 h-6 text-slate-400" />} color="bg-slate-50" />
        <StatCard title="Aktif Gelir / Gider" value={`${stats.activeGelir} / ${stats.activeGider}`} icon={<div className="flex gap-1"><TrendingUp className="w-4 h-4 text-green-500"/><TrendingDown className="w-4 h-4 text-red-500"/></div>} color="bg-blue-50/50" />
        <StatCard title="En Çok Kullanılan" value={stats.topCategory} icon={<ArrowRight className="w-6 h-6 text-orange-500" />} color="bg-orange-50/50" />
        <StatCard title="Ayın En Yüksek Gideri" value={formatCurrency(stats.topExpenseThisMonth.amount)} subtitle={stats.topExpenseThisMonth.name} icon={<TrendingDown className="w-6 h-6 text-red-500" />} color="bg-red-50/30" />
      </div>

      {/* Main Content */}
      <div className="glass-card overflow-hidden">
        <div className="p-8 border-b border-slate-50 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="relative lg:col-span-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Kategori adı ile ara..." 
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="lg:col-span-8 flex flex-wrap items-center gap-3 justify-end">
              <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)} className="font-bold text-xs min-w-[120px]">
                <option value="all">Türler</option>
                <option value="gelir">Gelir</option>
                <option value="gider">Gider</option>
              </Select>

              <Select value={scopeFilter} onChange={(e) => setScopeFilter(e.target.value)} className="font-bold text-xs min-w-[130px]">
                <option value="all">Tüm Kapsamlar</option>
                <option value="single">Tek Şirket</option>
                <option value="multiple">Çoklu Şirket</option>
                <option value="all">Genel (Tüm)</option>
                <option value="common">Ortak Genel</option>
              </Select>

              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="font-bold text-xs min-w-[120px]">
                <option value="all">Durumlar</option>
                <option value="active">Aktif</option>
                <option value="passive">Pasif</option>
              </Select>

              <Select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} className="font-bold text-xs min-w-[160px]">
                <option value="all">Şirket Filtresi</option>
                {companies.map((c: any) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
              </Select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori & Kapsam</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tür</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Kullanım</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Toplam Tutar</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Durum</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">Yükleniyor...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredCategories.length > 0 ? (
                filteredCategories.map((cat) => (
                  <tr key={cat.id} className="group hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => setSelectedCategory(cat)}>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100",
                          cat.type === 'gelir' ? "bg-green-50" : "bg-red-50"
                        )}>
                          <Tag className={cn("w-5 h-5", cat.type === 'gelir' ? "text-green-600" : "text-red-600")} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 tracking-tight">{cat.name}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className={cn(
                              "flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest",
                              scopeConfig[cat.scope]?.bg,
                              scopeConfig[cat.scope]?.color
                            )}>
                              {scopeConfig[cat.scope]?.icon}
                              {scopeConfig[cat.scope]?.label}
                            </span>
                            {cat.linkedCompanies.length > 0 && (
                              <span className="text-[9px] font-bold text-slate-400 uppercase truncate max-w-[150px]">
                                • {cat.linkedCompanies.map((c: any) => c.company_name).join(", ")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <Badge variant={cat.type === 'gelir' ? 'success' : 'danger'}>
                        {cat.type === 'gelir' ? 'GELİR' : 'GİDER'}
                      </Badge>
                    </td>
                    <td className="px-8 py-6 text-right font-mono font-black text-slate-600 text-sm italic">
                      {cat.transactionCount}
                    </td>
                    <td className="px-8 py-6 text-right font-mono font-black text-slate-900 text-sm">
                      {formatCurrency(cat.totalAmount)}
                    </td>
                    <td className="px-8 py-6 text-center">
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleCategoryStatus(cat); }}
                        className={cn(
                          "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                          cat.is_active ? "bg-green-50 text-green-600 border border-green-100 hover:bg-green-100" : "bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200"
                        )}
                      >
                        {cat.is_active ? 'AKTİF' : 'PASİF'}
                      </button>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={(e) => { e.stopPropagation(); setEditingCategory(cat); }} className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(cat.id); }} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-slate-400 font-bold uppercase text-xs">Sonuç Bulunamadı</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedCategory && (
        <CategoryDetailPanel category={selectedCategory} onClose={() => setSelectedCategory(null)} selectedCompanyId={selectedCompanyId} />
      )}

      {(isAddModalOpen || editingCategory) && (
        <CategoryModal 
          isOpen={isAddModalOpen || !!editingCategory} 
          category={editingCategory} 
          onClose={() => { setIsAddModalOpen(false); setEditingCategory(null); }}
          onSuccess={() => fetchData()}
          companies={companies}
        />
      )}

      {showDeleteConfirm && (
        <DeleteConfirmDialog id={showDeleteConfirm} categories={categories} onCancel={() => setShowDeleteConfirm(null)} onConfirm={deleteCategory} />
      )}
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, color }: any) {
  return (
    <div className={cn("p-8 rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:shadow-slate-200/40 group", color)}>
      <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 group-hover:scale-110 transition-transform inline-block mb-4">
        {icon}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-2xl font-black text-slate-900 tracking-tight italic">{value}</h3>
        {subtitle && <span className="text-[10px] font-bold text-slate-500 uppercase">{subtitle}</span>}
      </div>
    </div>
  );
}

function CategoryModal({ isOpen, category, onClose, onSuccess, companies }: any) {
  const [formData, setFormData] = useState({
    name: category?.name || "",
    type: category?.type || "gider",
    description: category?.description || "",
    scope: category?.scope || "all",
    company_id: category?.company_id || "",
    linked_companies: category?.category_companies?.map((cc: any) => cc.company_id) || [],
    is_active: category?.is_active ?? true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return setError("Kategori adı zorunludur.");
    if (formData.scope === 'single' && !formData.company_id) return setError("Lütfen bir şirket seçin.");
    if (formData.scope === 'multiple' && formData.linked_companies.length === 0) return setError("En az bir şirket seçmelisiniz.");
    
    setLoading(true);
    try {
      const payload: any = {
        name: formData.name.trim(),
        type: formData.type,
        description: formData.description.trim(),
        scope: formData.scope,
        company_id: formData.scope === 'single' ? formData.company_id : null,
        is_active: formData.is_active
      };

      let categoryId = category?.id;

      if (category) {
        const { error: updateError } = await supabase.from("finance_categories").update(payload).eq("id", category.id);
        if (updateError) throw updateError;
      } else {
        const { data: insertData, error: insertError } = await supabase.from("finance_categories").insert([payload]).select().single();
        if (insertError) throw insertError;
        categoryId = insertData.id;
      }

      // Handle multiple company links
      await supabase.from("category_companies").delete().eq("category_id", categoryId);
      
      if (formData.scope === 'multiple' && formData.linked_companies.length > 0) {
        const companyLinks = formData.linked_companies.map((cid: string) => ({ category_id: categoryId, company_id: cid }));
        const { error: linkError } = await supabase.from("category_companies").insert(companyLinks);
        if (linkError) throw linkError;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleCompany = (id: string) => {
    setFormData(prev => ({
      ...prev,
      linked_companies: prev.linked_companies.includes(id)
        ? prev.linked_companies.filter((cid: string) => cid !== id)
        : [...prev.linked_companies, id]
    }));
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <div className="p-10 overflow-y-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight italic">{category ? 'Kategori Düzenle' : 'Yeni Kategori'}</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><XCircle className="w-6 h-6 text-slate-400" /></button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <FormField label="Kategori Adı">
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="font-bold" />
              </FormField>
              <FormField label="Tür">
                <Select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value as any})} className="font-bold">
                  <option value="gelir">Gelir</option>
                  <option value="gider">Gider</option>
                </Select>
              </FormField>
            </div>

            <FormField label="Kategori Kapsamı (Ownership)">
              <div className="grid grid-cols-2 gap-3 mt-2">
                {Object.entries(scopeConfig).map(([key, config]: any) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFormData({...formData, scope: key as any})}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left",
                      formData.scope === key 
                        ? "border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-100" 
                        : "border-slate-100 hover:border-slate-200"
                    )}
                  >
                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", formData.scope === key ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500")}>
                      {config.icon}
                    </div>
                    <div>
                      <p className={cn("text-[10px] font-black uppercase tracking-widest", formData.scope === key ? "text-blue-700" : "text-slate-500")}>{config.label}</p>
                      <p className="text-[9px] font-bold text-slate-400 mt-0.5 leading-none">
                        {key === 'single' ? 'Tek bir şirkete özel' : 
                         key === 'multiple' ? 'Seçili şirketlerde ortak' : 
                         key === 'all' ? 'Tüm şirketlerde genel' : 'Genel ortak kalem'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </FormField>

            {formData.scope === 'single' && (
              <FormField label="İlgili Şirketi Seçin">
                <Select value={formData.company_id} onChange={(e) => setFormData({...formData, company_id: e.target.value})} className="font-bold">
                  <option value="">Şirket Seçiniz...</option>
                  {companies.map((c: any) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </Select>
              </FormField>
            )}

            {formData.scope === 'multiple' && (
              <FormField label="Kullanılacak Şirketleri Seçin">
                <div className="grid grid-cols-2 gap-2 mt-2 bg-slate-50 p-4 rounded-2xl border border-slate-100 max-h-40 overflow-y-auto custom-scrollbar">
                  {companies.map((c: any) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCompany(c.id)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all",
                        formData.linked_companies.includes(c.id) ? "bg-indigo-600 text-white" : "bg-white text-slate-500 border border-slate-200 hover:border-indigo-300"
                      )}
                    >
                      {formData.linked_companies.includes(c.id) ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-slate-300" />}
                      {c.company_name}
                    </button>
                  ))}
                </div>
              </FormField>
            )}

            <FormField label="Açıklama">
              <Input placeholder="Kullanım alanı özeti..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="text-sm font-medium" />
            </FormField>

            {error && <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-[10px] font-black uppercase tracking-widest animate-pulse"><AlertCircle className="w-5 h-5" />{error}</div>}

            <div className="flex gap-4 pt-4">
              <button type="button" onClick={onClose} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors">Vazgeç</button>
              <button type="submit" disabled={loading} className="flex-[2] primary py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : category ? 'Güncellemeyi Kaydet' : 'Kategoriyi Oluştur'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function CategoryDetailPanel({ category, onClose, selectedCompanyId }: any) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState<any[]>([]);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        let query = supabase.from("finance_records").select("*, banks(banka_adi), profiles(full_name), companies(company_name)").eq("category_id", category.id).order("date", { ascending: false });
        if (selectedCompanyId !== "ALL") query = query.eq("company_id", selectedCompanyId);
        const { data, error } = await query.limit(50);
        if (error) throw error;
        setTransactions(data || []);
        
        // Performance logic here (similar to before but grouped by company if all/common)
        const months = Array.from({length: 6}, (_, i) => {
          const d = new Date(); d.setMonth(d.getMonth() - i);
          return { name: d.toLocaleDateString('tr-TR', { month: 'short' }), amount: 0, key: `${d.getFullYear()}-${d.getMonth() + 1}` };
        }).reverse();
        
        (data || []).forEach(r => {
          const d = new Date(r.date);
          const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
          const m = months.find(m => m.key === key);
          if (m) m.amount += Number(r.amount);
        });
        setPerformance(months);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchDetail();
  }, [category.id, selectedCompanyId]);

  return (
    <div className="fixed inset-y-0 right-0 z-[150] w-full max-w-2xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      <div className="p-10 flex-none bg-slate-900 text-white">
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center gap-4">
            <div className={cn("w-16 h-16 rounded-[1.8rem] flex items-center justify-center border", category.type === 'gelir' ? "bg-green-600/20 border-green-500/50" : "bg-red-600/20 border-red-500/50")}>
              <Tag className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black italic tracking-tight">{category.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={category.type === 'gelir' ? 'success' : 'danger'}>{category.type === 'gelir' ? 'GELİR' : 'GİDER'}</Badge>
                <span className={cn("px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest", scopeConfig[category.scope]?.bg, scopeConfig[category.scope]?.color)}>
                  {scopeConfig[category.scope]?.label}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"><XCircle className="w-6 h-6" /></button>
        </div>
        <div className="grid grid-cols-2 gap-8 pt-4">
          <div><p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Toplam İşlem</p><p className="text-2xl font-black italic">{category.transactionCount}</p></div>
          <div><p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Kümülatif Tutar</p><p className="text-3xl font-black italic">{formatCurrency(category.totalAmount)}</p></div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
        <section>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-blue-500" /> Performans Trendi</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performance}>
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {performance.map((entry, index) => <Cell key={`cell-${index}`} fill={index === performance.length - 1 ? '#3b82f6' : '#e2e8f0'} />)}
                </Bar>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'bold' }} />
                <ReTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '0.8rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 'bold', fontSize: '10px' }} formatter={(val: any) => formatCurrency(val)} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="space-y-6">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">İşlem Geçmişi (Son 50)</h3>
          <div className="space-y-4">
            {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div> : transactions.map(t => (
              <div key={t.id} className="p-5 rounded-2xl border border-slate-100 flex justify-between items-center group hover:bg-slate-50 transition-colors">
                <div className="flex gap-4">
                  <div className="p-2 bg-slate-100 rounded-xl"><Calendar className="w-4 h-4 text-slate-400" /></div>
                  <div>
                    <p className="text-[11px] font-black text-slate-900 tracking-tight">{t.description || 'Açıklama yok'}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase mt-1">{new Date(t.date).toLocaleDateString('tr-TR')} • <span className="text-blue-600">{t.companies?.company_name}</span></p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900 italic">{formatCurrency(t.amount)}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">{t.payment_method}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function DeleteConfirmDialog({ id, categories, onCancel, onConfirm }: any) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white w-full max-w-sm p-10 rounded-[2.5rem] shadow-2xl text-center flex flex-col items-center gap-6 animate-in zoom-in-95 duration-200">
        <div className="w-20 h-20 bg-red-50 rounded-[2.5rem] flex items-center justify-center"><Trash2 className="w-10 h-10 text-red-600" /></div>
        <div>
          <h3 className="text-xl font-black text-slate-900 italic tracking-tight">Kategoriyi Sil?</h3>
          <p className="text-xs text-slate-500 font-bold mt-2 leading-relaxed">Bağlı işlemler varsa silme yapılamaz, sadece pasif yapılabilir.</p>
        </div>
        <div className="flex gap-4 w-full pt-2">
          <button onClick={onCancel} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest">Vazgeç</button>
          <button onClick={() => onConfirm(id)} className="flex-1 py-4 bg-red-600 text-white rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-600/20">Evet, Sil</button>
        </div>
      </div>
    </div>
  );
}
