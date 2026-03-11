import { NextRequest, NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/google-auth";
import { cookies } from "next/headers";

const STATE_COOKIE = "syncprep_google_state";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const redirectUri = `${url.origin}/api/auth/google/callback`;
    const state = crypto.randomUUID();
    const authUrl = getGoogleAuthUrl(redirectUri, state);
    const cookieStore = await cookies();
    cookieStore.set(STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 min
      path: "/",
    });
    return NextResponse.redirect(authUrl);
  } catch (e) {
    console.error("Google auth init:", e);
    return NextResponse.json(
      { error: "Google auth not configured" },
      { status: 500 }
    );
  }
}
