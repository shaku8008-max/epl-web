"use client";

// The two searchable team comboboxes with a swap button between them. TeamPicker
// owns which panel is open; matchup values remain owned by the tool above.

import Button from "@/components/Button";
import TeamDropdown from "@/components/TeamDropdown";
import { useState } from "react";

type TeamPickerProps = {
  teams: string[];
  home: string;
  away: string;
  onHomeChange: (team: string) => void;
  onAwayChange: (team: string) => void;
  onSwap: () => void;
};

export default function TeamPicker({
  teams,
  home,
  away,
  onHomeChange,
  onAwayChange,
  onSwap,
}: TeamPickerProps) {
  const [openSide, setOpenSide] = useState<"home" | "away" | null>(null);

  return (
    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-end">
      <div className="min-w-0">
        <label
          id="home-team-label"
          htmlFor="home-team-trigger"
          className="flex items-center gap-2 text-base font-medium"
        >
          <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full bg-home" />
          Home team
        </label>
        <TeamDropdown
          side="home"
          label="Home team"
          labelId="home-team-label"
          triggerId="home-team-trigger"
          teams={teams}
          value={home}
          otherTeam={away}
          open={openSide === "home"}
          onOpen={() => setOpenSide("home")}
          onClose={() => setOpenSide(null)}
          onChange={onHomeChange}
        />
      </div>

      <Button
        variant="secondary"
        onClick={onSwap}
        aria-label="Swap home and away teams"
        title="Swap home and away teams"
        className="!h-12 !min-h-12 !min-w-12 !w-12 !shrink-0 !rounded-full !border-edge !bg-white !p-0 !text-ink justify-self-center self-center sm:self-end"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 rotate-90 sm:rotate-0"
        >
          <path d="M4 8h14l-3-3" />
          <path d="M20 16H6l3 3" />
        </svg>
      </Button>

      <div className="min-w-0">
        <label htmlFor="away-team" className="flex items-center gap-2 text-base font-medium">
          <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full bg-away" />
          Away team
        </label>
        <TeamDropdown
          side="away"
          label="Away team"
          labelId="away-team-label"
          triggerId="away-team-trigger"
          teams={teams}
          value={away}
          otherTeam={home}
          open={openSide === "away"}
          onOpen={() => setOpenSide("away")}
          onClose={() => setOpenSide(null)}
          onChange={onAwayChange}
        />
      </div>
    </div>
  );
}
