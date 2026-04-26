"use client";

import React, { useEffect, useState, useCallback } from "react";
import CalendarView from "@/components/calendar/CalendarView";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";

export default function FinanceCalendarPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);

  const fetchEvents = React.useCallback(async () => {
    const { data } = await supabase
      .from("calendar_events")
      .select("*")
      .in("type", ["finans", "tahsilat"]);
    
    if (data && data.length > 0) {
      setEvents(data);
    } else {
      setEvents([
        { id: "1", title: "Aras Kargo Ödemesi", type: "finans", start_at: "2026-04-21 12:00:00" },
        { id: "2", title: "Teknosa Tahsilatı", type: "tahsilat", start_at: "2026-04-21 15:00:00" },
        { id: "3", title: "Fatura Ödemesi", type: "finans", start_at: "2026-04-23 12:00:00" },
        { id: "4", title: "Arçelik Tahsilatı", type: "tahsilat", start_at: "2026-04-24 15:00:00" },
        { id: "5", title: "Bordro Ödemesi", type: "finans", start_at: "2026-04-25 09:00:00" },
        { id: "6", title: "Kira Ödemesi", type: "finans", start_at: "2026-04-30 09:00:00" },
      ]);
    }
  }, []);

  useEffect(() => {
    if (profile && profile.role === "operasyon") {
      router.push("/");
      return;
    }
    fetchEvents();
  }, [profile, router, fetchEvents]);

  return <CalendarView title="Finans Takvimi" events={events} type="finance" onRefresh={fetchEvents} />;
}
