"use client";

import { TimezoneInput } from "@/components/scheduler/TimezoneInput";

interface TimezoneFieldsProps {
  zoneA: string;
  zoneB: string;
  onZoneAChange: (v: string) => void;
  onZoneBChange: (v: string) => void;
  errorZoneA?: string;
  errorZoneB?: string;
  /** When true, only show "Your time zone" (single-user scheduling). */
  singleUser?: boolean;
}

export function TimezoneFields({
  zoneA,
  zoneB,
  onZoneAChange,
  onZoneBChange,
  errorZoneA,
  errorZoneB,
  singleUser = false,
}: TimezoneFieldsProps) {
  return (
    <div className="space-y-4">
      <TimezoneInput
        label="Your time zone (or city)"
        value={zoneA}
        onChange={onZoneAChange}
        placeholder="e.g. San Francisco, PST, or America/Los_Angeles"
        error={errorZoneA}
      />
      {!singleUser && (
        <TimezoneInput
          label="Other person's time zone (or city)"
          value={zoneB}
          onChange={onZoneBChange}
          placeholder="e.g. Bangkok, EST, or Europe/London"
          error={errorZoneB}
        />
      )}
    </div>
  );
}
