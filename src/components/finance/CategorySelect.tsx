"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, ChevronDown, Check, X, Tag, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

interface Category {
  id: string;
  name: string;
  type: string;
  scope?: string;
  company_id?: string;
  category_companies?: { company_id: string }[];
}

interface CategorySelectProps {
  type: "gelir" | "gider";
  companyId: string;
  value: string; // Category ID or Name
  onSelect: (category: Category) => void;
  className?: string;
}

export default function CategorySelect({
  type,
  companyId,
  value,
  onSelect,
  className
}: CategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number, left: number, width: number, maxHeight: number, direction: 'up' | 'down' }>({ top: 0, left: 0, width: 0, maxHeight: 300, direction: 'down' });
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchCategories = async () => {
    if (!companyId && companyId !== "") {
      setCategories([]);
      return;
    }

    setLoading(true);
    try {
      // Fetch categories with their scope and multi-company relations
      const { data, error } = await supabase
        .from("finance_categories")
        .select("*, category_companies(company_id)")
        .eq("type", type)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;

      // Filter based on scope rules
      const filtered = (data || []).filter(cat => {
        // Special case for COMMON (All Companies / Common) selection in forms
        if (companyId === "COMMON") {
          return cat.scope === 'all' || cat.scope === 'common';
        }

        // 1. All companies scope
        if (cat.scope === 'all') return true;
        
        // 2. Common general scope
        if (cat.scope === 'common') return true;
        
        // 3. Single company scope
        if (cat.scope === 'single' && cat.company_id === companyId) return true;
        
        // 4. Multiple company scope
        if (cat.scope === 'multiple' && cat.category_companies?.some((cc: any) => cc.company_id === companyId)) return true;
        
        // Fallback for old records without scope (treat as 'all' if no company_id, or 'single' if company_id exists)
        if (!cat.scope) {
           if (!cat.company_id) return true;
           return cat.company_id === companyId;
        }

        return false;
      });

      setCategories(filtered);
    } catch (err) {
      console.error("Kategoriler yüklenemedi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [type, companyId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside both the trigger and the portal content
      const isOutsideTrigger = containerRef.current && !containerRef.current.contains(event.target as Node);
      const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(event.target as Node);
      
      if (isOutsideTrigger && isOutsideDropdown) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const updatePosition = () => {
      if (isOpen && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const vh = window.innerHeight;
        const spaceBelow = vh - rect.bottom;
        const spaceAbove = rect.top;
        const margin = 8;
        const preferredMaxHeight = 350;
        
        if (spaceBelow < 250 && spaceAbove > spaceBelow) {
          const actualMaxHeight = Math.min(spaceAbove - margin * 2, preferredMaxHeight);
          setDropdownPos({ top: rect.top - margin, left: rect.left, width: rect.width, maxHeight: actualMaxHeight, direction: 'up' });
        } else {
          const actualMaxHeight = Math.min(spaceBelow - margin * 2, preferredMaxHeight);
          setDropdownPos({ top: rect.bottom + margin, left: rect.left, width: rect.width, maxHeight: actualMaxHeight, direction: 'down' });
        }
      }
    };
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (cat: Category) => {
    onSelect(cat);
    setIsOpen(false);
    setSearch("");
  };

  const handleCreateNew = async () => {
    if (!search.trim() || !companyId) return;
    setIsCreating(true);
    try {
      const normalizedCategory = search.trim();
      const existing = categories.find(c => c.name.toLowerCase() === normalizedCategory.toLowerCase());
      if (existing) {
        handleSelect(existing);
        return;
      }

      // Default new categories created from transaction form are 'single' scope for that company
      const { data, error } = await supabase
        .from("finance_categories")
        .insert([{ 
          name: normalizedCategory, 
          type, 
          scope: 'single',
          company_id: companyId,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;
      const newCat = data as Category;
      setCategories(prev => [...prev, newCat].sort((a,b) => a.name.localeCompare(b.name)));
      handleSelect(newCat);
    } catch (err) {
      console.error("Yeni kategori oluşturulamadı:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const selectedCategory = categories.find(c => c.id === value || c.name === value);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div
        ref={triggerRef}
        className={cn(
          "flex items-center justify-between w-full p-4 bg-white border border-slate-200 rounded-2xl cursor-pointer transition-all hover:border-blue-400",
          isOpen && "border-blue-500 ring-2 ring-blue-100",
          !companyId && "opacity-50 cursor-not-allowed grayscale pointer-events-none"
        )}
        onClick={() => companyId && setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <Tag className={cn("w-4 h-4 shrink-0", type === 'gelir' ? "text-green-500" : "text-red-500")} />
          <span className={cn("text-sm font-bold truncate", !selectedCategory ? "text-slate-400" : "text-slate-900")}>
            {!companyId ? "Önce Şirket Seçin..." : (selectedCategory ? selectedCategory.name : "Kategori Seçin...")}
          </span>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-200", isOpen && "rotate-180")} />
      </div>

      {isOpen && mounted && createPortal(
        <div 
          ref={dropdownRef}
          style={{ position: 'fixed', top: dropdownPos.direction === 'up' ? 'auto' : dropdownPos.top, bottom: dropdownPos.direction === 'up' ? (window.innerHeight - dropdownPos.top) : 'auto', left: dropdownPos.left, width: dropdownPos.width, maxHeight: dropdownPos.maxHeight, zIndex: 9999 }}
          className={cn("bg-white border border-slate-200 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col", dropdownPos.direction === 'down' ? "animate-in fade-in slide-in-from-top-2" : "animate-in fade-in slide-in-from-bottom-2", "duration-200")}
        >
          <div className="p-3 border-b border-slate-50 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input autoFocus type="text" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-100" placeholder="Kategori ara veya ekle..." value={search} onChange={(e) => setSearch(e.target.value)} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => { if (e.key === 'Enter' && search.trim() && filteredCategories.length === 0) { e.preventDefault(); handleCreateNew(); } }} />
              {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full text-slate-400"><X className="w-3 h-3" /></button>}
            </div>
          </div>
          <div className="overflow-y-auto custom-scrollbar flex-1" style={{ maxHeight: dropdownPos.maxHeight - 80 }}>
            {loading && categories.length === 0 ? <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-blue-500 animate-spin" /></div> : (
              <>
                {filteredCategories.map((cat) => (
                  <div key={cat.id} className={cn("flex items-center justify-between px-4 py-3 cursor-pointer transition-colors hover:bg-blue-50 group", (value === cat.id || value === cat.name) && "bg-blue-50")} onClick={(e) => { e.stopPropagation(); handleSelect(cat); }}>
                    <span className={cn("text-xs font-bold", (value === cat.id || value === cat.name) ? "text-blue-700" : "text-slate-600 group-hover:text-blue-600")}>{cat.name}</span>
                    {(value === cat.id || value === cat.name) && <Check className="w-4 h-4 text-blue-600" />}
                  </div>
                ))}
                {search.trim() && !filteredCategories.some(c => c.name.toLowerCase() === search.toLowerCase()) && (
                  <div className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors bg-blue-50/50 hover:bg-blue-50 border-t border-blue-50 group" onClick={(e) => { e.stopPropagation(); handleCreateNew(); }}>
                    <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white">{isCreating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}</div>
                    <div className="flex-1"><p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Yeni Kategori Ekle</p><p className="text-xs font-bold text-slate-900">"{search.trim()}"</p></div>
                  </div>
                )}
                {search && filteredCategories.length === 0 && !isCreating && <div className="px-4 py-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Sonuç bulunamadı.</div>}
                {!search && categories.length === 0 && !loading && <div className="px-4 py-8 text-center text-xs font-bold text-slate-400">Uygun kategori bulunamadı.</div>}
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
