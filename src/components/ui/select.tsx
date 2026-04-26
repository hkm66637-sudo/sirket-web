import React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  icon?: React.ReactNode;
}

export default function Select({ className, icon, children, ...props }: SelectProps) {
  return (
    <div className="form-icon-container group">
      {icon && (
        <div className="form-icon-left w-5 h-5 flex items-center justify-center">
          {icon}
        </div>
      )}
      <select
        className={cn(
          "appearance-none",
          icon && "form-input-with-icon-left",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
        <ChevronDown className="w-4 h-4" />
      </div>
    </div>
  );
}
