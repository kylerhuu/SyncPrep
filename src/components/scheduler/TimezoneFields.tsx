"use client";

import { Input } from "@/components/ui/Input";

interface TimezoneFieldsProps {
  zoneA: string;
  zoneB: string;
  onZoneAChange: (v: string) => void;
  onZoneBChange: (v: string) => void;
  errorZoneA?: string;
  errorZoneB?: string;
}

export function TimezoneFields({
  zoneA,
  zoneB,
  onZoneAChange,
  onZoneBChange,
  errorZoneA,
  errorZoneB,
}: TimezoneFieldsProps) {
  return (
    <div className="space-y-4">
      <Input
        label="Your time zone (or city)"
        value={zoneA}
        onChange={(e) => onZoneAChange(e.target.value)}
        placeholder="e.g. America/New_York or New York"
        error={errorZoneA}
      />
      <Input
        label="Other person's time zone (or city)"
        value={zoneB}
        onChange={(e) => onZoneBChange(e.target.value)}
        placeholder="e.g. Europe/London or London"
        error={errorZoneB}
      />
    </div>
  );
}
