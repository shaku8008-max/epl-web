"use client";

import Dropdown from "@/components/Dropdown";
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
  return <Dropdown
    label={label}
    labelId={labelId}
    triggerId={triggerId}
    options={teams.map((team) => ({
      value: team,
      label: team,
      searchText: teamCode(team),
      badge: <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-tint text-xs font-semibold tracking-wide text-ink">{teamCode(team)}</span>,
      disabled: team === otherTeam && team !== value,
      tag: team === otherTeam && team !== value ? (side === "home" ? "Playing away" : "Playing home") : undefined,
    }))}
    value={value}
    onChange={onChange}
    searchable
    open={open}
    onOpen={onOpen}
    onClose={onClose}
    emptyMessage="No teams match"
    triggerClassName="min-h-12 text-lg"
    panelClassName="w-full max-w-none"
  />;
}
