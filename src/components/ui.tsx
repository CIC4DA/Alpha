import Link from "next/link";
import type { Status } from "@/lib/store";

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "quiet" | "ghost" | "danger"; size?: "sm" | "md" };

const base = "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:opacity-45 disabled:cursor-not-allowed";
const variants = {
  primary: "bg-blue text-white hover:bg-blue-ink",
  quiet: "bg-surface text-ink border border-line-strong hover:border-ink-3",
  ghost: "text-ink-2 hover:text-ink hover:bg-line/50",
  danger: "bg-surface text-red border border-line-strong hover:border-red",
};
const sizes = { sm: "h-8 px-3 text-[13px]", md: "h-10 px-4 text-sm" };

export function Button({ variant = "quiet", size = "md", className = "", ...rest }: BtnProps) {
  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest} />;
}

export function ButtonLink({ href, variant = "quiet", size = "md", className = "", children }: { href: string; variant?: keyof typeof variants; size?: "sm" | "md"; className?: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </Link>
  );
}

const statusStyle: Record<Status, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "bg-line/60 text-ink-2" },
  preview: { label: "Preview", cls: "bg-blue-wash text-blue-ink" },
  in_review: { label: "In review", cls: "bg-amber-wash text-amber" },
  live: { label: "Live", cls: "bg-green-wash text-green" },
};

export function StatusBadge({ status }: { status: Status }) {
  const s = statusStyle[status];
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[12px] font-medium ${s.cls}`}>{s.label}</span>;
}

export function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d} days ago`;
}

export function money(n: number) {
  return `$${n.toFixed(2)}`;
}
