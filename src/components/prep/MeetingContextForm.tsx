"use client";

import type { MeetingType } from "@/types";
import { Card } from "@/components/ui/Card";

const MEETING_TYPES: { value: MeetingType; label: string }[] = [
  { value: "interview", label: "Interview" },
  { value: "networking", label: "Networking" },
  { value: "team_meeting", label: "Team meeting" },
  { value: "other", label: "General meeting" },
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
  /** When true, render only the form fields (no Card wrapper). */
  noCard?: boolean;
}

const inputBase =
  "w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25";
const labelClass = "mb-2 block text-sm font-medium text-slate-700";
const sectionLabelClass = "text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3";

export function MeetingContextForm({
  meetingType,
  context,
  resume,
  jobDescription,
  onMeetingTypeChange,
  onContextChange,
  onResumeChange,
  onJobDescriptionChange,
  noCard = false,
}: MeetingContextFormProps) {
  const formContent = (
    <div className="space-y-6">
      {/* Meeting details */}
      <div>
        <p className={sectionLabelClass}>Meeting details</p>
        <div className="space-y-4">
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
            <p className="mt-1.5 text-xs text-slate-500">
              Used to tailor your meeting brief and suggested questions.
            </p>
          </div>
          <div>
            <label className={labelClass}>Meeting context (optional)</label>
            <textarea
              value={context}
              onChange={(e) => onContextChange(e.target.value)}
              placeholder="e.g. 30-minute technical screen for backend role, discuss system design experience"
              rows={4}
              className={`${inputBase} min-h-[100px] resize-y border-slate-200 bg-white`}
            />
          </div>
        </div>
      </div>

      {/* Interview materials */}
      <div>
        <p className={sectionLabelClass}>Interview materials (optional)</p>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Resume (optional)</label>
            <textarea
              value={resume}
              onChange={(e) => onResumeChange(e.target.value)}
              placeholder="Paste resume (optional)"
              rows={3}
              className={`${inputBase} min-h-[80px] resize-y font-mono text-xs`}
            />
          </div>
          <div>
            <label className={labelClass}>Job description (optional)</label>
            <textarea
              value={jobDescription}
              onChange={(e) => onJobDescriptionChange(e.target.value)}
              placeholder="Paste job description (optional)"
              rows={3}
              className={`${inputBase} min-h-[80px] resize-y font-mono text-xs`}
            />
          </div>
        </div>
      </div>
    </div>
  );

  if (noCard) return formContent;
  return (
    <Card title="Meeting context">
      {formContent}
    </Card>
  );
}
