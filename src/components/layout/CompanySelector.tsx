"use client";

import React from "react";
import { useCompany } from "@/context/company-context";
import { Building2, ChevronDown, Check, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompanySelectorProps {
  className?: string;
}

export default function CompanySelector({ className }: CompanySelectorProps) {
  const { companies, selectedCompanyId, setSelectedCompanyId, selectedCompany, loading, errorMsg } = useCompany();
  const [isOpen, setIsOpen] = React.useState(false);

  if (loading) {
    return (
      <div className={cn("flex items-center gap-3 px-4 py-2.5 bg-white border border-slate-100 rounded-2xl shadow-sm w-full animate-pulse", className)}>
        <div className="w-9 h-9 bg-slate-100 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="h-2 w-12 bg-slate-100 rounded-full" />
          <div className="h-3 w-24 bg-slate-100 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2.5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all active:scale-95 group w-full"
      >
        <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 border border-blue-100 group-hover:scale-110 transition-transform flex-shrink-0">
          {selectedCompanyId === "ALL" ? <LayoutGrid className="w-4.5 h-4.5" /> : <Building2 className="w-4.5 h-4.5" />}
        </div>
        <div className="text-left flex-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
            {errorMsg ? "Hata Oluştu" : "Aktif Şirket"}
          </p>
          <h4 className={cn(
            "text-sm font-black tracking-tight leading-none truncate",
            errorMsg ? "text-red-500" : "text-slate-900"
          )}>
            {errorMsg ? "Yükleme Başarısız" : (selectedCompanyId === "ALL" ? "Tüm Şirketler" : selectedCompany?.company_name)}
          </h4>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-3 p-2 bg-white rounded-[2rem] shadow-2xl border border-slate-50 z-50 animate-in fade-in zoom-in-95 duration-200">
            <div className="space-y-1">
              {errorMsg ? (
                <div className="p-4 text-center">
                  <p className="text-xs font-bold text-red-500 mb-2">{errorMsg}</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                  >
                    Yeniden Dene
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setSelectedCompanyId("ALL");
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-slate-50",
                      selectedCompanyId === "ALL" ? "bg-blue-50 text-blue-700" : "text-slate-600"
                    )}
                  >
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                      <LayoutGrid className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold flex-1 text-left uppercase tracking-tight">Tüm Şirketler</span>
                    {selectedCompanyId === "ALL" && <Check className="w-4 h-4" />}
                  </button>

                  <div className="h-px bg-slate-100 my-1 mx-2" />

                  {companies.length > 0 ? (
                    companies.map((company) => (
                      <button
                        key={company.id}
                        onClick={() => {
                          setSelectedCompanyId(company.id);
                          setIsOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-slate-50",
                          selectedCompanyId === company.id ? "bg-blue-50 text-blue-700" : "text-slate-600"
                        )}
                      >
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-black text-[10px] italic">
                          {company.company_name[0]}
                        </div>
                        <span className="text-xs font-bold flex-1 text-left uppercase tracking-tight">{company.company_name}</span>
                        {selectedCompanyId === company.id && <Check className="w-4 h-4" />}
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-400 text-xs font-bold">
                      Şirket bulunamadı.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
