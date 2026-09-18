import Link from "next/link";

type ButtonVariant = "primary" | "secondary" | "ghost";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-ink hover:bg-[#d8ff33] disabled:opacity-40",
  secondary:
    "border border-line bg-transparent text-foreground hover:border-accent/50 hover:text-accent",
  ghost: "text-muted hover:text-foreground",
};

export function Button({
  children,
  href,
  variant = "primary",
  className = "",
  type = "button",
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  href?: string;
  variant?: ButtonVariant;
  className?: string;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
}) {
  const styles = `inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium transition ${variants[variant]} ${className}`;
  if (href) {
    return (
      <Link href={href} className={styles}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={styles} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
