import React from "react";
import { cn } from "@/lib/utils";
import Label from "./label";

interface FormFieldProps {
  label?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export default function FormField({ label, error, children, className }: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && <Label>{label}</Label>}
      <div className="relative">
        {children}
      </div>
      {error && (
        <p className="text-[10px] font-bold text-red-500 ml-1 mt-1 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
}
