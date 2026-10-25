type OutcomeKeyProps = {
  label: string;
  color: string;
};

export default function OutcomeKey({ label, color }: OutcomeKeyProps) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span aria-hidden="true" className={`h-2.5 w-2.5 shrink-0 rounded-full ${color}`} />
      <span>{label}</span>
    </span>
  );
}
