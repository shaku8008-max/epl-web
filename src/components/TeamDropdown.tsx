"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { teamCode } from "@/lib/teamCode";

type TeamDropdownProps = {
  side: "home" | "away";
  label: string;
  labelId: string;
  triggerId: string;
  teams: string[];
  value: string;
  otherTeam: string;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onChange: (team: string) => void;
};

export default function TeamDropdown({
  side,
  label,
  labelId,
  triggerId,
  teams,
  value,
  otherTeam,
  open,
  onOpen,
  onClose,
  onChange,
}: TeamDropdownProps) {
  const instanceId = useId().replace(/:/g, "");
  const listboxId = `${instanceId}-${side}-listbox`;
  const searchId = `${instanceId}-${side}-search`;
  const valueId = `${instanceId}-${side}-value`;
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [search, setSearch] = useState("");
  const [activeTeam, setActiveTeam] = useState(value);

  const matchingTeams = teams.filter((team) => {
    const query = search.toLowerCase();
    return team.toLowerCase().includes(query) || teamCode(team).toLowerCase().includes(query);
  });
  const enabledTeams = matchingTeams.filter((team) => team !== otherTeam || team === value);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => searchRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function closeOnOutsidePointer(event: PointerEvent) {
      if (!panelRef.current?.contains(event.target as Node)) onClose();
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [onClose, open]);

  useEffect(() => {
    if (!open || !activeTeam) return;
    optionRefs.current[activeTeam]?.scrollIntoView({ block: "nearest" });
  }, [activeTeam, open]);

  function choose(team: string) {
    if (team === otherTeam && team !== value) return;
    onChange(team);
    onClose();
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function resetForOpen() {
    const allEnabledTeams = teams.filter((team) => team !== otherTeam || team === value);
    setSearch("");
    setActiveTeam(allEnabledTeams.includes(value) ? value : (allEnabledTeams[0] ?? ""));
    onOpen();
  }

  function moveActive(direction: 1 | -1) {
    if (enabledTeams.length === 0) return;
    const currentIndex = enabledTeams.indexOf(activeTeam);
    const nextIndex = Math.min(
      enabledTeams.length - 1,
      Math.max(
        0,
        currentIndex < 0
          ? direction === 1
            ? 0
            : enabledTeams.length - 1
          : currentIndex + direction
      )
    );
    setActiveTeam(enabledTeams[nextIndex]);
  }

  function closeAndRestoreFocus() {
    onClose();
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveActive(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveActive(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveTeam(enabledTeams[0] ?? "");
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveTeam(enabledTeams[enabledTeams.length - 1] ?? "");
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (activeTeam) choose(activeTeam);
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeAndRestoreFocus();
    } else if (event.key === "Tab") {
      onClose();
    }
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) resetForOpen();
    }
  }

  return (
    <div ref={panelRef} className="relative mt-1 min-w-0">
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        aria-labelledby={`${labelId} ${valueId}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => (open ? onClose() : resetForOpen())}
        onKeyDown={handleTriggerKeyDown}
        className="flex min-h-12 w-full min-w-0 items-center gap-3 rounded-button border border-edge bg-white px-3 text-left text-lg text-ink outline-none transition-colors hover:bg-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink motion-reduce:transition-none"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-tint text-xs font-semibold tracking-wide text-ink">
          {teamCode(value)}
        </span>
        <span id={valueId} className="min-w-0 flex-1 truncate">{value}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-5 w-5 shrink-0 transition-transform duration-200 ease-out motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="epl-team-dropdown-enter absolute left-0 right-0 top-full z-30 mt-2 origin-top rounded-card border border-edge bg-white p-2 shadow-sm">
          <input
            ref={searchRef}
            id={searchId}
            type="text"
            role="combobox"
            value={search}
            placeholder="Search teams"
            autoComplete="off"
            aria-label={`Search ${label.toLowerCase()}`}
            aria-controls={listboxId}
            aria-expanded="true"
            aria-activedescendant={activeTeam ? `${instanceId}-${side}-option-${teams.indexOf(activeTeam)}` : undefined}
            onChange={(event) => {
              const nextSearch = event.target.value;
              const query = nextSearch.toLowerCase();
              const nextEnabled = teams
                .filter((team) => team.toLowerCase().includes(query) || teamCode(team).toLowerCase().includes(query))
                .filter((team) => team !== otherTeam || team === value);
              setSearch(nextSearch);
              setActiveTeam(nextEnabled[0] ?? "");
            }}
            onKeyDown={handleSearchKeyDown}
            className="min-h-11 w-full rounded-button border border-border bg-white px-3 text-base text-ink outline-none placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          />
          <div className="my-2 border-t border-border" />
          <div
            id={listboxId}
            role="listbox"
            aria-labelledby={labelId}
            className="max-h-64 overflow-y-auto overscroll-contain"
          >
            {matchingTeams.length > 0 ? (
              matchingTeams.map((team) => {
                const disabled = team === otherTeam && team !== value;
                const selected = team === value;
                const active = team === activeTeam;
                const optionId = `${instanceId}-${side}-option-${teams.indexOf(team)}`;

                return (
                  <div
                    key={team}
                    ref={(element) => { optionRefs.current[team] = element; }}
                    id={optionId}
                    role="option"
                    aria-selected={selected}
                    aria-disabled={disabled || undefined}
                    onPointerDown={(event) => {
                      if (!disabled) event.preventDefault();
                    }}
                    onClick={() => choose(team)}
                    onMouseEnter={() => { if (!disabled) setActiveTeam(team); }}
                    className={`flex min-h-11 items-center gap-3 rounded-button px-2 text-base ${
                      disabled
                        ? "cursor-not-allowed text-muted opacity-60"
                        : `cursor-pointer text-ink ${active || selected ? "bg-tint" : "hover:bg-tint"}`
                    }`}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-tint text-xs font-semibold tracking-wide text-ink">
                      {teamCode(team)}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{team}</span>
                    {disabled ? (
                      <span className="shrink-0 text-xs text-muted">
                        {side === "home" ? "Playing away" : "Playing home"}
                      </span>
                    ) : selected ? (
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-4 w-4 shrink-0 text-ink"
                      >
                        <path d="m4 10 4 4 8-8" />
                      </svg>
                    ) : null}
                  </div>
                );
              })
            ) : (
              <div role="status" className="px-2 py-3 text-base text-muted">No teams match</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
