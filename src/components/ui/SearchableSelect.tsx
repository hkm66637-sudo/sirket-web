"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, ChevronDown, Check, X, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  id: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Seçin...",
  disabled = false,
  className
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dropdownPos, setDropdownPos] = useState<{ top: number, left: number, width: number, maxHeight: number, direction: 'up' | 'down' }>({ top: 0, left: 0, width: 0, maxHeight: 300, direction: 'down' });
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const selectedOption = options.find(opt => opt.id === value);
  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isOutsideContainer = containerRef.current && !containerRef.current.contains(event.target as Node);
      const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(event.target as Node);
      
      if (isOutsideContainer && isOutsideDropdown) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

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
          // Show above
          const actualMaxHeight = Math.min(spaceAbove - margin * 2, preferredMaxHeight);
          setDropdownPos({
            top: rect.top - margin,
            left: rect.left,
            width: rect.width,
            maxHeight: actualMaxHeight,
            direction: 'up'
          });
        } else {
          // Show below
          const actualMaxHeight = Math.min(spaceBelow - margin * 2, preferredMaxHeight);
          setDropdownPos({
            top: rect.bottom + margin,
            left: rect.left,
            width: rect.width,
            maxHeight: actualMaxHeight,
            direction: 'down'
          });
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

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div
        ref={triggerRef}
        className={cn(
          "flex items-center justify-between w-full p-4 bg-white border border-slate-200 rounded-2xl cursor-pointer transition-all hover:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100",
          isOpen && "border-blue-500 ring-2 ring-blue-100",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <User className="w-4 h-4 text-slate-400 shrink-0" />
          <span className={cn(
            "text-sm font-bold truncate",
            !selectedOption ? "text-slate-400" : "text-slate-900"
          )}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 text-slate-400 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </div>

      {isOpen && mounted && createPortal(
        <div 
          ref={dropdownRef}
          style={{ 
            position: 'fixed',
            top: dropdownPos.direction === 'up' ? 'auto' : dropdownPos.top,
            bottom: dropdownPos.direction === 'up' ? (window.innerHeight - dropdownPos.top) : 'auto',
            left: dropdownPos.left,
            width: dropdownPos.width,
            maxHeight: dropdownPos.maxHeight,
            zIndex: 9999
          }}
          className={cn(
            "bg-white border border-slate-200 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col",
            dropdownPos.direction === 'down' ? "animate-in fade-in slide-in-from-top-2" : "animate-in fade-in slide-in-from-bottom-2",
            "duration-200"
          )}
        >
          <div className="p-3 border-b border-slate-50 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                autoFocus
                type="text"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-100"
                placeholder="İsim ile ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
              {search && (
                <button 
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full text-slate-400"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
          
          <div 
            className="overflow-y-auto custom-scrollbar flex-1"
            style={{ maxHeight: dropdownPos.maxHeight - 80 }}
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt.id}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 cursor-pointer transition-colors hover:bg-blue-50 group",
                    value === opt.id && "bg-blue-50"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(opt.id);
                  }}
                >
                  <span className={cn(
                    "text-xs font-bold",
                    value === opt.id ? "text-blue-700" : "text-slate-600 group-hover:text-blue-600"
                  )}>
                    {opt.label}
                  </span>
                  {value === opt.id && <Check className="w-4 h-4 text-blue-600" />}
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                Sonuç bulunamadı
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
