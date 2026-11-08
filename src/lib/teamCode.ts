const TEAM_CODES: Record<string, string> = {
  arsenal: "ARS",
  "aston villa": "AVL",
  bournemouth: "BOU",
  brentford: "BRE",
  brighton: "BHA",
  burnley: "BUR",
  chelsea: "CHE",
  coventry: "COV",
  "crystal palace": "CRY",
  everton: "EVE",
  fulham: "FUL",
  hull: "HUL",
  ipswich: "IPS",
  leeds: "LEE",
  leicester: "LEI",
  liverpool: "LIV",
  "man city": "MCI",
  "man united": "MUN",
  "man utd": "MUN",
  "manchester city": "MCI",
  "manchester united": "MUN",
  newcastle: "NEW",
  "nott'm forest": "NFO",
  "nottingham forest": "NFO",
  southampton: "SOU",
  spurs: "TOT",
  sunderland: "SUN",
  tottenham: "TOT",
  "tottenham hotspur": "TOT",
  "west ham": "WHU",
  wolves: "WOL",
  wolverhampton: "WOL",
  "wolverhampton wanderers": "WOL",
};

export function teamCode(name: string): string {
  const normalized = typeof name === "string" ? name.trim().toLowerCase() : "";
  const mapped = TEAM_CODES[normalized];
  if (mapped) return mapped;

  const letters = normalized.replace(/[^a-z]/g, "").toUpperCase();
  return letters.slice(0, 3).padEnd(3, "-");
}
