"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Loader2, Wallet } from "lucide-react";
import { getCredits, topUp, type Credits } from "@/lib/store";
import { money } from "./ui";

const AMOUNTS = [10, 25, 50];

export function useCredits() {
  const [c, setC] = useState<Credits | null>(null);
  useEffect(() => {
    const load = () => getCredits().then(setC).catch(() => {});
    load();
    window.addEventListener("alpha:projects", load);
    window.addEventListener("alpha:org", load);
    return () => {
      window.removeEventListener("alpha:projects", load);
      window.removeEventListener("alpha:org", load);
    };
  }, []);
  return c;
}

/** The meter used on the panel and the usage page: what's used, out of the allowance plus top-ups. */
export function CreditMeter({ c }: { c: Credits }) {
  const total = c.allowance + c.toppedUp;
  const pct = total ? Math.min((c.used / total) * 100, 100) : 0;
  return (
    <div>
      <div className="h-2 overflow-hidden rounded-full bg-line" role="meter" aria-valuemin={0} aria-valuemax={total} aria-valuenow={c.used} aria-label="Credits used this month">
        <div className={`h-2 rounded-full ${pct > 85 ? "bg-amber" : "bg-blue"}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1.5 text-[12px] text-ink-3">
        {money(c.used)} used of {money(total)} this month ({c.plan} plan {money(c.allowance)}
        {c.toppedUp > 0 ? ` + ${money(c.toppedUp)} top-ups` : ""})
      </p>
    </div>
  );
}

/** Quick top-up: pick an amount, confirm once. Simulated in the prototype. */
export function TopUp({ onDone }: { onDone?: () => void }) {
  const [pick, setPick] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return (
      <p className="flex items-center gap-1.5 text-sm text-green">
        <Check size={15} /> Added {money(done)}.
      </p>
    );
  }
  return (
    <div>
      <div className="flex gap-1.5" role="group" aria-label="Top-up amount">
        {AMOUNTS.map((a) => (
          <button
            key={a}
            onClick={() => setPick(a)}
            aria-pressed={pick === a}
            className={`h-8 flex-1 rounded-md border text-[13px] font-medium ${pick === a ? "border-blue bg-blue-wash text-blue-ink" : "border-line-strong hover:border-ink-3"}`}
          >
            {money(a)}
          </button>
        ))}
      </div>
      <button
        disabled={!pick || busy}
        onClick={async () => {
          if (!pick) return;
          setBusy(true);
          setError(null);
          try {
            await topUp(pick);
            setDone(pick);
            onDone?.();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
        className="mt-2 flex h-8 w-full items-center justify-center gap-1.5 rounded-md bg-blue text-[13px] font-medium text-white hover:bg-blue-ink disabled:opacity-45"
      >
        {busy && <Loader2 size={14} className="animate-spin" />} {pick ? `Add ${money(pick)}` : "Choose an amount"}
      </button>
      {error && <p className="mt-1.5 text-[12px] text-red">{error}</p>}
      <p className="mt-1.5 text-[11px] text-ink-3">Simulated in this prototype: no payment is taken.</p>
    </div>
  );
}

/** Balance in the top bar, like today's Architect. Opens a panel with usage and a quick top-up. */
export function CreditsPill({ compact = false }: { compact?: boolean }) {
  const c = useCredits();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  if (!c) return null;
  const low = c.balance < 3;

  return (
    <div ref={box} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Credits"
        className={`flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[13px] font-medium tabular-nums hover:border-ink-3 ${low ? "border-amber/50 text-amber" : "border-line-strong"} ${compact ? "w-full justify-between" : ""}`}
      >
        <span className="flex items-center gap-1.5">
          <Wallet size={14} className={low ? "text-amber" : "text-ink-3"} />
          {money(c.balance)}
        </span>
        {compact && <span className="text-[12px] font-normal text-ink-3">left this month</span>}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Credits"
          className={`absolute z-40 w-[300px] rounded-lg border border-line-strong bg-surface p-4 shadow-[0_12px_32px_-12px_rgba(24,32,46,0.35)] ${compact ? "bottom-full left-0 mb-2" : "right-0 top-full mt-2"}`}
        >
          <p className="text-[12px] text-ink-3">Credits left</p>
          <p className={`text-2xl font-semibold tabular-nums ${low ? "text-amber" : ""}`}>{money(c.balance)}</p>
          <div className="mt-3">
            <CreditMeter c={c} />
          </div>

          {c.byProject.length > 0 && (
            <ul className="mt-3 space-y-1 text-[13px]">
              {c.byProject.slice(0, 3).map((p) => (
                <li key={p.id} className="flex justify-between gap-3">
                  <span className="truncate text-ink-2">{p.name}</span>
                  <span className="tabular-nums">{money(p.spend)}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/usage" onClick={() => setOpen(false)} className="mt-3 inline-block text-[13px] font-medium text-blue hover:underline">
            See full usage
          </Link>

          <div className="mt-4 border-t border-line pt-3">
            <p className="mb-2 text-[13px] font-medium">Top up</p>
            <TopUp />
          </div>
        </div>
      )}
    </div>
  );
}
