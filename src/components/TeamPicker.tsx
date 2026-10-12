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
  "mt-1 min-h-11 w-full rounded-card border border-border bg-surface px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export default function TeamPicker({
  teams,
  home,
  away,
  onHomeChange,
  onAwayChange,
  onSwap,
}: TeamPickerProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label htmlFor="home-team" className="block text-sm font-medium">
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
        aria-label="Swap home and away"
        className="w-full sm:mb-1 sm:w-auto"
      >
        Swap
      </Button>

      <div className="flex-1">
        <label htmlFor="away-team" className="block text-sm font-medium">
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