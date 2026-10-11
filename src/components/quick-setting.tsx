"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type QuickOption<T extends string> = {
  id: T;
  label: string;
  detail?: string;
};

/** A compact setting in the composer's toolbar: shows its current value, opens a short list of choices. */
export function QuickSetting<T extends string>({
  label,
  icon: Icon,
  value,
  options,
  onChange,
  footer,
  disabled,
  inline,
}: {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  value: T;
  options: QuickOption<T>[];
  onChange: (v: T) => void;
  footer?: React.ReactNode;
  disabled?: boolean;
  inline?: boolean; // reads as part of a sentence, menu opens below
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.id === value);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node))
        setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div ref={box} className={inline ? "relative inline-block" : "relative"}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${label}: ${current?.label ?? value}`}
        className={
          inline
            ? `inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium text-ink transition-colors disabled:opacity-50 ${open ? "bg-blue-wash text-blue-ink" : "hover:bg-surface"}`
            : `flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-[12.5px] transition-colors disabled:opacity-50 ${
                open
                  ? "border-blue bg-blue-wash text-blue-ink"
                  : "border-line bg-paper/70 text-ink-2 hover:border-line-strong hover:text-ink"
              }`
        }
      >
        {!inline && <Icon size={14} className="shrink-0" />}
        {!inline && <span className="hidden whitespace-nowrap text-ink-3 sm:inline">{label}</span>}
        <span className="max-w-[11rem] truncate font-medium text-ink">
          {current?.label ?? value}
        </span>
        <ChevronDown
          size={13}
          className={`shrink-0 text-ink-3 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div
          role="menu"
          aria-label={label}
          className={`absolute left-0 z-30 w-[18rem] max-w-[calc(100vw-5rem)] ${inline ? "top-full mt-1.5" : "bottom-full mb-2"} rounded-xl border border-line bg-surface p-1.5 shadow-[0_12px_32px_-12px_rgba(24,32,46,0.28)]`}
        >
          {options.map((o) => (
            <button
              key={o.id}
              role="menuitemradio"
              aria-checked={o.id === value}
              onClick={() => {
                onChange(o.id);
                setOpen(false);
              }}
              className={`flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-paper ${o.id === value ? "bg-blue-wash/60" : ""}`}
            >
              <Check
                size={14}
                className={`mt-0.5 shrink-0 ${o.id === value ? "text-blue" : "invisible"}`}
              />
              <span className="min-w-0">
                <span className="block text-[13px] font-medium">{o.label}</span>
                {o.detail && (
                  <span className="block text-[12px] leading-snug text-ink-3">
                    {o.detail}
                  </span>
                )}
              </span>
            </button>
          ))}
          {footer && (
            <div className="mt-1 border-t border-line px-2.5 pb-1 pt-2 text-[12px] text-ink-3">
              {footer}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
