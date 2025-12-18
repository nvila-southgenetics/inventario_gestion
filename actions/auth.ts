"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { UserRole } from "@/types/database";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return {
      error: "Email y contraseña son requeridos",
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      error: error.message,
    };
  }

  if (data.user) {
    revalidatePath("/", "layout");
    redirect("/");
  }
}

export async function inviteUser(formData: FormData) {
  const email = formData.get("email") as string;
  const role = formData.get("role") as UserRole;

  if (!email || !role) {
    return {
      error: "Email y rol son requeridos",
    };
  }

  // Verificar que el usuario actual es ADMIN
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "No autenticado",
    };
  }

  // Obtener el perfil del usuario actual
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return {
      error: "Error al obtener perfil de usuario",
    };
  }

  if (profile.role !== "ADMIN") {
    return {
      error: "Solo los administradores pueden invitar usuarios",
    };
  }

  // Invitar usuario usando el cliente admin
  // Configurar la URL de redirect para el flujo de token_hash (OTP)
  // Supabase enviará el email con token_hash que será procesado por /auth/confirm
  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/confirm?next=/update-password&type=invite`;
  
  const { data: invitedUser, error: inviteError } =
    await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        organization_id: profile.organization_id,
        role: role,
      },
      redirectTo: redirectTo,
    });

  if (inviteError) {
    return {
      error: inviteError.message,
    };
  }

  // Insertar perfil manualmente con la organización y rol correctos
  if (invitedUser.user) {
    const { error: insertError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: invitedUser.user.id,
        email: email,
        organization_id: profile.organization_id,
        role: role,
      });

    if (insertError) {
      // Si el perfil ya existe (por el trigger), actualizarlo
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          organization_id: profile.organization_id,
          role: role,
        })
        .eq("id", invitedUser.user.id);

      if (updateError) {
        return {
          error: "Error al crear/actualizar perfil: " + updateError.message,
        };
      }
    }
  }

  revalidatePath("/dashboard/users");
  return {
    success: true,
    message: "Invitación enviada correctamente",
  };
}

export async function updatePassword(formData: FormData) {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return {
      error: "Ambas contraseñas son requeridas",
    };
  }

  if (password !== confirmPassword) {
    return {
      error: "Las contraseñas no coinciden",
    };
  }

  if (password.length < 6) {
    return {
      error: "La contraseña debe tener al menos 6 caracteres",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    return {
      error: error.message,
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

// Alias para mantener compatibilidad
export const signOutAction = signOut;

