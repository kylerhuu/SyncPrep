import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { DateTime } from "luxon";
import {
  decryptTokens,
  encryptTokens,
  getTokensCookieName,
  getValidAccessToken,
} from "@/lib/google-auth";
import {
  createCalendarEvent,
  fetchCalendarEvents,
} from "@/lib/google-calendar";
import { resolveTimezone } from "@/lib/timezone";

interface CreateEventBody {
  slotStartISO: string;
  slotEndISO: string;
  zoneA: string;
  title: string;
  description?: string;
  attendees?: string[];
  durationMinutes: number;
}

function isValidEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

/** POST /api/calendar/create-event - create an event on the user's primary calendar for a selected slot. */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(getTokensCookieName())?.value;
    if (!raw) {
      return NextResponse.json(
        { error: "Not connected to Google Calendar." },
        { status: 401 }
      );
    }

    let tokens = await decryptTokens(raw);
    if (!tokens) {
      cookieStore.delete(getTokensCookieName());
      return NextResponse.json(
        { error: "Not connected to Google Calendar." },
        { status: 401 }
      );
    }

    const { access_token, tokens: maybeNewTokens } =
      await getValidAccessToken(tokens);
    if (maybeNewTokens !== tokens) {
      const encrypted = await encryptTokens(maybeNewTokens);
      cookieStore.set(getTokensCookieName(), encrypted, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
      tokens = maybeNewTokens;
    }

    const body = (await req.json()) as CreateEventBody;
    const {
      slotStartISO,
      slotEndISO,
      zoneA,
      title,
      description,
      attendees,
      durationMinutes,
    } = body;

    if (
      !slotStartISO ||
      !slotEndISO ||
      !zoneA ||
      !title ||
      !durationMinutes
    ) {
      return NextResponse.json(
        { error: "Missing required event details." },
        { status: 400 }
      );
    }

    if (durationMinutes <= 0 || durationMinutes > 8 * 60) {
      return NextResponse.json(
        { error: "Invalid meeting duration." },
        { status: 400 }
      );
    }

    if (attendees && attendees.some((e) => !isValidEmail(e))) {
      return NextResponse.json(
        { error: "One or more attendee emails are invalid." },
        { status: 400 }
      );
    }

    const tz = resolveTimezone(zoneA);
    const slotStart = DateTime.fromISO(slotStartISO, {
      setZone: true,
    }).setZone(tz);
    const slotEnd = DateTime.fromISO(slotEndISO, {
      setZone: true,
    }).setZone(tz);

    if (!slotStart.isValid || !slotEnd.isValid) {
      return NextResponse.json(
        { error: "Invalid slot time." },
        { status: 400 }
      );
    }

    const slotMinutes = slotEnd.diff(slotStart, "minutes").minutes;
    if (durationMinutes - slotMinutes > 0.5) {
      return NextResponse.json(
        {
          error: `This slot cannot fit a ${durationMinutes} minute meeting.`,
        },
        { status: 400 }
      );
    }

    const eventStart = slotStart;
    const eventEnd = slotStart.plus({ minutes: durationMinutes });

    // Check for new conflicts that may have appeared since the UI was rendered.
    const existing = await fetchCalendarEvents(
      access_token,
      eventStart.toUTC().toISO()!,
      eventEnd.toUTC().toISO()!
    );

    const hasConflict = existing.some((ev) => {
      const evStart = DateTime.fromISO(ev.start, { setZone: true });
      const evEnd = DateTime.fromISO(ev.end, { setZone: true });
      if (!evStart.isValid || !evEnd.isValid) return false;
      const latestStart =
        evStart > eventStart ? evStart : eventStart;
      const earliestEnd = evEnd < eventEnd ? evEnd : eventEnd;
      return earliestEnd > latestStart;
    });

    if (hasConflict) {
      return NextResponse.json(
        {
          error:
            "This time just became busy on your calendar. Please pick another slot.",
        },
        { status: 409 }
      );
    }

    const created = await createCalendarEvent(access_token, {
      startISO: eventStart.toISO()!,
      endISO: eventEnd.toISO()!,
      timeZone: tz,
      title,
      description,
      attendees,
    });

    return NextResponse.json(
      {
        success: true,
        event: created,
      },
      { status: 200 }
    );
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Your Google session expired. Please reconnect your calendar." },
        { status: 401 }
      );
    }
    console.error("Create calendar event:", e);
    return NextResponse.json(
      { error: "Failed to create calendar event. Please try again." },
      { status: 500 }
    );
  }
}

