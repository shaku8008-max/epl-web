import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes } from "react";
import { buttonBase, buttonLooks } from "@/components/Button";
import CtaContent from "@/components/CtaContent";

type LinkButtonProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> &
  Pick<LinkProps, "href"> & { variant?: "primary" | "secondary" | "cta" };

export default function LinkButton({ variant = "primary", className = "", children, ...props }: LinkButtonProps) {
  return (
    <Link className={`${buttonBase} ${buttonLooks[variant]} ${className}`} {...props}>
      {variant === "cta" && typeof children === "string" ? <CtaContent label={children} /> : children}
    </Link>
  );
}
