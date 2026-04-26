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
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user && !pathname.startsWith("/auth")) {
      router.push("/auth/login");
    }
  }, [user, loading, router, pathname]);

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

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar remains fixed/static on left */}
      <Sidebar />
      
      {/* Scrollable Content Area */}
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
