// One team's news block on the Jev page: the team name, then either a clear
// "no reported injuries" state, a "news unavailable" state, or a list of
// players. Each player shows name, position, an OUT/DOUBTFUL badge (colour
// plus a text label, so colour is never the only signal), the chance of
// playing for doubtful players, and FPL's news text. Server component.

import { playerLevel } from "@/lib/jev";
import type { JevTeamNews as JevTeamNewsType } from "@/lib/types";

type JevTeamNewsProps = {
  teamName: string;
  news: JevTeamNewsType | null;
};

export default function JevTeamNews({ teamName, news }: JevTeamNewsProps) {
  const players = news?.players ?? null;

  return (
    <div>
      <h3 className="font-heading text-base font-semibold">{teamName}</h3>
      {players === null ? (
        <p className="mt-1 text-sm text-muted">News unavailable</p>
      ) : players.length === 0 ? (
        <p className="mt-1 text-sm text-muted">
          No reported injuries or suspensions
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {players.map((p) => {
            const level = playerLevel(p);
            return (
              <li
                key={p.name}
                className="rounded-card border border-border bg-surface p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-sm text-muted">{p.position ?? "–"}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {level === "out" && (
                    <span className="rounded-full bg-out px-2 py-0.5 text-xs font-semibold text-white">
                      OUT
                    </span>
                  )}
                  {level === "doubtful" && (
                    <span className="rounded-full bg-doubtful px-2 py-0.5 text-xs font-semibold text-white">
                      DOUBTFUL
                    </span>
                  )}
                  {level === "doubtful" && p.chance_of_playing !== null && (
                    <span className="text-xs text-muted">
                      {p.chance_of_playing}% chance of playing
                    </span>
                  )}
                </div>
                {p.news && (
                  <p className="mt-1 text-sm text-muted line-clamp-3">{p.news}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
