"use client";

import React, { useState, useMemo } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  Plus,
  ArrowRight,
  Target,
  CheckSquare,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  eachDayOfInterval,
  parseISO
} from "date-fns";
import { tr } from "date-fns/locale";
import AddEventModal from "./AddEventModal";
import EditEventModal from "./EditEventModal";
import EditTaskModal from "@/components/tasks/EditTaskModal";

interface Event {
  id: string;
  title: string;
  description?: string;
  type: 'toplanti' | 'gorusme' | 'uretim' | 'finans' | 'tahsilat' | 'task';
  start_at: string;
  isTask?: boolean;
  originalData?: any;
}

interface CalendarViewProps {
  title: string;
  events: Event[];
  type?: 'general' | 'finance';
  onRefresh: () => void;
}

const typeColors: any = {
  toplanti: "bg-blue-600 shadow-blue-600/20",
  gorusme: "bg-purple-600 shadow-purple-600/20",
  uretim: "bg-cyan-600 shadow-cyan-600/20",
  finans: "bg-red-600 shadow-red-600/20",
  tahsilat: "bg-green-600 shadow-green-600/20",
  task: "bg-indigo-900 shadow-indigo-900/30",
};

const typeLabels: any = {
  toplanti: "Toplantı",
  gorusme: "Görüşme",
  uretim: "Üretim",
  finans: "Ödeme",
  tahsilat: "Tahsilat",
  task: "Görev",
};

export default function CalendarView({ title, events, type = 'general', onRefresh }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editingTask, setEditingTask] = useState<any | null>(null);

  // Mükerrer kayıtları ID bazlı temizle
  const uniqueItems = useMemo(() => {
    const map = new Map();
    events.forEach(e => map.set(e.id, e));
    return Array.from(map.values());
  }, [events]);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const haftaGunleri = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

  const selectedDayItems = uniqueItems.filter(e => isSameDay(parseISO(e.start_at), selectedDate));

  const handleItemClick = (item: Event) => {
    if (item.isTask) {
      setEditingTask(item.originalData);
    } else {
      setEditingEvent(item);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="lg:col-span-3 glass-card">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white rounded-t-[2.5rem]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-600/20">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {format(currentDate, "MMMM yyyy", { locale: tr })}
              </h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{title}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/60">
              <button 
                onClick={prevMonth}
                className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-600"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                className="px-6 py-2 text-[10px] font-black text-slate-600 rounded-xl hover:bg-white hover:shadow-sm transition-all uppercase tracking-widest"
                onClick={goToday}
              >
                Bugün
              </button>
              <button 
                onClick={nextMonth}
                className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-600"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="p-6 bg-white/50">
          <div className="grid grid-cols-7 mb-4">
            {haftaGunleri.map(day => (
              <div key={day} className="text-center py-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px bg-slate-200/60 border border-slate-200/60 rounded-[2rem] overflow-hidden shadow-2xl shadow-slate-200/20">
            {calendarDays.map((day, idx) => {
              const dayItems = uniqueItems.filter(e => isSameDay(parseISO(e.start_at), day));
              const isToday = isSameDay(day, new Date());
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, monthStart);

              return (
                <div 
                  key={idx} 
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "min-h-[140px] p-3 transition-all cursor-pointer relative group",
                    isCurrentMonth ? "bg-white" : "bg-slate-50/50",
                    isSelected ? "bg-blue-50/40 ring-2 ring-inset ring-blue-500/20" : "hover:bg-slate-50/80"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className={cn(
                      "text-xs font-black w-8 h-8 flex items-center justify-center rounded-xl transition-all",
                      isToday ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-110" : 
                      isSelected ? "bg-slate-900 text-white" : "text-slate-400"
                    )}>
                      {format(day, "d")}
                    </div>
                    {isCurrentMonth && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedDate(day); setIsAddModalOpen(true); }}
                        className="p-1.5 bg-blue-50 text-blue-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-600 hover:text-white"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-1.5">
                    {dayItems.slice(0, 3).map(item => (
                      <div 
                        key={item.id}
                        onClick={(e) => { e.stopPropagation(); handleItemClick(item); }}
                        className={cn(
                          "px-2 py-1.5 rounded-xl text-[9px] font-black text-white truncate shadow-lg hover:brightness-110 transition-all border border-white/10 flex items-center gap-1",
                          typeColors[item.type]
                        )}
                      >
                        {item.isTask ? <CheckSquare className="w-2.5 h-2.5 shrink-0" /> : <span className="opacity-70">{format(parseISO(item.start_at), "HH:mm")}</span>}
                        <span className="truncate">{item.title}</span>
                      </div>
                    ))}
                    {dayItems.length > 3 && (
                      <div className="text-[9px] font-black text-slate-400 pl-2 uppercase tracking-widest mt-1">
                        + {dayItems.length - 3} Diğer...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sidebar Info */}
      <div className="space-y-8">
        {/* Legend */}
        <div className="glass-card p-8">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 border-b border-slate-100 pb-4">Türler & Etkinlikler</h3>
          <div className="space-y-4">
            {Object.entries(typeColors).filter(([key]) => {
                if (key === 'task') return true;
                if (type === 'general') return ['toplanti', 'gorusme', 'uretim'].includes(key);
                return ['finans', 'tahsilat'].includes(key);
            }).map(([key, color]) => (
              <div key={key} className="flex items-center gap-4 group cursor-default">
                <div className={cn("w-4 h-4 rounded-lg shadow-lg group-hover:scale-125 transition-transform", color as string)} />
                <span className="text-xs font-bold text-slate-700 tracking-tight capitalize">{typeLabels[key]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Day Agenda */}
        <div className="glass-card p-8">
          <div className="flex flex-col mb-8 border-b border-slate-100 pb-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Günün Ajandası</h3>
            <div className="flex items-center justify-between">
              <span className="text-lg font-black text-slate-900 tracking-tight">
                {format(selectedDate, "d MMMM", { locale: tr })}
              </span>
              <div className="p-2 bg-slate-900 text-white rounded-xl text-[10px] font-black">
                {selectedDayItems.length} Kayıt
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {selectedDayItems.length > 0 ? (
              selectedDayItems.map(item => (
                <div 
                    key={item.id} 
                    onClick={() => handleItemClick(item)}
                    className="flex gap-4 relative group cursor-pointer"
                >
                  <div className={cn("w-1 h-full absolute -left-4 top-0 rounded-full transition-all group-hover:w-2", typeColors[item.type])} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      {item.isTask ? <CheckSquare className="w-3 h-3 text-indigo-600" /> : <Clock className="w-3 h-3" />}
                      {item.isTask ? "GÖREV" : format(parseISO(item.start_at), "HH:mm")}
                      <span className="mx-1">•</span>
                      {!item.isTask && typeLabels[item.type]}
                      {item.isTask && (
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[8px]",
                          item.originalData?.priority === "Yüksek" ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-600"
                        )}>
                          {item.originalData?.priority}
                        </span>
                      )}
                    </div>
                    <p className={cn(
                      "text-sm font-black leading-tight transition-colors uppercase italic",
                      item.isTask ? "text-indigo-900 group-hover:text-indigo-600" : "text-slate-800 group-hover:text-blue-600"
                    )}>
                      {item.title}
                    </p>
                    {item.description && <p className="text-[10px] text-slate-400 mt-2 font-medium line-clamp-1">{item.description}</p>}
                    {item.isTask && item.originalData?.status === "Gecikmiş" && (
                        <div className="flex items-center gap-1 mt-2 text-[9px] font-bold text-red-500 uppercase italic animate-pulse">
                            <AlertCircle className="w-3 h-3" /> Tarihi Geçmiş
                        </div>
                    )}
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    <ArrowRight className="w-4 h-4 text-blue-500" />
                  </button>
                </div>
              ))
            ) : (
              <div className="py-12 text-center flex flex-col items-center gap-3">
                <Target className="w-10 h-10 text-slate-100" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bu güne ait kayıt bulunamadı.</p>
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="mt-2 text-[10px] font-black text-blue-600 hover:underline tracking-widest uppercase"
                >
                  Hemen Ekle
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddEventModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={onRefresh}
        selectedDate={selectedDate}
      />
      
      <EditEventModal 
        isOpen={!!editingEvent}
        event={editingEvent}
        onClose={() => setEditingEvent(null)}
        onSuccess={onRefresh}
      />

      {/* Task Edit Modal */}
      <EditTaskModal 
        isOpen={!!editingTask}
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onSuccess={onRefresh}
      />
    </div>
  );
}
