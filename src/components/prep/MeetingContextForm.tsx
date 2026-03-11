"use client";

import type { MeetingType } from "@/types";
import { Card } from "@/components/ui/Card";

const MEETING_TYPES: { value: MeetingType; label: string }[] = [
  { value: "interview", label: "Interview" },
  { value: "networking", label: "Networking call" },
  { value: "team_meeting", label: "Team meeting" },
  { value: "other", label: "Other" },
];

export function MeetingContextForm({
  meetingType,
  context,
  resume,
  jobDescription,
  onMeetingTypeChange,
  onContextChange,
  onResumeChange,
  onJobDescriptionChange,
}: {
  meetingType: MeetingType;
  context: string;
  resume: string;
  jobDescription: string;
  onMeetingTypeChange: (v: MeetingType) => void;
  onContextChange: (v: string) => void;
  onResumeChange: (v: string) => void;
  onJobDescriptionChange: (v: string) => void;
}) {
  return (
    <Card title="Meeting context (for AI prep)">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Meeting type</label>
          <select
            value={meetingType}
            onChange={(e) => onMeetingTypeChange(e.target.value as MeetingType)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {MEETING_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Context (optional)</label>
          <textarea
            value={context}
            onChange={(e) => onContextChange(e.target.value)}
            placeholder="e.g. 30-min call with recruiter, technical round"
            rows={2}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Resume (optional, for interviews)</label>
          <textarea
            value={resume}
            onChange={(e) => onResumeChange(e.target.value)}
            placeholder="Paste your resume text here"
            rows={4}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono text-xs"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Job description (optional)</label>
          <textarea
            value={jobDescription}
            onChange={(e) => onJobDescriptionChange(e.target.value)}
            placeholder="Paste the job description here"
            rows={4}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono text-xs"
          />
        </div>
      </div>
    </Card>
  );
}
