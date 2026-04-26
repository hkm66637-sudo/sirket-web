"use client";

import React, { useEffect } from "react";
import { CheckCircle2, XCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToastProps {
  message: string;
  type: "success" | "error" | "info" | "warning";
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const variants = {
    success: {
      icon: <CheckCircle2 className="w-5 h-5 shrink-0" />,
      bg: "bg-green-600 shadow-green-600/30",
    },
    error: {
      icon: <XCircle className="w-5 h-5 shrink-0" />,
      bg: "bg-red-600 shadow-red-600/30",
    },
    info: {
      icon: <Info className="w-5 h-5 shrink-0" />,
      bg: "bg-blue-600 shadow-blue-600/30",
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5 shrink-0" />,
      bg: "bg-orange-600 shadow-orange-600/30",
    },
  };

  const currentVariant = variants[type];

  return (
    <div className="fixed top-6 right-6 z-[400] animate-in slide-in-from-top-6 fade-in duration-300">
      <div className={cn(
        "px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm text-white",
        currentVariant.bg
      )}>
        {currentVariant.icon}
        {message}
      </div>
    </div>
  );
}
