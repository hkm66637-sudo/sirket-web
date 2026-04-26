"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

export type AccessLevel = 'self_only' | 'department_only' | 'company_only' | 'global';

export type UserRole = 
  | 'super_admin' 
  | 'admin'
  | 'uretim_muduru' | 'uretim_personeli' 
  | 'pazarlama_muduru' | 'pazarlama_personeli'
  | 'depo_yoneticisi' | 'depo_personeli'
  | 'eticaret_yoneticisi' | 'eticaret_personeli'
  | 'muhasebe_muduru' | 'muhasebe_personeli'
  | 'operasyon' | 'finans';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  company_id?: string;
  department_id?: string;
  manager_id?: string;
  access_scope: AccessLevel;
  avatar_url?: string;
  status: 'active' | 'inactive';
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async (userId: string) => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (!error && data) {
        setProfile(data as Profile);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          // Await profile fetch to ensure we have data before finishing loading
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", currentUser.id)
            .single();

          if (!error && data) {
            setProfile(data as Profile);
          } else {
            // Fallback for demo/emergencies if profiles record is missing
            setProfile({
              id: currentUser.id,
              full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || "Kullanıcı",
              email: currentUser.email || "",
              role: 'admin', 
              access_scope: 'global',
              status: 'active'
            });
          }
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
