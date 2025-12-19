import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = requestUrl.searchParams.get("next") || "/update-password";
  const email = requestUrl.searchParams.get("email");

  // Si no hay token_hash o type, redirigir al login
  if (!token_hash || !type) {
    const loginUrl = new URL("/login", requestUrl.origin);
    loginUrl.searchParams.set("error", "missing_parameters");
    return NextResponse.redirect(loginUrl);
  }

  try {
    const supabase = await createClient();

    // Verificar el token OTP
    // Intentar primero sin email (para invite y recovery)
    let { data, error } = await supabase.auth.verifyOtp({
      type: type as "email" | "invite" | "recovery" | "magiclink",
      token_hash: token_hash,
      ...(email && { email }),
    });

    // Si falla sin email y tenemos email disponible, intentar con email
    if (error && email) {
      const retry = await supabase.auth.verifyOtp({
        type: type as "email" | "invite" | "recovery" | "magiclink",
        token_hash: token_hash,
        email: email,
      });
      error = retry.error;
      data = retry.data;
    }

    if (error) {
      console.error("Error verifying OTP:", error);
      const loginUrl = new URL("/login", requestUrl.origin);
      loginUrl.searchParams.set("error", "invalid_token");
      return NextResponse.redirect(loginUrl);
    }

    // Si la verificación es exitosa, redirigir a la URL especificada en 'next'
    // Para invitaciones y recovery, siempre redirigir a update-password
    if (type === "invite" || type === "recovery") {
      return NextResponse.redirect(new URL("/update-password", requestUrl.origin));
    }

    // Para otros tipos (magic link, etc.), usar el parámetro 'next' o dashboard por defecto
    const redirectUrl = next.startsWith("/")
      ? new URL(next, requestUrl.origin)
      : new URL("/dashboard", requestUrl.origin);

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Unexpected error in auth confirm:", error);
    const loginUrl = new URL("/login", requestUrl.origin);
    loginUrl.searchParams.set("error", "unexpected_error");
    return NextResponse.redirect(loginUrl);
  }
}

