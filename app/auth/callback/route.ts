import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Route handler para el flujo de Authorization Code (PKCE)
 * Usado para OAuth y login normal con código de intercambio
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/";

  // Si no hay código, redirigir al login
  if (!code) {
    return NextResponse.redirect(new URL("/login", requestUrl.origin));
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Error exchanging code for session:", error);
      const loginUrl = new URL("/login", requestUrl.origin);
      loginUrl.searchParams.set("error", "invalid_code");
      return NextResponse.redirect(loginUrl);
    }

    // Redirigir a la URL especificada en 'next' o al dashboard por defecto
    const redirectUrl = next.startsWith("/")
      ? new URL(next, requestUrl.origin)
      : new URL("/dashboard", requestUrl.origin);

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Unexpected error in auth callback:", error);
    const loginUrl = new URL("/login", requestUrl.origin);
    loginUrl.searchParams.set("error", "unexpected_error");
    return NextResponse.redirect(loginUrl);
  }
}

