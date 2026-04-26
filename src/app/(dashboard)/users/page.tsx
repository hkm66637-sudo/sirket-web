"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Search, 
  Mail, 
  Shield, 
  MoreVertical,
  Edit2,
  Trash,
  Building2,
  Briefcase,
  User,
  Users,
  AlertCircle,
  X,
  Filter,
  CheckCircle2
} from "lucide-react";
import Badge from "@/components/ui/badge";
import Input from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ROLE_LABELS, DEPARTMENTS, ACCESS_LEVELS } from "@/lib/constants/organization";
import { createSystemUser, updateSystemUser } from "@/app/actions/user-actions";

export default function UserManagementPage() {
  const { profile } = useAuth();
  const router = useRouter();
  
  // States
  const [users, setUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [filterCompany, setFilterCompany] = useState("ALL");
  const [filterDept, setFilterDept] = useState("ALL");
  const [filterRole, setFilterRole] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    role: "uretim_personeli",
    company_id: "",
    department_id: "Üretim",
    manager_id: "",
    access_scope: "self_only",
    status: "active"
  });

  useEffect(() => {
    if (profile && !["admin", "super_admin"].includes(profile.role)) {
      router.push("/");
      return;
    }

    fetchInitialData();
  }, [profile, router]);

  const fetchInitialData = async () => {
    setLoading(true);
    
    try {
      console.log("Fetching initial data...");
      
      // 1. Fetch Companies
      const { data: compData, error: compError } = await supabase
        .from("companies")
        .select("id, company_name")
        .eq("is_active", true);
        
      if (compError) {
        console.error("COMPANIES FETCH ERROR:", {
          message: compError.message,
          details: compError.details,
          hint: compError.hint,
          code: compError.code,
          raw: String(compError)
        });
        // Non-fatal: continue without companies
      }
      const resolvedCompanies = compData || [];
      setCompanies(resolvedCompanies);

      // 2. Fetch Users — NO join, plain columns only
      // The join "companies:company_id (company_name)" fails if the FK alias
      // is not in Supabase schema cache. We resolve company names client-side.
      console.log("Fetching users from profiles table...");
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, status, company_id, department_id, access_scope");
      
      if (userError) {
        console.error("USERS FETCH ERROR:", {
          message: userError.message,
          details: userError.details,
          hint: userError.hint,
          code: userError.code,
          raw: String(userError)
        });
        throw new Error(userError.message || "Kullanıcı verileri çekilemedi");
      }
      
      // 3. Resolve company_name client-side
      const usersWithCompany = (userData || []).map(u => ({
        ...u,
        companies: resolvedCompanies.find(c => c.id === u.company_id) || null
      }));
      
      console.log("Fetched Raw Users successfully:", usersWithCompany.length, "records");
      setUsers(usersWithCompany);
    } catch (err: any) {
      console.error("GENERAL FETCH ERROR:", err?.message ?? String(err));
      setFormError(`Veri yükleme hatası: ${err?.message || "Lütfen sayfayı yenileyin."}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user: any = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        role: user.role || "uretim_personeli",
        company_id: user.company_id || "",
        department_id: user.department_id || "Üretim",
        manager_id: user.manager_id || "",
        access_scope: user.access_scope || "self_only",
        status: user.status || "active"
      });
    } else {
      setEditingUser(null);
      setFormData({
        full_name: "",
        email: "",
        role: "uretim_personeli",
        company_id: companies[0]?.id || "",
        department_id: "Üretim",
        manager_id: "",
        access_scope: "self_only",
        status: "active"
      });
    }
    setFormError(null);
    setIsModalOpen(true);
  };

  // Auto-set Global Access for Admin roles
  useEffect(() => {
    if (["admin", "super_admin"].includes(formData.role)) {
      setFormData(prev => ({
        ...prev,
        access_scope: "global"
      }));
    }
  }, [formData.role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const isGlobalRole = ["admin", "super_admin"].includes(formData.role);

      if (editingUser) {
        // Update User via Server Action
        const result = await updateSystemUser(editingUser.id, formData, profile?.id);
        
        if (!result.success) {
          throw new Error(result.error);
        }
        
        setSuccessMsg("Kullanıcı başarıyla güncellendi.");
      } else {
        // Create User via Server Action
        const result = await createSystemUser(formData, profile?.id);
        
        if (!result.success) {
          throw new Error(result.error);
        }
        
        setSuccessMsg("Kullanıcı başarıyla oluşturuldu. Varsayılan şifre: Sirket123!");
      }
      
      await fetchInitialData();
      setIsModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setFormError(err.message || "Bir hata oluştu.");
    } finally {
      setFormLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = filterCompany === "ALL" || u.company_id === filterCompany;
    const matchesDept = filterDept === "ALL" || u.department_id === filterDept;
    const matchesRole = filterRole === "ALL" || u.role === filterRole;
    const matchesStatus = filterStatus === "ALL" || u.status === filterStatus;
    return matchesSearch && matchesCompany && matchesDept && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700 relative">
      {/* Toast Notification */}
      {successMsg && (
        <div className="fixed top-6 right-6 z-[200] animate-in slide-in-from-top-6 fade-in duration-300">
          <div className="px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm text-white bg-green-600 shadow-green-600/30">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            {successMsg}
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Kullanıcı Yönetimi</h1>
          <p className="text-slate-500 text-sm font-medium">Şirket hiyerarşisini ve personel yetkilerini yapılandırın.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="px-8 py-4 bg-blue-600 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 shadow-xl shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" /> Yeni Kullanıcı Tanımla
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="glass-card p-6 flex flex-wrap items-center gap-4 bg-slate-50/30">
        <div className="flex-1 min-w-[240px]">
          <Input 
            placeholder="İsim veya e-posta ile ara..." 
            icon={<Search className="w-4 h-4" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
           <select 
             value={filterCompany}
             onChange={(e) => setFilterCompany(e.target.value)}
             className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-blue-500 transition-all"
           >
             <option value="ALL">Tüm Şirketler</option>
             {companies.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
           </select>

           <select 
             value={filterDept}
             onChange={(e) => setFilterDept(e.target.value)}
             className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-blue-500 transition-all"
           >
             <option value="ALL">Tüm Birimler</option>
             {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
           </select>

           <select 
             value={filterRole}
             onChange={(e) => setFilterRole(e.target.value)}
             className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-blue-500 transition-all"
           >
             <option value="ALL">Tüm Roller</option>
             {Object.entries(ROLE_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
           </select>

           <select 
             value={filterStatus}
             onChange={(e) => setFilterStatus(e.target.value)}
             className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-blue-500 transition-all"
           >
             <option value="ALL">Durum</option>
             <option value="active">Aktif</option>
             <option value="inactive">Pasif</option>
           </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-card !overflow-visible">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-900">
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Personel</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Şirket / Birim</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Rol / Yetki</th>
                <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Durum</th>
                <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest italic">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-20 text-center"><div className="w-8 h-8 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mx-auto" /></td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-bold italic uppercase tracking-widest">Kayıt Bulunmuyor</td></tr>
              ) : filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-[1.2rem] bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-400 text-sm group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                        {u.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 tracking-tight uppercase italic text-sm">{u.full_name}</p>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mt-0.5">
                          <Mail className="w-3 h-3" />
                          {u.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {["admin", "super_admin"].includes(u.role) ? (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                        <span className="text-[10px] font-black text-purple-700 uppercase italic tracking-widest">Tüm Şirketler / Birimler</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-blue-500" />
                          <span className="text-[11px] font-black text-slate-700 uppercase">{u.companies?.company_name || "-"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-[10px] font-bold text-slate-500 italic">{u.department_id || "-"}</span>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-[9px] font-black uppercase tracking-widest border border-slate-200">
                        <Shield className={cn(
                          "w-3 h-3",
                          ["admin", "super_admin"].includes(u.role) ? "text-purple-500" : "text-blue-500"
                        )} />
                        {ROLE_LABELS[u.role] || u.role}
                      </div>
                      <div className="block text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                        Erişim: <span className="text-blue-500">{u.access_scope || "Kendi Verileri"}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <Badge variant={u.status === "active" ? "success" : "danger"} className="text-[9px] font-black uppercase tracking-widest">
                      {u.status === "active" ? "AKTİF" : "PASİF"}
                    </Badge>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleOpenModal(u)}
                        className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-blue-600 hover:border-blue-100 hover:shadow-lg transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-red-600 hover:border-red-100 hover:shadow-lg transition-all">
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-blue-600 text-white rounded-[1.5rem] shadow-lg shadow-blue-600/20">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase italic">{editingUser ? "Kullanıcıyı Düzenle" : "Yeni Kullanıcı Tanımla"}</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{editingUser ? editingUser.email : "Sistem erişim yetkilerini belirleyin."}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-3 hover:bg-white hover:shadow-lg rounded-2xl transition-all"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {formError && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="p-2 bg-red-100 text-red-600 rounded-xl">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-bold text-red-700 uppercase tracking-tight">{formError}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Basic Info */}
                <div className="space-y-6">
                   <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Temel Bilgiler</p>
                   <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Ad Soyad</label>
                        <Input 
                          value={formData.full_name}
                          onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                          placeholder="Örn: Ahmet Yılmaz"
                          className="bg-slate-50"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">E-posta</label>
                        <Input 
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          placeholder="eposta@sirket.com"
                          className="bg-slate-50"
                          disabled={!!editingUser}
                        />
                      </div>
                   </div>
                </div>

                {/* Organization */}
                <div className="space-y-6">
                   <div className="flex items-center justify-between">
                     <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Organizasyon Yapısı</p>
                     {["admin", "super_admin"].includes(formData.role) && (
                       <Badge variant="success" className="text-[8px] py-0.5">GLOBAL YETKİ</Badge>
                     )}
                   </div>
                   <div className="space-y-4">
                      {["admin", "super_admin"].includes(formData.role) ? (
                        <div className="p-6 bg-purple-50 border border-purple-100 rounded-[2rem] flex flex-col items-center justify-center text-center gap-2 animate-in zoom-in-95 duration-300">
                          <Building2 className="w-8 h-8 text-purple-400" />
                          <p className="text-[10px] font-black text-purple-700 uppercase tracking-tighter leading-tight">
                            BU ROL TÜM ŞİRKETLER VE BİRİMLER ÜZERİNDE TAM YETKİYE SAHİPTİR
                          </p>
                        </div>
                      ) : (
                        <>
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Şirket</label>
                            <select 
                              value={formData.company_id}
                              onChange={(e) => setFormData({...formData, company_id: e.target.value})}
                              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-blue-500 transition-all"
                            >
                              <option value="">Şirket Seçin</option>
                              {companies.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Birim</label>
                            <select 
                              value={formData.department_id}
                              onChange={(e) => setFormData({...formData, department_id: e.target.value})}
                              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-blue-500 transition-all"
                            >
                              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                          </div>
                        </>
                      )}
                   </div>
                </div>

                {/* Roles & Permissions */}
                <div className="space-y-6">
                   <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Yetkilendirme</p>
                   <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Rol</label>
                        <select 
                          value={formData.role}
                          onChange={(e) => setFormData({...formData, role: e.target.value})}
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-blue-500 transition-all"
                        >
                          {Object.entries(ROLE_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Erişim Seviyesi</label>
                        <select 
                          value={formData.access_scope}
                          onChange={(e) => setFormData({...formData, access_scope: e.target.value})}
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-blue-500 transition-all"
                        >
                          {ACCESS_LEVELS.map(al => <option key={al.value} value={al.value}>{al.label}</option>)}
                        </select>
                      </div>
                   </div>
                </div>

                {/* Status & Hierarchy */}
                <div className="space-y-6">
                   <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Durum ve Hiyerarşi</p>
                   <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Bağlı Olduğu Yönetici</label>
                        <select 
                          value={formData.manager_id}
                          onChange={(e) => setFormData({...formData, manager_id: e.target.value})}
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-blue-500 transition-all"
                        >
                          <option value="">Yönetici Seçin</option>
                          {users.filter(u => u.id !== editingUser?.id).map(u => (
                            <option key={u.id} value={u.id}>{u.full_name} ({ROLE_LABELS[u.role] || u.role})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Hesap Durumu</label>
                        <select 
                          value={formData.status}
                          onChange={(e) => setFormData({...formData, status: e.target.value})}
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-blue-500 transition-all"
                        >
                          <option value="active">Aktif</option>
                          <option value="inactive">Pasif / Dondurulmuş</option>
                        </select>
                      </div>
                   </div>
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-[2rem] flex items-start gap-4">
                 <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-1" />
                 <p className="text-[11px] font-bold text-blue-700 leading-relaxed uppercase">
                    Dikkat: Rol ve Erişim seviyesi değişiklikleri kullanıcının sayfaları ve verileri görme yetkisini anında değiştirir. Bu işlemden önce şirket hiyerarşisine uygunluktan emin olun.
                 </p>
              </div>

              <div className="pt-8 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  İptal Et
                </button>
                <button 
                  type="submit"
                  disabled={formLoading}
                  className="flex-[2] py-5 bg-blue-600 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {formLoading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : editingUser ? "Değişiklikleri Kaydet" : "Kullanıcıyı Tanımla"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
