export type MeetingType = "interview" | "networking" | "team_meeting" | "other";

export interface TimeWindow {
  start: string;
  end: string;
}

export type Weekday =
  | "Sunday"
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday";

/** Recurring weekly availability pattern by weekday (other person's local time). */
export type WeeklyPattern = Record<Weekday, TimeWindow[]>;

/** One manual availability window for the other person (date + time range in their timezone). */
export interface OtherPersonWindow {
  /** Unique id for list keys (generated in UI). */
  id: string;
  /** Date in scheduling range: yyyy-MM-dd (one of the next 7 days). */
  date: string;
  /** Start time HH:mm (24h) in other person's timezone. */
  start: string;
  /** End time HH:mm (24h) in other person's timezone. */
  end: string;
  /** Optional draft metadata from screenshot parsing review. */
  draftMeta?: {
    overallConfidence?: number;
    dateConfidence?: number;
    timeConfidence?: number;
    blockConfidence?: number;
    warnings?: string[];
    parseType?: string;
    uncertainDate?: boolean;
    uncertainTime?: boolean;
  };
}

/** UTC availability range (ISO start/end). Used for overlap math. */
export interface AvailabilityRange {
  startISO: string;
  endISO: string;
}

/** @deprecated Use OverlapSlotResult from @/lib/timezone for slot types. */
export interface OverlapSlot {
  start: string;
  end: string;
  label: string;
  startISO: string;
  endISO: string;
}

export interface PrepNotes {
  meetingSummary?: string;
  talkingPoints?: string[];
  questionsToPrepare?: string[];
  strengthsToHighlight?: string[];
  skillsToReview?: string[];
  gapsOrMissing?: string[];
  followUpQuestions?: string[];
}

export interface MeetingContext {
  meetingType: MeetingType;
  context?: string;
  resume?: string;
  jobDescription?: string;
}
