"use client";

import type { MeetingType } from "@/types";
import { Card } from "@/components/ui/Card";

const MEETING_TYPES: { value: MeetingType; label: string }[] = [
  { value: "interview", label: "Interview" },
  { value: "networking", label: "Networking call" },
  { value: "team_meeting", label: "Team meeting" },
  { value: "other", label: "Other" },
];

interface MeetingContextFormProps {
  meetingType: MeetingType;
  context: string;
  resume: string;
  jobDescription: string;
  onMeetingTypeChange: (v: MeetingType) => void;
  onContextChange: (v: string) => void;
  onResumeChange: (v: string) => void;
  onJobDescriptionChange: (v: string) => void;
}

export function MeetingContextForm({
  meetingType,
  context,
  resume,
  jobDescription,
  onMeetingTypeChange,
  onContextChange,
  onResumeChange,
  onJobDescriptionChange,
}: MeetingContextFormProps) {
  const inputBase =
    "w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";
  const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

  return (
    <Card title="Meeting context (for AI prep)">
      <div className="space-y-5">
        <div>
          <label className={labelClass}>Meeting type</label>
          <select
            value={meetingType}
            onChange={(e) => onMeetingTypeChange(e.target.value as MeetingType)}
            className={`${inputBase} min-h-[40px]`}
          >
            {MEETING_TYPES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>
            Meeting goal or context (optional)
          </label>
          <textarea
            value={context}
            onChange={(e) => onContextChange(e.target.value)}
            placeholder="e.g. 30-min technical screen, learn about the team"
            rows={2}
            className={`${inputBase} min-h-[80px] resize-y`}
          />
        </div>
        <div>
          <label className={labelClass}>Resume (optional)</label>
          <textarea
            value={resume}
            onChange={(e) => onResumeChange(e.target.value)}
            placeholder="Paste resume text"
            rows={4}
            className={`${inputBase} min-h-[100px] resize-y font-mono text-xs`}
          />
        </div>
        <div>
          <label className={labelClass}>Job description (optional)</label>
          <textarea
            value={jobDescription}
            onChange={(e) => onJobDescriptionChange(e.target.value)}
            placeholder="Paste job description"
            rows={4}
            className={`${inputBase} min-h-[100px] resize-y font-mono text-xs`}
          />
        </div>
      </div>
    </Card>
  );
}
