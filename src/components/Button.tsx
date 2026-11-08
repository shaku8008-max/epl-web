import type { ButtonHTMLAttributes } from "react";

// Styled button with two variants: primary (filled near-black) and secondary
// (outlined). Supports the usual button attributes, including onClick and
// disabled. This file has no "use client" line on purpose: it uses no
// server-only features, so it works inside both server and client components.
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export const buttonBase =
  "inline-flex min-h-12 items-center justify-center rounded-button px-5 py-2 text-base font-semibold transition-colors active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-50";

export const buttonLooks = {
  primary: "border border-edge bg-accent text-white hover:bg-accent-dark",
  secondary: "border border-edge bg-white text-ink hover:bg-tint",
} as const;

export default function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  return <button className={`${buttonBase} ${buttonLooks[variant]} ${className}`} {...props} />;
}
