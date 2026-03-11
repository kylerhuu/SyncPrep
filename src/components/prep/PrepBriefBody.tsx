"use client";

import type { PrepNotes } from "@/types";
import {
  OverviewIcon,
  TalkPointsIcon,
  QuestionIcon,
  StarIcon,
  BookOpenIcon,
  ExclamationIcon,
  ArrowRightIcon,
} from "@/components/ui/Icons";
import type { ReactNode } from "react";

/** Format long summary into short paragraphs or bullet highlights. */
function formatSummaryContent(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const paragraphs = trimmed.split(/\n\n+/);
  if (paragraphs.length === 0) return null;
  if (paragraphs.length === 1 && !paragraphs[0].includes("\n")) {
    return (
      <p className="text-sm text-slate-800 leading-relaxed">{paragraphs[0]}</p>
    );
  }
  return (
    <div className="space-y-2.5">
      {paragraphs.map((p, i) => {
        const lines = p.split("\n").filter((l) => l.trim());
        if (lines.length <= 1) {
          return (
            <p key={i} className="text-sm text-slate-800 leading-relaxed">
              {p}
            </p>
          );
        }
        return (
          <ul
            key={i}
            className="list-none pl-0 space-y-1 text-sm text-slate-800 leading-relaxed"
          >
            {lines.map((line, j) => (
              <li key={j} className="flex gap-2">
                <span className="text-slate-400 shrink-0">•</span>
                <span>{line.trim()}</span>
              </li>
            ))}
          </ul>
        );
      })}
    </div>
  );
}

function SectionBlock({
  title,
  icon,
  items,
  single,
  isLast,
}: {
  title: string;
  icon?: ReactNode;
  items?: string[] | string;
  single?: boolean;
  isLast?: boolean;
}) {
  const content = single
    ? (typeof items === "string" ? items : items?.[0] ?? "")
    : items;
  if (single && typeof content === "string") {
    if (!content.trim()) return null;
    const formatted =
      title === "Meeting overview" ? (
        formatSummaryContent(content)
      ) : (
        <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
          {content}
        </p>
      );
    if (!formatted) return null;
    return (
      <div
        className={`py-3 ${!isLast ? "border-b border-slate-100" : ""}`}
      >
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </h3>
        </div>
        <div className="pl-6 text-slate-800">{formatted}</div>
      </div>
    );
  }
  const list = Array.isArray(content) ? content : [];
  if (list.length === 0) return null;
  return (
    <div className={`py-3 ${!isLast ? "border-b border-slate-100" : ""}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </h3>
      </div>
      <ul className="pl-6 space-y-1.5 text-sm text-slate-800 leading-relaxed list-none">
        {list.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-slate-400 shrink-0">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const BRIEF_SECTIONS: {
  key: keyof PrepNotes;
  title: string;
  Icon: () => JSX.Element;
}[] = [
  { key: "meetingSummary", title: "Meeting overview", Icon: OverviewIcon },
  { key: "talkingPoints", title: "Key talking points", Icon: TalkPointsIcon },
  {
    key: "questionsToPrepare",
    title: "Likely interview questions",
    Icon: QuestionIcon,
  },
  { key: "strengthsToHighlight", title: "Strengths to highlight", Icon: StarIcon },
  {
    key: "skillsToReview",
    title: "Skills or topics to review",
    Icon: BookOpenIcon,
  },
  {
    key: "gapsOrMissing",
    title: "Gaps or missing qualifications",
    Icon: ExclamationIcon,
  },
  {
    key: "followUpQuestions",
    title: "Follow-up questions to ask",
    Icon: ArrowRightIcon,
  },
];

export interface PrepBriefBodyProps {
  notes: PrepNotes;
}

export function PrepBriefBody({ notes }: PrepBriefBodyProps) {
  const visibleSections = BRIEF_SECTIONS.filter(({ key }) => {
    const value = notes[key];
    const single = key === "meetingSummary";
    return single
      ? typeof value === "string" && (value as string).trim().length > 0
      : Array.isArray(value) && value.length > 0;
  });

  return (
    <div className="-mt-1 -mb-1 py-0 -mx-1">
      {BRIEF_SECTIONS.map(({ key, title, Icon }) => {
        const value = notes[key];
        const single = key === "meetingSummary";
        const hasContent = single
          ? typeof value === "string" && (value as string).trim().length > 0
          : Array.isArray(value) && value.length > 0;
        if (!hasContent) return null;
        const isLast = visibleSections[visibleSections.length - 1]?.key === key;
        return (
          <SectionBlock
            key={key}
            title={title}
            icon={<Icon />}
            items={value as string | string[]}
            single={single}
            isLast={isLast}
          />
        );
      })}
    </div>
  );
}
