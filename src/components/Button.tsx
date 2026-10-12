import type { ButtonHTMLAttributes } from "react";

// Styled button with two variants: primary (filled green) and secondary
// (outlined). Supports the usual button attributes, including disabled.
// Plain server component for now; add "use client" at the call site later if
// it ever needs an onClick handler.
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export default function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50";
  const look =
    variant === "primary"
      ? "bg-primary text-white hover:bg-primary-light"
      : "border border-primary text-primary hover:bg-tint";

  return <button className={`${base} ${look} ${className}`} {...props} />;
}