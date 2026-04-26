import React from "react";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down";
  icon: React.ReactNode;
  color: "blue" | "green" | "red" | "orange";
}

const StatCard = ({ label, value, change, trend, icon, color }: StatCardProps) => {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100 shadow-blue-100/50",
    green: "bg-green-50 text-green-600 border-green-100 shadow-green-100/50",
    red: "bg-red-50 text-red-600 border-red-100 shadow-red-100/50",
    orange: "bg-orange-50 text-orange-600 border-orange-100 shadow-orange-100/50",
  };

  return (
    <div className="glass-card p-6 flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300">
      <div className="flex justify-between items-start mb-6">
        <div className={cn("p-4 rounded-2xl border shadow-sm transition-all group-hover:scale-110", colors[color])}>
          {icon}
        </div>
        {change && (
          <div className={cn(
            "flex items-center text-[10px] font-extrabold px-2 py-1 rounded-lg uppercase tracking-tighter shadow-sm",
            trend === "up" ? "bg-green-50 text-green-600 border border-green-100" : "bg-red-50 text-red-600 border border-red-100"
          )}>
            {trend === "up" ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
            {change}
          </div>
        )}
      </div>
      <div>
        <p className="text-slate-400 text-[10px] font-bold mb-1 uppercase tracking-widest">{label}</p>
        <h3 className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight">{value}</h3>
      </div>
      
      {/* Decorative background element */}
      <div className={cn(
        "absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-5 group-hover:scale-150 transition-transform duration-700",
        trend === "up" ? "bg-green-500" : "bg-red-500"
      )} />
    </div>
  );
};

export default StatCard;
