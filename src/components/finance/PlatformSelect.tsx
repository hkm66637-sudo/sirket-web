"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import { Plus, Check, X, AlertCircle, Building2 } from "lucide-react";
import Select from "@/components/ui/select";
import Input from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PlatformSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function PlatformSelect({ value, onChange, className }: PlatformSelectProps) {
  const { profile } = useAuth();
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlatforms = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("platforms")
        .select("*")
        .eq("status", "active")
        .order("name");
      
      if (error) throw error;
      setPlatforms(data || []);
    } catch (err) {
      console.error("❌ Platformlar yüklenemedi:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlatforms();
  }, [fetchPlatforms]);

  const handleAddPlatform = async () => {
    if (!newName.trim()) {
      setError("Platform adı boş olamaz.");
      return;
    }

    const exists = platforms.some(p => p.name.toLowerCase() === newName.trim().toLowerCase());
    if (exists) {
      setError("Bu platform zaten mevcut.");
      return;
    }

    setAddLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("platforms")
        .insert([{ name: newName.trim() }])
        .select()
        .single();

      if (error) throw error;

      setPlatforms(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      onChange(data.name);
      setNewName("");
      setIsAdding(false);
    } catch (err: any) {
      console.error("❌ Platform eklenemedi:", err);
      setError(err.message || "Platform eklenirken bir hata oluştu.");
    } finally {
      setAddLoading(false);
    }
  };

  const canAdd = profile && ["super_admin", "admin", "muhasebe_muduru"].includes(profile.role);

  if (isAdding) {
    return (
      <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input 
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Platform adı..."
              className="text-xs font-bold h-10"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddPlatform();
                } else if (e.key === "Escape") {
                  setIsAdding(false);
                  setError(null);
                }
              }}
            />
          </div>
          <button 
            type="button"
            onClick={handleAddPlatform}
            disabled={addLoading}
            className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            {addLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
          </button>
          <button 
            type="button"
            onClick={() => { setIsAdding(false); setError(null); }}
            className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {error && (
          <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Select 
        value={value}
        onChange={(e) => {
          if (e.target.value === "ADD_NEW") {
            setIsAdding(true);
          } else {
            onChange(e.target.value);
          }
        }}
        className={cn("font-bold", className)}
        icon={<Building2 className="w-4 h-4" />}
      >
        <option value="">Platform Seçin...</option>
        {platforms.map(p => (
          <option key={p.id} value={p.name}>{p.name}</option>
        ))}
        {canAdd && (
          <option value="ADD_NEW" className="text-blue-600 font-black">+ YENİ PLATFORM EKLE</option>
        )}
      </Select>
    </div>
  );
}
