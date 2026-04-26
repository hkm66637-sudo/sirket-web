"use client";

import React from "react";
import { AlertTriangle, Info, CheckCircle2, XCircle, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "info" | "success" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = "Onayla",
  cancelText = "Vazgeç",
  variant = "info",
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const variants = {
    danger: {
      icon: <Trash2 className="w-8 h-8 text-red-500" />,
      iconBg: "bg-red-100",
      confirmBtn: "bg-red-600 hover:bg-red-700 shadow-red-600/20",
    },
    info: {
      icon: <Info className="w-8 h-8 text-blue-500" />,
      iconBg: "bg-blue-100",
      confirmBtn: "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20",
    },
    success: {
      icon: <CheckCircle2 className="w-8 h-8 text-green-500" />,
      iconBg: "bg-green-100",
      confirmBtn: "bg-green-600 hover:bg-green-700 shadow-green-600/20",
    },
    warning: {
      icon: <AlertTriangle className="w-8 h-8 text-orange-500" />,
      iconBg: "bg-orange-100",
      confirmBtn: "bg-orange-600 hover:bg-orange-700 shadow-orange-600/20",
    },
  };

  const currentVariant = variants[variant];

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onCancel} 
      />
      
      {/* Modal */}
      <div className="relative bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-8">
        <button 
          onClick={onCancel}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center gap-6">
          <div className={cn("w-20 h-20 rounded-[1.5rem] flex items-center justify-center", currentVariant.iconBg)}>
            {currentVariant.icon}
          </div>
          
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight italic mb-2">{title}</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              {description}
            </p>
          </div>

          <div className="flex gap-4 w-full pt-2">
            <button
              onClick={onCancel}
              className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={cn(
                "flex-[1.5] py-4 text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2",
                currentVariant.confirmBtn,
                loading && "opacity-60 cursor-not-allowed"
              )}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
