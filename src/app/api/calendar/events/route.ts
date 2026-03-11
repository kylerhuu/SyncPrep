import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { DateTime } from "luxon";
import {
  decryptTokens,
  getValidAccessToken,
  getTokensCookieName,
  encryptTokens,
} from "@/lib/google-auth";
import { fetchCalendarEvents } from "@/lib/google-calendar";

/** GET /api/calendar/events - returns next 14 days of primary calendar events. */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(getTokensCookieName())?.value;
    if (!raw) {
      return NextResponse.json({ connected: false, events: [] }, { status: 200 });
    }

    let tokens = await decryptTokens(raw);
    if (!tokens) {
      cookieStore.delete(getTokensCookieName());
      return NextResponse.json({ connected: false, events: [] }, { status: 200 });
    }

    const { access_token, tokens: maybeNewTokens } = await getValidAccessToken(tokens);
    if (maybeNewTokens !== tokens) {
      const encrypted = await encryptTokens(maybeNewTokens);
      cookieStore.set(getTokensCookieName(), encrypted, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
    }

    const now = DateTime.now().toUTC();
    const timeMin = now.toISO();
    const timeMax = now.plus({ days: 14 }).toISO();
    const events = await fetchCalendarEvents(access_token, timeMin!, timeMax!);
    return NextResponse.json({ connected: true, events });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ connected: false, events: [] }, { status: 200 });
    }
    console.error("Calendar events:", e);
    return NextResponse.json(
      { error: "Failed to load calendar events" },
      { status: 500 }
    );
  }
}
