import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "outline";
  className?: string;
}

const Badge = ({ children, variant = "default", className }: BadgeProps) => {
  const variants = {
    default: "bg-slate-100 text-slate-700",
    success: "bg-green-100 text-green-700",
    warning: "bg-orange-100 text-orange-700",
    danger: "bg-red-100 text-red-700",
    info: "bg-blue-100 text-blue-700",
    outline: "border border-slate-200 text-slate-600",
  };

  return (
    <span className={cn(
      "px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
};

export default Badge;
