"use client";

import React, { useEffect, useState, useCallback } from "react";
import CalendarView from "@/components/calendar/CalendarView";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import { useCompany } from "@/context/company-context";

export default function GeneralCalendarPage() {
  const { user, profile } = useAuth();
  const { selectedCompanyId } = useCompany();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    console.log("📅 Takvim ve Görev verileri birleştiriliyor...");
    
    try {
      // 1. Tasks Çek (Role-Based Visibility)
      let taskQuery = supabase
        .from("tasks")
        .select("id, title, description, status, priority, module, assigned_to, due_date, company_id");
      
      const currentUserId = user.id;

      if (profile?.role === "muhasebe_muduru") {
        // Muhasebe Müdürü: Kendisi + Muhasebe Personeli
        const { data: personnel } = await supabase
          .from("profiles")
          .select("id")
          .eq("role", "muhasebe_personeli");
        
        const personnelIds = personnel?.map(p => p.id) || [];
        const allowedIds = [currentUserId, ...personnelIds].filter(Boolean);
        taskQuery = taskQuery.in("assigned_to", allowedIds);
      } else if (profile?.role === "muhasebe_personeli" || (profile?.role !== "admin" && profile?.role !== "super_admin")) {
        // Personel / Diğer Roller: Sadece kendisi
        taskQuery = taskQuery.eq("assigned_to", currentUserId);
      }
      // Admin / Super Admin: Şirket filtresi haricinde tümünü görür

      if (selectedCompanyId && selectedCompanyId !== "ALL") {
        taskQuery = taskQuery.eq("company_id", selectedCompanyId);
      }

      const { data: tasks, error: taskError } = await taskQuery;
      if (taskError) throw taskError;

      // 2. Mapping to Calendar Format
      // Due date'i olan tüm görevleri takvimde göster
      const mappedTasks = (tasks || []).filter(t => t.due_date).map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        type: 'task', // Unified type
        start_at: t.due_date,
        status: t.status,
        priority: t.priority,
        isTask: true,
        originalData: t
      }));

      console.log(`✅ ${mappedTasks.length} Görev takvime yüklendi.`);
      setItems(mappedTasks);

    } catch (error: any) {
      console.error("❌ Takvim veri çekme hatası:", error);
    } finally {
      setLoading(false);
    }
  }, [user, profile, selectedCompanyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">Takvim ve Görevler Hazırlanıyor...</p>
      </div>
    );
  }

  return (
    <CalendarView 
      title="Genel Takvim & İş Listesi" 
      events={items} 
      type="general" 
      onRefresh={fetchData}
    />
  );
}
