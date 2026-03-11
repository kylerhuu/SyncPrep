import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  exchangeCodeForTokens,
  encryptTokens,
  getTokensCookieName,
} from "@/lib/google-auth";

const STATE_COOKIE = "syncprep_google_state";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    console.error("Google OAuth error:", error);
    return NextResponse.redirect(new URL("/schedule?calendar=auth_error", request.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/schedule?calendar=missing_code", request.url));
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);

  if (!savedState || savedState !== state) {
    return NextResponse.redirect(new URL("/schedule?calendar=invalid_state", request.url));
  }

  try {
    const url = new URL(request.url);
    const redirectUri = `${url.origin}/api/auth/google/callback`;
    const tokens = await exchangeCodeForTokens(code, redirectUri);
    const encrypted = await encryptTokens(tokens);
    const cookieName = getTokensCookieName();
    cookieStore.set(cookieName, encrypted, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
    return NextResponse.redirect(new URL("/schedule?calendar=connected", request.url));
  } catch (e) {
    console.error("Google callback:", e);
    return NextResponse.redirect(new URL("/schedule?calendar=exchange_error", request.url));
  }
}
