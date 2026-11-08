import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes } from "react";
import { buttonBase, buttonLooks } from "@/components/Button";

type LinkButtonProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> &
  Pick<LinkProps, "href"> & { variant?: "primary" | "secondary" };

export default function LinkButton({ variant = "primary", className = "", ...props }: LinkButtonProps) {
  return <Link className={`${buttonBase} ${buttonLooks[variant]} ${className}`} {...props} />;
}
