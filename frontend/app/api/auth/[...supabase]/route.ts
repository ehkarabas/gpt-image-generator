import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

function withSecurityHeaders(response: Response): Response {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("Permissions-Policy", "interest-cohort=()");
  return response;
}

export async function OPTIONS() {
  const res = new Response(null, { status: 204 });
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );
  return withSecurityHeaders(res);
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const redirectTo = url.searchParams.get("redirect_to") || "/";
  const supabase = createRouteHandlerClient({ cookies });

  if (code) {
    // Exchange the auth code for a session and persist cookies
    await supabase.auth.exchangeCodeForSession(code);
    const redirect = NextResponse.redirect(new URL(redirectTo, url.origin));
    redirect.headers.set("Access-Control-Allow-Origin", "*");
    return withSecurityHeaders(redirect);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const res = Response.json({ ok: true, user: user ?? null });
  res.headers.set("Access-Control-Allow-Origin", "*");
  return withSecurityHeaders(res);
}

export async function POST(request: NextRequest) {
  // This endpoint is used by Supabase for auth callbacks (sign in/up, magic links, OAuth)
  // The auth-helpers library reads/writes cookies to persist the session.
  createRouteHandlerClient({ cookies }); // Initialize for cookie handling
  const { event, session } = await request
    .json()
    .catch(() => ({ event: null, session: null }));

  if (event === "SIGNED_IN" && session) {
    // no-op; cookies are set by helpers
  }

  const res = Response.json({ ok: true });
  res.headers.set("Access-Control-Allow-Origin", "*");
  return withSecurityHeaders(res);
}
