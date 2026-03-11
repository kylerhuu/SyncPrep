export type MeetingType = "interview" | "networking" | "team_meeting" | "other";

export interface TimeWindow {
  start: string;
  end: string;
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
