import type { ReactNode } from "react";

// Content container: a flat surface with a restrained border.
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
  const background = variant === "white" ? "bg-white" : "bg-tint";
  return (
    <div
      className={`rounded-card border border-border p-6 ${background} ${className}`}
    >
      {children}
    </div>
  );
}
