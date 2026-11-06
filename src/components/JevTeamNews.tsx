// One team's news block on the Jev page: the team name, then either a clear
// "no reported injuries" state, a "news unavailable" state, or a list of
// players. Each player shows name, position, an OUT/DOUBTFUL badge (colour
// plus a text label, so colour is never the only signal), the chance of
// playing for doubtful players, and FPL's news text. Server component.

import { chanceTone, playerBadgeTone, playerCardTone, playerLevel } from "@/lib/jev";
import type { JevTeamNews as JevTeamNewsType } from "@/lib/types";

type JevTeamNewsProps = {
  teamName: string;
  news: JevTeamNewsType | null;
};

export default function JevTeamNews({ teamName, news }: JevTeamNewsProps) {
  const players = news?.players ?? null;

  return (
    <div>
      <h3 className="font-heading text-lg font-semibold">{teamName}</h3>
      {players === null ? (
        <p className="mt-2 rounded-card border-l-4 border-draw bg-draw-soft p-3 text-base text-muted">
          News unavailable
        </p>
      ) : players.length === 0 ? (
        <p className="mt-2 rounded-card border-l-4 border-better bg-better-soft p-3 text-base text-muted">
          No reported injuries or suspensions
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {players.map((p) => {
            const level = playerLevel(p);
            return (
              <li
                key={p.name}
                className={`rounded-card border-l-4 p-3 ${playerCardTone(level)}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-base text-muted">{p.position ?? "-"}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {level === "out" && (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${playerBadgeTone(level)}`}>
                      OUT
                    </span>
                  )}
                  {level === "doubtful" && (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${playerBadgeTone(level)}`}>
                      DOUBTFUL
                    </span>
                  )}
                  {level === "doubtful" && p.chance_of_playing !== null && (
                    <span className={`text-sm ${chanceTone(p.chance_of_playing)}`}>
                      {p.chance_of_playing}% chance of playing
                    </span>
                  )}
                </div>
                {p.news && (
                  <p className="mt-2 text-base leading-relaxed text-muted line-clamp-3">{p.news}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
