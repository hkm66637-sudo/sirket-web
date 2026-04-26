"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import Badge from "@/components/ui/badge";
import Input from "@/components/ui/input";
import AddTaskModal from "@/components/tasks/AddTaskModal";
import EditTaskModal from "@/components/tasks/EditTaskModal";
import {
  Search, Plus, Filter, Edit3, Trash2, MoreHorizontal, X,
  ChevronLeft, ChevronRight, User as UserIcon, Calendar as CalendarIcon,
  AlertCircle, Copy, Eye, RefreshCw, CheckCheck, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompany } from "@/context/company-context";
import AdvancedDatePicker from "@/components/ui/AdvancedDatePicker";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { tr } from "date-fns/locale";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Toast from "@/components/ui/Toast";
import { createPortal } from "react-dom";

const statusColors: any = {
  "Bekliyor": "default",
  "Devam Ediyor": "info",
  "Gecikmiş": "danger",
  "Tamamlandı": "success",
};
const priorityColors: any = {
  "Yüksek": "danger",
  "Orta": "warning",
  "Düşük": "default",
};

// DeleteConfirmModal removed in favor of common ConfirmDialog

// ---------- Görev İşlem Modalı (Portal) ----------
function TaskActionsModal({
  task,
  canEdit,
  onEdit,
  onDelete,
  onStatusUpdate,
  onDuplicate,
  onClose,
}: {
  task: any;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onStatusUpdate: (status: string) => void;
  onDuplicate: () => void;
  onClose: () => void;
}) {
  const nextStatuses = ["Bekliyor", "Devam Ediyor", "Tamamlandı", "Gecikmiş"].filter(
    (s) => s !== task.status
  );

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">İşlem Menüsü</h3>
            <p className="text-[10px] font-bold text-slate-400 truncate max-w-[200px]">{task.title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-1">
          {canEdit ? (
            <>
              <button
                onClick={() => { onEdit(); onClose(); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <Edit3 className="w-4 h-4" />
                </div>
                Düzenle
              </button>

              <button
                onClick={() => { onDuplicate(); onClose(); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500">
                  <Copy className="w-4 h-4" />
                </div>
                Kopyasını Oluştur
              </button>

              <div className="py-2 px-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Durumu Güncelle</p>
                <div className="grid grid-cols-1 gap-1">
                  {nextStatuses.map((s) => (
                    <button
                      key={s}
                      onClick={() => { onStatusUpdate(s); onClose(); }}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-400" /> {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-slate-100 my-2" />

              <button
                onClick={() => { onDelete(); onClose(); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
                  <Trash2 className="w-4 h-4" />
                </div>
                Görevi Sil
              </button>
            </>
          ) : (
            <div className="py-8 text-center">
              <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-500">Bu görev üzerinde işlem yetkiniz bulunmamaktadır.</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-white border border-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ---------- Ana Sayfa ----------
export default function TasksPage() {
  const { profile, user, loading: authLoading } = useAuth();
  const { selectedCompanyId, loading: companyLoading } = useCompany();

  const [tasks, setTasks] = useState<any[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const [filterMode, setFilterMode] = useState("Tümü");
  const [search, setSearch] = useState("");
  const [queryError, setQueryError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<{ startDate: Date, endDate: Date, label: string }>(() => {
    const now = new Date();
    const s = startOfMonth(now);
    const e = endOfMonth(now);
    return {
      startDate: s,
      endDate: e,
      label: format(now, "MMMM yyyy", { locale: tr })
    };
  });

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editTask, setEditTask] = useState<any | null>(null);
  const [deleteTask, setDeleteTask] = useState<any | null>(null);
  const [actionTask, setActionTask] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null); // Kept for legacy support if needed, but using actionTask now

  // Toast notification
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" | "warning" } | null>(null);
  const showToast = (msg: string, type: "success" | "error" | "info" | "warning" = "success") => {
    setToast({ msg, type });
  };

  // URL'den gelen filtreyi uygula (örn: ?filter=Gecikenler)
  useEffect(() => {
    const filterParam = searchParams.get("filter");
    if (filterParam) {
      const validFilters = ["Tümü", "Bana Atananlar", "Tamamlananlar", "Gecikenler", "Yüksek Öncelikli"];
      const matched = validFilters.find(f => f.toLowerCase() === filterParam.toLowerCase());
      if (matched) {
        setFilterMode(matched);
      }
    }
  }, [searchParams]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setQueryError(null);
    
    try {
      const today = new Date().toISOString().split("T")[0];
      const currentUserId = user?.id;

      let query = supabase
        .from("tasks")
        .select("id, title, description, status, priority, module, assigned_to, created_by, due_date, created_at, company_id");

      // 2. Apply Visibility Scope (Role-based filtering)
      if (profile?.role === "muhasebe_muduru") {
        // Muhasebe Müdürü: Kendisi + Muhasebe Personeli
        const { data: personnel } = await supabase
          .from("profiles")
          .select("id")
          .eq("role", "muhasebe_personeli");
        
        const personnelIds = personnel?.map(p => p.id) || [];
        const allowedIds = [currentUserId, ...personnelIds].filter(Boolean);
        
        if (filterMode === "Bana Atananlar") {
          query = query.eq("assigned_to", currentUserId);
        } else {
          query = query.in("assigned_to", allowedIds);
        }
      } else if (profile?.role === "muhasebe_personeli") {
        // Muhasebe Personeli: Sadece kendisi
        query = query.eq("assigned_to", currentUserId);
      } else if (profile?.role !== "admin" && profile?.role !== "super_admin") {
        // Diğer Personel / Roller: Şimdilik sadece kendisi (veya mevcut mantık)
        if (filterMode === "Bana Atananlar") {
          query = query.eq("assigned_to", currentUserId);
        } else {
          query = query.eq("assigned_to", currentUserId);
        }
      } else {
        // Admin / Super Admin: Tüm görevleri görür (Şirket filtresi aşağıda)
        if (filterMode === "Bana Atananlar") {
          query = query.eq("assigned_to", currentUserId);
        }
      }

      // 3. Apply Company Filter
      if (selectedCompanyId && selectedCompanyId !== "ALL") {
        query = query.eq("company_id", selectedCompanyId);
      }

      // 4. Apply Mode-Specific Filters (within the allowed scope)
      if (filterMode === "Tamamlananlar") {
        query = query.eq("status", "Tamamlandı");
      } else if (filterMode === "Gecikenler") {
        query = query.neq("status", "Tamamlandı").lt("due_date", `${today}T00:00:00`);
      } else if (filterMode === "Yüksek Öncelikli") {
        query = query.eq("priority", "Yüksek");
      }

      // 5. Date Range Filter (on due_date)
      if (dateFilter?.startDate && dateFilter?.endDate) {
        const startDate = dateFilter.startDate.toISOString();
        const endDate = dateFilter.endDate.toISOString();
        query = query.gte("due_date", startDate).lte("due_date", endDate);
      }

      const result = await query.order("created_at", { ascending: false });

      if (result.error) {
         console.error("Tasks fetch error:", {
           message: result.error.message,
           details: result.error.details,
           code: result.error.code,
           raw: String(result.error)
         });
         setQueryError(result.error.message || JSON.stringify(result.error));
      } else {
        setTasks(result.data || []);
      }
    } catch (err: any) {
      console.error("Tasks fetch exception:", err?.message || String(err));
      setQueryError("Sorgu hatası oluştu.");
    } finally {
      setLoading(false);
    }
  }, [filterMode, user, selectedCompanyId, dateFilter]);

  useEffect(() => {
    if (authLoading || companyLoading) return;
    fetchTasks();
  }, [fetchTasks, authLoading, companyLoading]);

  // Profiles
  useEffect(() => {
    const loadProfiles = async () => {
      const { data } = await supabase.from("profiles").select("id, full_name");
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((p) => { map[p.id] = p.full_name; });
        setProfilesMap(map);
      }
    };
    loadProfiles();
  }, []);

  // --- İşlemler ---
  const canEdit = (task: any) => {
    if (!user) return false;
    if (profile?.role === "admin") return true;
    return task.assigned_to === user.id || task.created_by === user.id;
  };

  const handleDelete = async () => {
    if (!deleteTask) return;
    setDeleteLoading(true);
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", deleteTask.id);
      if (error) throw error;
      showToast("Görev başarıyla silindi.", "success");
      fetchTasks();
    } catch (err: any) {
      console.error("Delete error:", err);
      showToast("Görev silinirken bir hata oluştu.", "error");
    } finally {
      setDeleteLoading(false);
      setDeleteTask(null);
    }
  };

  const handleStatusUpdate = async (task: any, newStatus: string) => {
    const { error } = await supabase
      .from("tasks")
      .update({ status: newStatus })
      .eq("id", task.id);
    if (error) {
      showToast("Durum güncellenemedi: " + error.message, "error");
    } else {
      showToast(`Durum "${newStatus}" olarak güncellendi.`);
      // Update local state without fetching all tasks.
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    }
  };

  const handleDuplicate = async (task: any) => {
    const { title, description, module, priority, assigned_to, due_date, company_id, status } = task;
    const { error } = await supabase.from("tasks").insert([{
      title: `${title} (Kopya)`,
      description,
      module,
      priority,
      status: status || "Bekliyor",
      assigned_to: assigned_to || null,
      due_date,
      company_id,
      created_by: user?.id,
    }]);
    if (error) {
      showToast("Kopyalanamadı: " + error.message, "error");
    } else {
      showToast("Görev kopyalandı.");
      fetchTasks();
    }
  };

  const filteredTasks = tasks.filter(
    (t) =>
      (t.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (profilesMap[t.assigned_to] || "").toLowerCase().includes(search.toLowerCase())
  );

  const filters = [
    { label: "Tümü", value: "Tümü" },
    { label: "Bana Atananlar", value: "Bana Atananlar" },
    { label: "Tamamlananlar", value: "Tamamlananlar" },
    { label: "Gecikenler", value: "Gecikenler" },
    { label: "Yüksek Öncelikli", value: "Yüksek Öncelikli" },
  ];

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <Toast 
          message={toast.msg} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      <ConfirmDialog 
        isOpen={!!deleteTask}
        title="Görevi Sil?"
        description={`"${deleteTask?.title}" görevi kalıcı olarak silinecek. Bu işlem geri alınamaz.`}
        variant="danger"
        confirmText="Evet, Sil"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTask(null)}
        loading={deleteLoading}
      />

      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Görev Yönetimi</h1>
          <p className="text-slate-500 text-sm font-medium">Şirket genelindeki tüm operasyonel süreçleri buradan izleyin.</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="primary flex items-center gap-2 px-6">
          <Plus className="w-4 h-4" /> Yeni Görev Tanımla
        </button>
      </div>

      {/* Hata Banner */}
      {queryError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-700 mb-1">Görevler yüklenirken hata oluştu</p>
            <p className="text-xs font-mono text-red-500 break-all">{queryError}</p>
            <button onClick={fetchTasks} className="mt-3 text-xs font-bold text-red-600 underline">Tekrar Dene</button>
          </div>
        </div>
      )}

      <div className="glass-card !overflow-visible relative z-[100]">
        {/* Toolbar */}
        <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-6 bg-slate-50/30">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilterMode(f.value)}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border cursor-pointer",
                  filterMode === f.value
                    ? "bg-slate-900 text-white border-slate-900 shadow-lg"
                    : "bg-white text-slate-500 border-slate-200 hover:border-blue-400 hover:text-blue-600"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="w-64 relative z-[101]">
            <AdvancedDatePicker 
              initialRange={dateFilter}
              onApply={(range) => setDateFilter(range)}
              align="right"
            />
          </div>
          <div className="flex-1 min-w-[260px] max-w-md">
            <Input
              placeholder="Görev adı veya kişi ile ara..."
              icon={<Search className="w-4 h-4" />}
              className="bg-slate-50 border-slate-200 focus:bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Tablo */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="table-header w-[32%]">Görev Adı</th>
                <th className="table-header">Durum</th>
                <th className="table-header">Öncelik</th>
                <th className="table-header">Atanan Kişi</th>
                <th className="table-header">Son Tarih</th>
                <th className="table-header text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-32">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Yükleniyor...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredTasks.length > 0 ? (
                filteredTasks.map((task) => {
                  const editable = canEdit(task);
                  return (
                    <tr key={task.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="table-cell">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                            {task.title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-tight">
                            {task.module} Modülü
                          </span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <Badge variant={statusColors[task.status]}>{task.status || "—"}</Badge>
                      </td>
                      <td className="table-cell">
                        <Badge variant={priorityColors[task.priority]}>{task.priority || "—"}</Badge>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                            <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                          </div>
                          <span className="font-semibold text-slate-700">
                            {task.assigned_to ? (profilesMap[task.assigned_to] || "Bilinmiyor") : "Atanmamış"}
                          </span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className={cn(
                          "flex items-center gap-1.5 font-bold font-mono text-xs",
                          task.status !== "Tamamlandı" && task.due_date && new Date(task.due_date) < new Date()
                            ? "text-red-500" : "text-slate-500"
                        )}>
                          <CalendarIcon className="w-3.5 h-3.5" />
                          {task.due_date ? new Date(task.due_date).toLocaleDateString("tr-TR") : "-"}
                        </div>
                      </td>

                      {/* İşlem Butonları */}
                      <td className="table-cell text-right">
                        <div className="flex justify-end items-center gap-1">
                          {/* Düzenle */}
                          <button
                            onClick={() => editable && setEditTask(task)}
                            title={editable ? "Düzenle" : "Yetki Yok"}
                            className={cn(
                              "p-2 rounded-xl transition-all border border-transparent",
                              editable
                                ? "hover:bg-blue-100 text-blue-500 hover:border-blue-200 cursor-pointer"
                                : "text-slate-200 cursor-not-allowed"
                            )}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Sil */}
                          <button
                            onClick={() => editable && setDeleteTask(task)}
                            title={editable ? "Sil" : "Yetki Yok"}
                            className={cn(
                              "p-2 rounded-xl transition-all border border-transparent",
                              editable
                                ? "hover:bg-red-50 text-red-400 hover:border-red-100 cursor-pointer"
                                : "text-slate-200 cursor-not-allowed"
                            )}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          {/* Üç Nokta - İşlem Modalı Tetikleyici */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActionTask(task);
                              }}
                              className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition-all cursor-pointer"
                              title="İşlemler"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : !queryError ? (
                <tr>
                  <td colSpan={6} className="text-center py-32">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <Filter className="w-8 h-8 opacity-20" />
                      <p className="italic font-medium text-sm">Bu kriterlere uygun görev bulunamadı.</p>
                      {filterMode === "Bana Atananlar" && (
                        <p className="text-xs font-mono text-slate-300">ID: {user?.id?.slice(0, 12)}...</p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex flex-wrap justify-between items-center gap-4 bg-slate-50/30">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Toplam <span className="text-blue-600">{filteredTasks.length}</span> Görev
          </p>
          <div className="flex gap-2">
            <button disabled className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 disabled:opacity-40 flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" /> Önceki
            </button>
            <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
              Sonraki <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modaller */}
      <AddTaskModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchTasks}
      />
      <EditTaskModal
        task={editTask}
        isOpen={!!editTask}
        onClose={() => setEditTask(null)}
        onSuccess={fetchTasks}
      />
      {actionTask && (
        <TaskActionsModal
          task={actionTask}
          canEdit={canEdit(actionTask)}
          onEdit={() => setEditTask(actionTask)}
          onDelete={() => setDeleteTask(actionTask)}
          onStatusUpdate={(s) => handleStatusUpdate(actionTask, s)}
          onDuplicate={() => handleDuplicate(actionTask)}
          onClose={() => setActionTask(null)}
        />
      )}
    </div>
  );
}
