import type { ButtonHTMLAttributes } from "react";

// Styled button with two variants: primary (filled green) and secondary
// (outlined). Supports the usual button attributes, including onClick and
// disabled. This file has no "use client" line on purpose: it uses no
// server-only features, so it works inside both server and client components.
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export default function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex min-h-11 items-center justify-center rounded-full px-5 py-2 text-sm font-semibold transition-colors active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50";
  const look =
    variant === "primary"
      ? "bg-primary text-white hover:bg-primary-light"
      : "border border-primary text-primary hover:bg-tint";

  return <button className={`${base} ${look} ${className}`} {...props} />;
}