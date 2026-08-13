import { clsx } from "clsx";
import Link from "next/link";
import { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  href?: string;
}

export function Button({ variant = "primary", className, href, children, ...props }: Props) {
  const styles = clsx(
    "focus-ring inline-flex items-center justify-center gap-2 rounded-card px-5 py-2.5 text-sm font-medium transition-colors",
    variant === "primary" && "bg-ink text-paper hover:bg-seal-dark",
    variant === "secondary" && "bg-transparent text-ink border border-ink/20 hover:border-ink/50",
    variant === "ghost" && "bg-transparent text-ink hover:bg-ink/5",
    className
  );
  if (href) {
    return (
      <Link href={href} className={styles}>
        {children}
      </Link>
    );
  }
  return (
    <button className={styles} {...props}>
      {children}
    </button>
  );
}
