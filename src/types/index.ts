export type MeetingType = "interview" | "networking" | "team_meeting" | "other";

export interface TimeWindow {
  start: string; // "09:00"
  end: string;   // "12:00"
}

export interface OverlapSlot {
  start: string;   // ISO in UTC or display string
  end: string;
  label: string;   // e.g. "9:00 AM - 10:00 AM (EST)"
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
