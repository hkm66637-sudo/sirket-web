"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface Company {
  id: string;
  company_name: string;
  company_type?: string;
}

interface CompanyContextType {
  companies: Company[];
  selectedCompanyId: string | "ALL";
  setSelectedCompanyId: (id: string | "ALL") => void;
  selectedCompany: Company | null;
  loading: boolean;
  errorMsg: string | null;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchCompanies = useCallback(async () => {
    console.log("company fetch started");
    try {
      setLoading(true);
      setErrorMsg(null);
      
      const response = await supabase
        .from("companies")
        .select("id, company_name, company_type, is_active")
        .order("company_name");
      
      const { data, error, status, statusText } = response;
      
      console.log("🔍 RAW companies response:", response);
      console.log("🛠️ Status Info:", { status, statusText });

      if (error) {
        const errorDetail = JSON.stringify(error, null, 2);
        console.error("❌ Supabase Error (Stringified):", errorDetail);
        setErrorMsg(`Şirket verileri alınamadı (${status}: ${statusText})`);
        return;
      }
      
      if (!data || data.length === 0) {
        console.warn("⚠️ CompanyProvider: Kayıtlı şirket bulunamadı.");
        setCompanies([]);
      } else {
        console.log(`✅ CompanyProvider: ${data.length} şirket yüklendi.`);
        setCompanies(data);
        
        // Persisted selection load
        const saved = localStorage.getItem("selected_company_id");
        if (saved) {
          if (saved === "ALL" || data.some(c => c.id === saved)) {
            console.log(`📍 CompanyProvider: Kayıtlı seçim yüklendi (${saved})`);
            setSelectedCompanyId(saved as any);
          }
        }
      }
    } catch (err: any) {
      console.error("❌ CompanyProvider: Beklenmedik Hata!", err);
      setErrorMsg(`Sistem hatası: ${err.message || 'Bilinmeyen hata'}`);
    } finally {
      console.log("company fetch finished");
      console.log("🏁 CompanyProvider: Yükleme tamamlandı.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log("🔄 CompanyProvider: Şirket listesi çekiliyor...");
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    if (selectedCompanyId) {
      console.log(`🎯 CompanyProvider: Şirket değişti -> ${selectedCompanyId}`);
      localStorage.setItem("selected_company_id", selectedCompanyId);
    }
  }, [selectedCompanyId]);

  const selectedCompany = selectedCompanyId === "ALL" 
    ? null 
    : companies.find(c => c.id === selectedCompanyId) || null;

  return (
    <CompanyContext.Provider value={{ 
      companies, 
      selectedCompanyId, 
      setSelectedCompanyId, 
      selectedCompany,
      loading,
      errorMsg
    }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
}
