"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  PlusCircle, 
  Wallet,
  Settings,
  HelpCircle,
  Building2,
  Tag,
  BarChart3,
  RefreshCw,
  ShoppingCart,
  Package,
  Layers
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import CompanySelector from "./CompanySelector";

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useAuth();

  const getActiveModule = (role: string | undefined): 'finance' | 'ecommerce' | 'production' | 'none' => {
    if (!role) return 'none';
    if (role === 'admin' || role === 'super_admin') {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('active_module') : null;
      if (stored === 'finance' || stored === 'ecommerce' || stored === 'production') {
        return stored;
      }
      return 'none';
    }
    if (['eticaret_yoneticisi', 'eticaret_personeli'].includes(role)) return 'ecommerce';
    if (['uretim_muduru', 'uretim_personeli', 'depo_yoneticisi', 'depo_personeli'].includes(role)) return 'production';
    return 'finance';
  };

  const activeModule = getActiveModule(profile?.role);

  const moduleMenus = {
    finance: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["super_admin", "admin", "operasyon", "finans", "muhasebe_muduru"] },
      { name: "Kurumsal Siparişler", href: "/corporate", icon: ShoppingCart, roles: ["super_admin", "admin", "pazarlama_muduru", "grafiker", "muhasebe_muduru", "uretim_muduru", "depo_muduru"] },
      { name: "Görevler", href: "/tasks", icon: CheckSquare, roles: ["super_admin", "admin", "operasyon", "finans", "uretim_muduru", "pazarlama_muduru", "depo_yoneticisi", "eticaret_yoneticisi", "muhasebe_muduru", "uretim_personeli", "pazarlama_personeli", "depo_personeli", "eticaret_personeli", "muhasebe_personeli"] },
      { name: "Genel Takvim", href: "/calendar/general", icon: Calendar, roles: ["super_admin", "admin", "operasyon", "finans", "muhasebe_muduru"] },
      { name: "Finans", href: "/finance/transactions", icon: Wallet, roles: ["super_admin", "admin", "finans", "muhasebe_muduru", "muhasebe_personeli"] },
      { name: "Banka Yönetimi", href: "/finance/banks", icon: Building2, roles: ["super_admin", "admin", "finans", "muhasebe_muduru"] },
      { name: "Ortak Cari Hesapları", href: "/finance/partners", icon: Users, roles: ["super_admin", "admin", "finans", "muhasebe_muduru"] },
      { name: "Kategori Yönetimi", href: "/finance/categories", icon: Tag, roles: ["super_admin", "admin", "finans", "muhasebe_muduru"] },
      { name: "Gelir Analizi", href: "/finance/income-analysis", icon: TrendingUp, roles: ["super_admin", "admin", "finans", "muhasebe_muduru"] },
      { name: "Gider Analizi", href: "/finance/expense-analysis", icon: TrendingDown, roles: ["super_admin", "admin", "finans", "muhasebe_muduru"] },
      { name: "Kar / Zarar Analizi", href: "/finance/profit-loss", icon: BarChart3, roles: ["super_admin", "admin", "finans", "muhasebe_muduru"] },
      { name: "Kullanıcı Yönetimi", href: "/users", icon: Users, roles: ["super_admin", "admin"] },
      { name: "Hızlı Kayıt", href: "/quick-add", icon: PlusCircle, roles: ["super_admin", "admin", "operasyon", "finans", "muhasebe_muduru"] },
    ],
    ecommerce: [
      { name: "E-Ticaret Dashboard", href: "/ecommerce", icon: LayoutDashboard, roles: ["super_admin", "admin", "eticaret_yoneticisi", "eticaret_personeli"] },
      { name: "Kurumsal Siparişler", href: "/corporate", icon: ShoppingCart, roles: ["super_admin", "admin", "pazarlama_muduru", "grafiker", "muhasebe_muduru", "uretim_muduru", "depo_muduru"] },
      { name: "Görevler", href: "/tasks", icon: CheckSquare, roles: ["super_admin", "admin", "operasyon", "finans", "uretim_muduru", "pazarlama_muduru", "depo_yoneticisi", "eticaret_yoneticisi", "muhasebe_muduru", "uretim_personeli", "pazarlama_personeli", "depo_personeli", "eticaret_personeli", "muhasebe_personeli"] },
    ],
    production: [
      { name: "Üretim Dashboard", href: "/production", icon: LayoutDashboard, roles: ["super_admin", "admin", "uretim_muduru", "uretim_personeli", "depo_yoneticisi", "depo_personeli"] },
      { name: "Kurumsal Siparişler", href: "/corporate", icon: ShoppingCart, roles: ["super_admin", "admin", "pazarlama_muduru", "grafiker", "muhasebe_muduru", "uretim_muduru", "depo_muduru"] },
      { name: "Siparişler / İş Emirleri", href: "/production/orders", icon: ShoppingCart, roles: ["super_admin", "admin", "uretim_muduru", "uretim_personeli", "finans", "muhasebe_muduru"] },
      { name: "Ürünler", href: "/production/products", icon: Package, roles: ["super_admin", "admin", "uretim_muduru"] },
      { name: "Reçeteler", href: "/production/recipes", icon: Layers, roles: ["super_admin", "admin", "uretim_muduru"] },
      { name: "Hammaddeler", href: "/production/raw-materials", icon: Tag, roles: ["super_admin", "admin", "uretim_muduru", "depo_yoneticisi"] },
      { name: "Makineler", href: "/production/machines", icon: Building2, roles: ["super_admin", "admin", "uretim_muduru"] },
      { name: "Satın Alma Talepleri", href: "/production/purchase-requests", icon: HelpCircle, roles: ["super_admin", "admin", "uretim_muduru", "finans"] },
      { name: "Üretim Takvimi", href: "/production/calendar", icon: Calendar, roles: ["super_admin", "admin", "uretim_muduru"] },
      { name: "Raporlar", href: "/production/reports", icon: BarChart3, roles: ["super_admin", "admin", "uretim_muduru"] },
      { name: "Görevler", href: "/tasks", icon: CheckSquare, roles: ["super_admin", "admin", "operasyon", "finans", "uretim_muduru", "pazarlama_muduru", "depo_yoneticisi", "eticaret_yoneticisi", "muhasebe_muduru", "uretim_personeli", "pazarlama_personeli", "depo_personeli", "eticaret_personeli", "muhasebe_personeli"] },
    ]
  };

  const currentMenu = activeModule !== 'none' ? moduleMenus[activeModule] : [];

  const filteredMenu = currentMenu.filter(item => 
    profile?.role ? item.roles.includes(profile.role) : false
  );

  return (
    <aside className="w-64 bg-slate-900 h-screen fixed left-0 top-0 text-white flex flex-col z-50 border-r border-slate-800">
      {/* Header Area */}
      <div className="p-6 pb-0">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-xl font-bold italic shadow-lg shadow-blue-600/30">
            SP
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">Şirket <span className="text-blue-500 text-sm block -mt-1 font-bold">PANEL</span></h1>
        </div>

        <div className="mb-6">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Aktif Şirket</p>
          <CompanySelector />
        </div>
      </div>

      {/* Scrollable Navigation Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
        <nav className="space-y-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-3">Ana Menü</p>
          {filteredMenu.map((item, index) => (
            <Link 
              key={`${item.href}-${index}`} 
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all group relative",
                pathname === item.href 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-transform group-hover:scale-110",
                pathname === item.href ? "text-white" : "text-slate-500 group-hover:text-blue-400"
              )} />
              {item.name}
              {pathname === item.href && (
                <div className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              )}
            </Link>
          ))}
        </nav>
      </div>

      {/* Footer Area */}
      <div className="p-6 pt-4 border-t border-slate-800 bg-slate-900/50">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-1">Sistem</p>
        <div className="space-y-1">
          {(profile?.role === 'super_admin' || profile?.role === 'admin') && (
            <button
              onClick={() => {
                localStorage.removeItem('active_module');
                router.push('/module-selection');
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-blue-400 hover:text-white hover:bg-slate-800 w-full text-left group"
            >
              <RefreshCw className="w-5 h-5 transition-transform group-hover:rotate-180 duration-500 text-blue-400" />
              Modül Değiştir
            </button>
          )}
          <Link 
            href="/settings" 
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all group relative",
              pathname === "/settings" 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
          >
            <Settings className={cn(
              "w-5 h-5 transition-transform group-hover:scale-110",
              pathname === "/settings" ? "text-white" : "text-slate-500 group-hover:text-blue-400"
            )} />
            Sistem Ayarları
            {pathname === "/settings" && (
              <div className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            )}
          </Link>
          <Link 
            href="/support-ai" 
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all group relative",
              pathname === "/support-ai" 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
          >
            <HelpCircle className={cn(
              "w-5 h-5 transition-transform group-hover:scale-110",
              pathname === "/support-ai" ? "text-white" : "text-slate-500 group-hover:text-blue-400"
            )} />
            Destek AI
            {pathname === "/support-ai" && (
              <div className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            )}
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
