import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getTokensCookieName } from "@/lib/google-auth";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(getTokensCookieName());
  return NextResponse.json({ ok: true });
}
