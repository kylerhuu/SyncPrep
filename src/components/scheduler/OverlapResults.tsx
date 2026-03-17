"use client";

import { DateTime } from "luxon";
import type { OverlapSlotResult } from "@/lib/timezone";
import { resolveTimezone, getZoneDisplayName } from "@/lib/timezone";
import type { RankedSlot } from "@/lib/slot-ranking";
import { Card } from "@/components/ui/Card";
import { ClockIcon, CheckCircleIcon } from "@/components/ui/Icons";

function formatSlotInZone(startISO: string, endISO: string, ianaZone: string): string {
  const start = DateTime.fromISO(startISO, { setZone: true }).setZone(ianaZone);
  const end = DateTime.fromISO(endISO, { setZone: true }).setZone(ianaZone);
  if (!start.isValid || !end.isValid) return "";
  return `${start.toFormat("h:mm a")} – ${end.toFormat("h:mm a")}`;
}

function SlotRow({
  slot,
  recommendation,
  isSelected,
  isRecommendedStyle,
  onSelectSlot,
  tzA,
  tzB,
  labelA,
  labelB,
  singleUser,
}: {
  slot: OverlapSlotResult;
  recommendation: string | null;
  isSelected: boolean;
  isRecommendedStyle: boolean;
  onSelectSlot: (s: OverlapSlotResult | null) => void;
  tzA: string;
  tzB: string;
  labelA: string;
  labelB: string;
  singleUser: boolean;
}) {
  const lineA = formatSlotInZone(slot.startISO, slot.endISO, tzA);
  const lineB = formatSlotInZone(slot.startISO, slot.endISO, tzB);
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelectSlot(isSelected ? null : slot)}
        className={`w-full text-left rounded-xl border-2 px-4 py-3.5 text-sm font-medium transition-all duration-300 flex items-start justify-between gap-3 relative overflow-hidden ${
          isSelected
            ? "border-blue-500 bg-gradient-to-br from-blue-950/70 via-slate-900 to-slate-900 text-slate-50 shadow-[0_14px_34px_-10px_rgba(37,99,235,0.45)] ring-2 ring-blue-400/50"
            : "border-slate-700 bg-slate-900/85 hover:border-blue-400/60 hover:bg-slate-900 text-slate-100 hover:shadow-[0_16px_34px_-16px_rgba(37,99,235,0.35)] hover:-translate-y-0.5"
        } ${isRecommendedStyle && !isSelected ? "border-l-4 border-l-blue-400 bg-gradient-to-r from-blue-950/50 to-slate-900/90" : ""}`}
      >
        {recommendation && (
          <span className="absolute top-2 right-2 rounded-full bg-blue-500/12 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-blue-200">
            {recommendation}
          </span>
        )}
        <div className="tabular-nums min-w-0">
          <div className="font-semibold text-slate-900">{lineA}</div>
          <div className="text-slate-500 font-normal text-xs mt-0.5">
            {singleUser ? labelA : `Your time (${labelA})`}
          </div>
          {!singleUser && (
            <>
              <div className="font-semibold text-slate-900 mt-2">{lineB}</div>
              <div className="text-slate-500 font-normal text-xs mt-0.5">Their time ({labelB})</div>
            </>
          )}
        </div>
        {isSelected && (
          <span className="shrink-0 mt-0.5 [&_svg]:text-[var(--accent-blue)]" aria-hidden>
            <CheckCircleIcon />
          </span>
        )}
      </button>
    </li>
  );
}

interface OverlapResultsProps {
  /** All slots across all days (used for empty-state and selection validation). */
  allSlots: OverlapSlotResult[];
  /** Slots for the currently selected day only (shown in the list when using day picker). */
  slotsForSelectedDay: OverlapSlotResult[];
  suggestedSlots: OverlapSlotResult[];
  /** When set (two-person mode), slots for selected day with score + recommendation labels. Drives Recommended vs All UI. */
  rankedSlotsForSelectedDay?: RankedSlot[] | undefined;
  selectedSlot: OverlapSlotResult | null;
  onSelectSlot: (slot: OverlapSlotResult | null) => void;
  zoneA: string;
  /** Second timezone (only shown when singleUser is false). */
  zoneB?: string;
  /** When true, show only user's time (single-user scheduling). */
  singleUser?: boolean;
  /** When true, user has valid input but no slots (e.g. fully booked week). */
  hasValidInputNoOverlap?: boolean;
  /** When true, show message that time zone/working hours are required. */
  showInputPrompt?: boolean;
}

export function OverlapResults({
  allSlots,
  slotsForSelectedDay,
  suggestedSlots,
  rankedSlotsForSelectedDay,
  selectedSlot,
  onSelectSlot,
  zoneA,
  zoneB,
  singleUser = false,
  hasValidInputNoOverlap = false,
  showInputPrompt = true,
}: OverlapResultsProps) {
  const cardTitle = singleUser ? "Your available times" : "Mutual availability";
  const cardSubtitle = !singleUser
    ? "Based on your calendar and their entered availability."
    : null;

  if (showInputPrompt && allSlots.length === 0 && !hasValidInputNoOverlap) {
    return (
      <Card title={cardTitle} icon={<ClockIcon />}>
        <div className="py-5 px-1">
          <p className="text-sm text-slate-600 leading-relaxed">
            {singleUser
              ? "Enter your time zone and working hours to see your availability."
              : "Enter your time zone and working hours, then add the other person's availability to see mutual times."}
          </p>
        </div>
      </Card>
    );
  }

  if (hasValidInputNoOverlap && allSlots.length === 0) {
    return (
      <Card title={cardTitle} icon={<ClockIcon />}>
        <div className="py-5 px-1">
          <p className="text-sm font-medium text-amber-700 leading-relaxed">
            {singleUser
              ? "No availability this week"
              : "No mutual availability in this range"}
          </p>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            {singleUser
              ? "Try different working hours or connect your calendar above."
              : "Try adding more times for the other person or adjusting your working hours."}
          </p>
        </div>
      </Card>
    );
  }

  const tzA = resolveTimezone(zoneA);
  const labelA = getZoneDisplayName(tzA);
  const tzB = zoneB ? resolveTimezone(zoneB) : tzA;
  const labelB = getZoneDisplayName(tzB);
  const useRanked = rankedSlotsForSelectedDay && rankedSlotsForSelectedDay.length > 0;
  const sortedSlots = useRanked
    ? rankedSlotsForSelectedDay.map((r) => r.slot)
    : [...slotsForSelectedDay].sort((a, b) => a.startISO.localeCompare(b.startISO));
  /* Top 1–3 best matches only in Recommended; rest only in All available (no duplicate) */
  const recommended = useRanked
    ? rankedSlotsForSelectedDay.filter((r) => r.recommendation != null).slice(0, 3)
    : [];
  const recommendedISO = new Set(recommended.map((r) => r.slot.startISO));
  const allAvailableOnly = useRanked
    ? rankedSlotsForSelectedDay!.filter((r) => !recommendedISO.has(r.slot.startISO))
    : [];
  const firstSuggestedISO = suggestedSlots[0]?.startISO;
  const noSlotsThisDay = allSlots.length > 0 && slotsForSelectedDay.length === 0;

  return (
    <Card title={cardTitle} icon={<ClockIcon />}>
      {cardSubtitle && (
        <p className="text-xs text-slate-500 mb-3 -mt-1">{cardSubtitle}</p>
      )}
      {noSlotsThisDay ? (
        <div className="py-6 px-1 text-center">
          <p className="text-sm font-medium text-slate-600">
            {singleUser
              ? "No availability for this day"
              : "No mutual availability for this day"}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {singleUser
              ? "Select another day above or adjust working hours."
              : "Try another day or add more times for them in the section below."}
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-600 mb-3">
            {singleUser
              ? "Select a time:"
              : "Times when you're both available — select one:"}
          </p>
          {useRanked ? (
            <>
              {recommended.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Recommended times
                  </h3>
                  <ul className="space-y-2.5">
                    {recommended.map((r) => (
                      <SlotRow
                        key={r.slot.startISO}
                        slot={r.slot}
                        recommendation={r.recommendation}
                        isSelected={selectedSlot?.startISO === r.slot.startISO}
                        isRecommendedStyle
                        onSelectSlot={onSelectSlot}
                        tzA={tzA}
                        tzB={tzB}
                        labelA={labelA}
                        labelB={labelB}
                        singleUser={!!singleUser}
                      />
                    ))}
                  </ul>
                </div>
              )}
              {(allAvailableOnly.length > 0 || recommended.length === 0) && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    {recommended.length > 0 ? "All available times" : "Available times"}
                  </h3>
                  <ul className="space-y-2.5">
                    {(recommended.length > 0 ? allAvailableOnly : rankedSlotsForSelectedDay!).map((r) => (
                      <SlotRow
                        key={r.slot.startISO}
                        slot={r.slot}
                        recommendation={null}
                        isSelected={selectedSlot?.startISO === r.slot.startISO}
                        isRecommendedStyle={false}
                        onSelectSlot={onSelectSlot}
                        tzA={tzA}
                        tzB={tzB}
                        labelA={labelA}
                        labelB={labelB}
                        singleUser={!!singleUser}
                      />
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <ul className="space-y-2.5">
              {sortedSlots.map((slot) => {
                const isSelected = selectedSlot?.startISO === slot.startISO;
                const isRecommended = slot.startISO === firstSuggestedISO;
                const lineA = formatSlotInZone(slot.startISO, slot.endISO, tzA);
                const lineB = formatSlotInZone(slot.startISO, slot.endISO, tzB);
                return (
                  <li key={slot.startISO}>
                    <button
                      type="button"
                      onClick={() => onSelectSlot(isSelected ? null : slot)}
                      className={`w-full text-left rounded-xl border-2 px-4 py-3.5 text-sm font-medium transition-all duration-300 flex items-start justify-between gap-3 relative overflow-hidden ${
                        isSelected
                          ? "border-blue-500 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 text-slate-900 shadow-[0_8px_24px_-6px_rgba(37,99,235,0.35)] ring-2 ring-blue-400/50"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/95 text-slate-800 hover:shadow-lg hover:-translate-y-0.5"
                      } ${isRecommended && !isSelected ? "border-l-4 border-l-cyan-500" : ""}`}
                    >
                      {isRecommended && (
                        <span className="absolute top-2 right-2 text-[10px] font-semibold uppercase tracking-wider text-cyan-600/80">Best</span>
                      )}
                      <div className="tabular-nums min-w-0">
                        <div className="font-semibold text-slate-900">{lineA}</div>
                        <div className="text-slate-500 font-normal text-xs mt-0.5">
                          {singleUser ? labelA : `Your time (${labelA})`}
                        </div>
                        {!singleUser && (
                          <>
                            <div className="font-semibold text-slate-900 mt-2">{lineB}</div>
                            <div className="text-slate-500 font-normal text-xs mt-0.5">Their time ({labelB})</div>
                          </>
                        )}
                      </div>
                      {isSelected && (
                        <span className="shrink-0 mt-0.5 [&_svg]:text-[var(--accent-blue)]" aria-hidden>
                          <CheckCircleIcon />
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </Card>
  );
}
