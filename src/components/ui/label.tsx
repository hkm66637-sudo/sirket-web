import React from "react";
import { cn } from "@/lib/utils";

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export default function Label({ className, children, ...props }: LabelProps) {
  return (
    <label 
      className={cn(
        "block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1 transition-colors",
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
}
