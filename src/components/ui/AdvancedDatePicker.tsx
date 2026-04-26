"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Check,
  Clock,
  CalendarDays,
  CalendarRange,
  ChevronDown,
  X
} from "lucide-react";
import { 
  format, 
  addDays, 
  subDays, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isSameWeek,
  addMonths,
  subMonths,
  addYears,
  subYears,
  getYear,
  getMonth
} from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DateRange {
  startDate: Date;
  endDate: Date;
  label: string;
}

interface AdvancedDatePickerProps {
  onApply: (range: DateRange) => void;
  initialRange?: DateRange;
  align?: "left" | "right";
}

type FilterMode = "7days" | "30days" | "range" | "day" | "week" | "month" | "year";

export default function AdvancedDatePicker({ onApply, initialRange, align = "left" }: AdvancedDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<FilterMode>("month");
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tempRange, setTempRange] = useState<{ start: Date | null, end: Date | null }>({
    start: initialRange?.startDate || null,
    end: initialRange?.endDate || null
  });
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleApply = () => {
    let range: DateRange;
    const now = new Date();

    switch (mode) {
      case "7days":
        range = {
          startDate: subDays(now, 7),
          endDate: now,
          label: "Son 7 Gün"
        };
        break;
      case "30days":
        range = {
          startDate: subDays(now, 30),
          endDate: now,
          label: "Son 30 Gün"
        };
        break;
      case "day":
        range = {
          startDate: selectedDate,
          endDate: selectedDate,
          label: format(selectedDate, "d MMMM yyyy", { locale: tr })
        };
        break;
      case "week":
        const sWeek = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const eWeek = endOfWeek(selectedDate, { weekStartsOn: 1 });
        range = {
          startDate: sWeek,
          endDate: eWeek,
          label: `${format(sWeek, "d MMM")} - ${format(eWeek, "d MMM yyyy")}`
        };
        break;
      case "month":
        const sMonth = startOfMonth(selectedDate);
        const eMonth = endOfMonth(selectedDate);
        range = {
          startDate: sMonth,
          endDate: eMonth,
          label: format(selectedDate, "MMMM yyyy", { locale: tr })
        };
        break;
      case "year":
        const sYear = startOfYear(selectedDate);
        const eYear = endOfYear(selectedDate);
        range = {
          startDate: sYear,
          endDate: eYear,
          label: format(selectedDate, "yyyy")
        };
        break;
      case "range":
        if (tempRange.start && tempRange.end) {
          range = {
            startDate: tempRange.start,
            endDate: tempRange.end,
            label: `${format(tempRange.start, "d MMM")} - ${format(tempRange.end, "d MMM yyyy")}`
          };
        } else {
          return;
        }
        break;
      default:
        return;
    }

    onApply(range);
    setIsOpen(false);
  };

  const renderMonthPicker = () => {
    const months = [
      "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
      "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
    ];

    return (
      <div className="grid grid-cols-3 gap-2">
        {months.map((m, i) => (
          <button
            key={m}
            onClick={() => {
              const d = new Date(selectedDate);
              d.setMonth(i);
              setSelectedDate(d);
            }}
            className={cn(
              "py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
              selectedDate.getMonth() === i 
                ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20" 
                : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"
            )}
          >
            {m}
          </button>
        ))}
      </div>
    );
  };

  const renderYearPicker = () => {
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 5; i <= currentYear + 1; i++) {
      years.push(i);
    }

    return (
      <div className="grid grid-cols-3 gap-2">
        {years.map(y => (
          <button
            key={y}
            onClick={() => {
              const d = new Date(selectedDate);
              d.setFullYear(y);
              setSelectedDate(d);
            }}
            className={cn(
              "py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
              selectedDate.getFullYear() === y 
                ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20" 
                : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"
            )}
          >
            {y}
          </button>
        ))}
      </div>
    );
  };

  const renderCalendar = () => {
    const start = startOfMonth(viewDate);
    const end = endOfMonth(viewDate);
    const days = eachDayOfInterval({ start, end });
    
    // Fill empty days at start
    const emptyStart = [];
    const firstDay = start.getDay(); // 0 is Sunday
    const offset = firstDay === 0 ? 6 : firstDay - 1; // Adjust for Mon-Sun
    for (let i = 0; i < offset; i++) emptyStart.push(i);

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-2">
          <button onClick={() => setViewDate(subMonths(viewDate, 1))} className="p-1 hover:bg-slate-700 rounded text-slate-400">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[10px] font-black text-white uppercase tracking-widest">
            {format(viewDate, "MMMM yyyy", { locale: tr })}
          </span>
          <button onClick={() => setViewDate(addMonths(viewDate, 1))} className="p-1 hover:bg-slate-700 rounded text-slate-400">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 text-center">
          {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map(d => (
            <div key={d} className="text-[8px] font-black text-slate-500 uppercase pb-1">{d}</div>
          ))}
          {emptyStart.map(i => <div key={`empty-${i}`} />)}
          {days.map(d => {
            const isSelected = isSameDay(d, selectedDate);
            const isToday = isSameDay(d, new Date());
            const isInRange = mode === "range" && tempRange.start && tempRange.end && d >= tempRange.start && d <= tempRange.end;
            const isRangeStart = mode === "range" && tempRange.start && isSameDay(d, tempRange.start);
            const isRangeEnd = mode === "range" && tempRange.end && isSameDay(d, tempRange.end);
            const isInSelectedWeek = mode === "week" && isSameWeek(d, selectedDate, { weekStartsOn: 1 });

            return (
              <button
                key={d.toISOString()}
                onClick={() => {
                  if (mode === "range") {
                    if (!tempRange.start || (tempRange.start && tempRange.end)) {
                      setTempRange({ start: d, end: null });
                    } else {
                      if (d < tempRange.start) {
                        setTempRange({ start: d, end: tempRange.start });
                      } else {
                        setTempRange({ ...tempRange, end: d });
                      }
                    }
                  } else {
                    setSelectedDate(d);
                  }
                }}
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all",
                  (isSelected && mode !== "week") || isRangeStart || isRangeEnd || (mode === "week" && (isSameDay(d, startOfWeek(selectedDate, { weekStartsOn: 1 })) || isSameDay(d, endOfWeek(selectedDate, { weekStartsOn: 1 }))))
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : (isInRange || isInSelectedWeek)
                    ? "bg-blue-600/20 text-blue-400"
                    : isToday
                    ? "border border-blue-500 text-blue-500"
                    : "text-slate-400 hover:bg-slate-700"
                )}
              >
                {format(d, "d")}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const modes: { id: FilterMode; label: string; icon: any }[] = [
    { id: "7days", label: "Son 7 Gün", icon: Clock },
    { id: "30days", label: "Son 30 Gün", icon: Clock },
    { id: "range", label: "Tarih Aralığı", icon: CalendarRange },
    { id: "day", label: "Gün", icon: CalendarIcon },
    { id: "week", label: "Hafta", icon: CalendarDays },
    { id: "month", label: "Ay", icon: CalendarDays },
    { id: "year", label: "Yıl", icon: CalendarIcon },
  ];

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-11 px-4 bg-slate-800 border border-slate-700 text-white rounded-xl flex items-center justify-between hover:border-slate-600 transition-all text-xs font-medium"
      >
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-blue-500" />
          <span className="truncate">{initialRange?.label || "Tarih Seçiniz"}</span>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-slate-500 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className={cn(
          "absolute top-12 z-[999]",
          align === "left" ? "left-0" : "right-0",
          "bg-slate-900 border border-slate-700 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col sm:flex-row",
          "w-[calc(100vw-2rem)] sm:w-[480px] max-w-[calc(100vw-2rem)] max-h-[85vh] overflow-y-auto",
          "animate-in fade-in zoom-in-95 duration-200"
        )}>
          {/* Sidebar */}
          <div className="w-full sm:w-40 border-b sm:border-b-0 sm:border-r border-slate-800 bg-slate-900/50 p-4 flex sm:flex-col gap-1 overflow-x-auto sm:overflow-x-visible no-scrollbar">
            <p className="hidden sm:block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-4 px-2">HIZLI SEÇİM</p>
            {modes.map(m => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={cn(
                    "flex-none sm:w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all",
                    mode === m.id 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="whitespace-nowrap">{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Panel */}
          <div className="flex-1 flex flex-col p-6 min-h-[360px]">
            <div className="flex-1">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-4">
                {modes.find(m => m.id === mode)?.label} SEÇİMİ
              </p>
              
              <div className="max-w-full overflow-x-auto">
                {mode === "day" || mode === "week" || mode === "range" ? renderCalendar() : null}
                {mode === "month" ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center mb-2">
                      <button onClick={() => setSelectedDate(subYears(selectedDate, 1))} className="p-1 hover:bg-slate-700 rounded text-slate-400">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">
                        {format(selectedDate, "yyyy")}
                      </span>
                      <button onClick={() => setSelectedDate(addYears(selectedDate, 1))} className="p-1 hover:bg-slate-700 rounded text-slate-400">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    {renderMonthPicker()}
                  </div>
                ) : null}
                {mode === "year" ? renderYearPicker() : null}
                {(mode === "7days" || mode === "30days") && (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-10">
                    <div className="w-16 h-16 bg-blue-600/10 rounded-3xl flex items-center justify-center">
                      <Clock className="w-8 h-8 text-blue-500" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {mode === "7days" ? "Geçmiş 7 günü kapsar" : "Geçmiş 30 günü kapsar"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all"
              >
                Vazgeç
              </button>
              <button
                onClick={handleApply}
                className="flex-[2] py-3 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Uygula
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
