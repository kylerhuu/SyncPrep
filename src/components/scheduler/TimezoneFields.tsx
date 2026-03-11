"use client";

export function TimezoneFields({
  zoneA,
  zoneB,
  onZoneAChange,
  onZoneBChange,
}: {
  zoneA: string;
  zoneB: string;
  onZoneAChange: (v: string) => void;
  onZoneBChange: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Your time zone (or city)</label>
        <input
          type="text"
          value={zoneA}
          onChange={(e) => onZoneAChange(e.target.value)}
          placeholder="e.g. America/New_York or New York"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Other person&apos;s time zone (or city)</label>
        <input
          type="text"
          value={zoneB}
          onChange={(e) => onZoneBChange(e.target.value)}
          placeholder="e.g. Europe/London or London"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}
