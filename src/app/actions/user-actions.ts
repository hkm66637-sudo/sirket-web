"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function createSystemUser(formData: any, actorId?: string) {
  let createdAuthUserId: string | null = null;

  try {
    // 1. Validation
    if (!formData.email || !formData.full_name) {
      return { success: false, error: "Ad soyad ve e-posta zorunludur." };
    }

    // Rol ve Erişim Seviyesi Uyumu
    const isGlobalRole = ["admin", "super_admin"].includes(formData.role);
    if (isGlobalRole && formData.access_scope !== "global") {
      return { success: false, error: "Admin rolleri için erişim seviyesi 'global' olmalıdır." };
    }

    // 2. Proactive Duplicate Email Check in Profiles
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", formData.email)
      .maybeSingle();

    if (existingProfile) {
      return { success: false, error: "Bu e-posta adresi ile kayıtlı bir kullanıcı zaten mevcut." };
    }

    // 3. Create Auth User
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: formData.email,
      password: "Sirket123!",
      email_confirm: true,
      user_metadata: {
        full_name: formData.full_name,
        role: formData.role
      }
    });

    if (authError) {
      if (authError.message.includes("already registered")) {
        return { success: false, error: "Bu e-posta adresi zaten kullanımda." };
      }
      throw authError;
    }

    createdAuthUserId = authData.user.id;

    // 3. Profile Update
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: formData.full_name,
        role: formData.role,
        company_id: isGlobalRole ? null : (formData.company_id || null),
        department_id: isGlobalRole ? "Yönetim" : formData.department_id,
        manager_id: formData.manager_id || null,
        access_scope: isGlobalRole ? "global" : formData.access_scope,
        status: formData.status
      })
      .eq("id", createdAuthUserId);

    if (profileError) {
      console.error("DB ERROR CREATING NEW USER:", {
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
        code: profileError.code,
        payload: { id: createdAuthUserId, role: formData.role }
      });
      // ROLLBACK: Auth user created but profile failed
      await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId);
      throw new Error(`Veritabanı hatası: ${profileError.message}`);
    }

    // 4. Log Action
    await supabaseAdmin.from("system_logs").insert({
      actor_id: actorId,
      action_type: "CREATE_USER",
      target_id: createdAuthUserId,
      details: {
        email: formData.email,
        role: formData.role,
        company_id: formData.company_id
      }
    });

    revalidatePath("/users");
    return { success: true };
  } catch (err: any) {
    console.error("CRITICAL ERROR: User Creation Failed", err);
    
    // Ensure cleanup if anything fails after auth creation
    if (createdAuthUserId) {
      await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId);
    }

    return { success: false, error: err.message || "Sistem hatası oluştu. Lütfen tekrar deneyin." };
  }
}

export async function updateSystemUser(userId: string, formData: any, actorId?: string) {
  try {
    const isGlobalRole = ["admin", "super_admin"].includes(formData.role);
    
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: formData.full_name,
        role: formData.role,
        company_id: isGlobalRole ? null : (formData.company_id || null),
        department_id: isGlobalRole ? "Yönetim" : formData.department_id,
        manager_id: formData.manager_id || null,
        access_scope: isGlobalRole ? "global" : formData.access_scope,
        status: formData.status
      })
      .eq("id", userId);

    if (error) {
      console.error("DB ERROR UPDATING USER:", error);
      throw error;
    }

    // Log Action
    await supabaseAdmin.from("system_logs").insert({
      actor_id: actorId,
      action_type: "UPDATE_USER",
      target_id: userId,
      details: {
        role: formData.role,
        status: formData.status
      }
    });

    revalidatePath("/users");
    return { success: true };
  } catch (err: any) {
    console.error("UPDATE ERROR:", err);
    return { success: false, error: err.message };
  }
}
