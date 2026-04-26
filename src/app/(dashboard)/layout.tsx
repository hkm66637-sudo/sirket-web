"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/layout/sidebar";
import Navbar from "@/components/layout/navbar";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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

  useEffect(() => {
    if (!loading && !user && !pathname.startsWith("/auth")) {
      router.push("/auth/login");
      return;
    }

    if (!loading && user && profile) {
      const activeModule = getActiveModule(profile.role);

      if ((profile.role === 'admin' || profile.role === 'super_admin') && activeModule === 'none') {
        if (pathname !== '/module-selection') {
          router.push('/module-selection');
        }
        return;
      }

      if (pathname === '/module-selection' && profile.role !== 'admin' && profile.role !== 'super_admin') {
        const target = activeModule === 'ecommerce' ? '/ecommerce' : activeModule === 'production' ? '/production' : '/';
        router.push(target);
        return;
      }

      if (activeModule === 'ecommerce' && pathname === '/') {
        router.push('/ecommerce');
      } else if (activeModule === 'production' && pathname === '/') {
        router.push('/production');
      } else if (activeModule === 'finance' && (pathname === '/ecommerce' || pathname === '/production')) {
        router.push('/');
      } else if (activeModule === 'ecommerce' && pathname.startsWith('/finance')) {
        router.push('/ecommerce');
      } else if (activeModule === 'production' && pathname.startsWith('/finance')) {
        router.push('/production');
      }
    }
  }, [user, profile, loading, router, pathname]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!user && !pathname.startsWith("/auth")) {
    return null;
  }

  if (pathname === '/module-selection') {
    return <div className="min-h-screen bg-slate-950">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 min-h-screen flex flex-col pl-64">
        <Navbar />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
