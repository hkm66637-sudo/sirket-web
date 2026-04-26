"use client";

import React from "react";
import { 
  X, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertCircle 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (status: string) => void;
  currentStatus: string;
  type: "gelir" | "gider";
  loading?: boolean;
}

const statusIcons: any = {
  "Ödendi": <CheckCircle2 className="w-5 h-5 text-green-500" />,
  "Bekliyor": <Clock className="w-5 h-5 text-orange-500" />,
  "İptal Edildi": <XCircle className="w-5 h-5 text-red-500" />,
  "Tahsil Edildi": <CheckCircle2 className="w-5 h-5 text-blue-500" />,
  "Gecikti": <AlertCircle className="w-5 h-5 text-red-600" />,
};

const statusDescriptions: any = {
  "Ödendi": "Ödeme işlemi tamamlandı ve banka bakiyesine yansıdı.",
  "Bekliyor": "İşlem henüz gerçekleşmedi, onay veya tarih bekliyor.",
  "İptal Edildi": "İşlem iptal edildi, muhasebe kayıtlarına yansımaz.",
  "Tahsil Edildi": "Tahsilat başarıyla yapıldı ve kasaya/bankaya girdi.",
  "Gecikti": "Planlanan tarih geçti ancak işlem henüz tamamlanmadı.",
};

export default function StatusUpdateModal({ 
  isOpen, 
  onClose, 
  onSelect, 
  currentStatus, 
  type,
  loading 
}: StatusUpdateModalProps) {
  if (!isOpen) return null;

  const options = type === "gelir" 
    ? ["Bekliyor", "Tahsil Edildi", "İptal Edildi", "Gecikti"] 
    : ["Bekliyor", "Ödendi", "İptal Edildi", "Gecikti"];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="relative bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Durum Güncelle</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Finans Kaydı Yönetimi</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-2">
          {options.map((status) => (
            <button
              key={status}
              disabled={loading}
              onClick={() => onSelect(status)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-2xl transition-all border text-left group",
                currentStatus === status 
                  ? "bg-blue-50 border-blue-100 ring-2 ring-blue-500/10" 
                  : "bg-white border-slate-100 hover:border-blue-200 hover:bg-slate-50"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                currentStatus === status ? "bg-white shadow-sm" : "bg-slate-50"
              )}>
                {statusIcons[status] || <Clock className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <p className="text-xs font-black text-slate-900 uppercase tracking-wider">{status}</p>
                <p className="text-[10px] font-medium text-slate-500 mt-0.5 leading-relaxed">
                  {statusDescriptions[status]}
                </p>
              </div>
              {currentStatus === status && (
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              )}
            </button>
          ))}
        </div>

        <div className="p-4 bg-slate-50/50 border-t border-slate-50 text-center">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            Değişiklik anında kaydedilir ve banka bakiyelerini etkileyebilir.
          </p>
        </div>
      </div>
    </div>
  );
}
