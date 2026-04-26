import React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export default function Input({ className, icon, ...props }: InputProps) {
  return (
    <div className="form-icon-container group">
      {icon && (
        <div className="form-icon-left w-5 h-5 flex items-center justify-center">
          {icon}
        </div>
      )}
      <input
        className={cn(
          icon && "form-input-with-icon-left",
          className
        )}
        {...props}
      />
    </div>
  );
}
