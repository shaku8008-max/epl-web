// Small original pitch mark, drawn as inline SVG (not a club badge or league
// logo). Uses currentColor so it inherits the colour of its surroundings.
type PitchIconProps = {
  className?: string;
};

export default function PitchIcon({ className }: PitchIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
      <path d="M12 4.5v15" />
      <circle cx="12" cy="12" r="3" />
      <path d="M2.5 8.5h3v7h-3" />
      <path d="M21.5 8.5h-3v7h3" />
    </svg>
  );
}