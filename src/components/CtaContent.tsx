type CtaContentProps = {
  label: string;
};

export default function CtaContent({ label }: CtaContentProps) {
  return (
    <span className="cta-content">
      <span className="cta-label">
        <span className="cta-dot-slot" aria-hidden="true" />
        <span>{label}</span>
      </span>
      <span className="cta-reveal" aria-hidden="true">
        <span>{label}</span>
        <svg className="cta-arrow" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9h11" />
          <path d="m9.5 4.5 4.5 4.5-4.5 4.5" />
        </svg>
      </span>
    </span>
  );
}
