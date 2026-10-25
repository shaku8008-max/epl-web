// The two team dropdowns with a swap button between them. Used inside
// MatchupTool (client bundle) but keeps no state of its own.

import Button from "@/components/Button";

type TeamPickerProps = {
  teams: string[];
  home: string;
  away: string;
  onHomeChange: (team: string) => void;
  onAwayChange: (team: string) => void;
  onSwap: () => void;
};

const selectClasses =
  "mt-1 min-h-12 w-full rounded-card border border-border bg-white px-3 py-2 text-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export default function TeamPicker({
  teams,
  home,
  away,
  onHomeChange,
  onAwayChange,
  onSwap,
}: TeamPickerProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-end">
      <div className="min-w-0">
        <label htmlFor="home-team" className="flex items-center gap-2 text-base font-medium">
          <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full bg-home" />
          Home team
        </label>
        <select
          id="home-team"
          value={home}
          onChange={(e) => onHomeChange(e.target.value)}
          className={selectClasses}
        >
          {teams.map((team) => (
            <option key={team} value={team}>
              {team}
            </option>
          ))}
        </select>
      </div>

      <Button
        variant="secondary"
        onClick={onSwap}
        aria-label="Swap home and away teams"
        title="Swap home and away teams"
        className="!h-12 !min-h-12 !min-w-12 !w-12 !shrink-0 !rounded-card !border-border !bg-white !p-0 !text-ink justify-self-center self-center sm:self-end"
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
        <select
          id="away-team"
          value={away}
          onChange={(e) => onAwayChange(e.target.value)}
          className={selectClasses}
        >
          {teams.map((team) => (
            <option key={team} value={team}>
              {team}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
