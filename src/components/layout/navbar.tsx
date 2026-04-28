"use client";

import React from "react";
import { useAuth } from "@/context/auth-context";
import { 
  Bell, 
  Search, 
  User as UserIcon, 
  LogOut, 
  Settings,
  ChevronDown
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/input";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const { profile } = useAuth();
  const router = useRouter();

  const [isOpen, setIsOpen] = React.useState(false);
  const [notisOpen, setNotisOpen] = React.useState(false);
  const [notifs, setNotifs] = React.useState<any[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const fetchNotifications = async () => {
    if (!profile?.role) return;
    try {
      let query = supabase
        .from("corporate_order_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      const userRole = profile.role;
      const isAdmin = userRole === 'admin' || userRole === 'super_admin';

      if (!isAdmin) {
        query = query.eq("target_role", userRole);
      }

      const { data } = await query;
      if (data) {
        setNotifs(data);
        setUnreadCount(data.filter((n: any) => !n.is_read).length);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    if (!profile?.role) return;
    try {
      const userRole = profile.role;
      const isAdmin = userRole === 'admin' || userRole === 'super_admin';

      let query = supabase
        .from("corporate_order_notifications")
        .update({ is_read: true })
        .eq("is_read", false);

      if (!isAdmin) {
        query = query.eq("target_role", userRole);
      }

      await query;
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [profile]);

  React.useEffect(() => {
    const closeMenu = () => { setIsOpen(false); setNotisOpen(false); };
    if (isOpen || notisOpen) {
      document.addEventListener("click", closeMenu);
    }
    return () => document.removeEventListener("click", closeMenu);
  }, [isOpen, notisOpen]);

  return (
    <header className="h-16 border-b border-white bg-white/60 backdrop-blur-md sticky top-0 z-[150] px-8 flex items-center justify-between">
      {/* Search Area */}
      <div className="flex-1 max-w-xl">
        <Input 
          placeholder="Hızlı arama... (Görev, İşlem veya Kullanıcı)" 
          icon={<Search className="w-4 h-4" />}
          className="bg-slate-100/50 border-transparent focus:bg-white"
        />
      </div>

      {/* Actions & Profile */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1 relative">
          <button 
            onClick={(e) => { e.stopPropagation(); setNotisOpen(!notisOpen); if(!notisOpen) markAllAsRead(); }}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-ping" />
            )}
          </button>

          {/* Notifications Dropdown */}
          <div className={cn(
            "absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 transition-all transform origin-top-right z-[160] space-y-2",
            notisOpen ? "opacity-100 visible scale-100" : "opacity-0 invisible scale-95"
          )}>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Bildirimler ({unreadCount} Okunmamış)</p>
            {notifs.length === 0 ? (
              <p className="text-[10px] font-bold text-slate-400 text-center py-4">Bildirim bulunmuyor.</p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {notifs.map(n => (
                  <div key={n.id} className="p-2 hover:bg-slate-50 rounded-xl text-left transition-colors cursor-pointer" onClick={() => n.order_id && router.push(`/corporate/orders/${n.order_id}`)}>
                    <p className="text-xs font-bold text-slate-800">{n.title || 'İş Akışı Bildirimi'}</p>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="h-8 w-px bg-slate-200" />

        <div 
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="flex items-center gap-3 pl-2 group cursor-pointer relative"
        >
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-900 leading-tight">{profile?.full_name || "Kullanıcı"}</p>
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter leading-tight">{profile?.role || "Giriş yapıldı"}</p>
          </div>
          
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-600/20 group-hover:scale-105 transition-transform">
            {profile?.full_name?.[0] || <UserIcon className="w-5 h-5" />}
          </div>

          {/* Dropdown Menu */}
          <div 
            className={cn(
              "absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 transition-all transform origin-top-right z-[160]",
              isOpen ? "opacity-100 visible scale-100" : "opacity-0 invisible scale-95"
            )}
          >
            <button className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              <UserIcon className="w-4 h-4" /> Profilim
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              <Settings className="w-4 h-4" /> Ayarlar
            </button>
            <div className="h-px bg-slate-100 my-2 mx-4" />
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Güvenli Çıkış
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
