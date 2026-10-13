import type { ReactNode } from "react";

// Content container: rounded, soft border and shadow. Use variant="white" for
// a white surface or variant="tint" (the default) for the light green-grey tint.
type CardProps = {
  children: ReactNode;
  variant?: "tint" | "white";
  className?: string;
};

export default function Card({
  children,
  variant = "tint",
  className = "",
}: CardProps) {
  const background = variant === "white" ? "bg-surface shadow-card" : "bg-tint";
  return (
    <div
      className={`rounded-card border border-border p-6 ${background} ${className}`}
    >
      {children}
    </div>
  );
}