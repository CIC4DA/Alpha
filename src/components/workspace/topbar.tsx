"use client";

import { Check, Share2, Rocket } from "lucide-react";
import { useState } from "react";
import type { Project, Stage } from "@/lib/store";
import { StatusBadge } from "../ui";

export type View = "builder" | "developer" | "approver";
export const STAGES: { id: Exclude<Stage, "live">; label: string }[] = [
  { id: "plan", label: "Plan" },
  { id: "connect", label: "Connect" },
  { id: "build", label: "Build" },
  { id: "test", label: "Test" },
  { id: "ship", label: "Ship" },
];
const ORDER: Stage[] = ["plan", "connect", "build", "test", "ship", "live"];
export const stageIndex = (s: Stage) => ORDER.indexOf(s);

export function TopBar({
  project,
  viewing,
  onViewStage,
  view,
  onView,
  shipReady,
  onShip,
}: {
  project: Project;
  viewing: Stage;
  onViewStage: (s: Stage) => void;
  view: View;
  onView: (v: View) => void;
  shipReady: boolean;
  onShip: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const reached = stageIndex(project.stage);

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-line bg-surface px-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <h1 className="truncate font-semibold">{project.name}</h1>
        <StatusBadge status={project.status} />
      </div>

      {/* The stepper: reached stages can be reopened; later ones are locked until earlier ones finish. */}
      <nav aria-label="Stages" className="mx-auto flex items-center">
        {STAGES.map((s, i) => {
          const done = reached > i;
          const current = viewing === s.id || (viewing === "live" && s.id === "ship");
          const locked = i > reached;
          return (
            <div key={s.id} className="flex items-center">
              {i > 0 && <span className={`mx-1 h-px w-6 ${reached >= i ? "bg-ink-3" : "bg-line-strong"}`} />}
              <button
                onClick={() => onViewStage(s.id)}
                disabled={locked}
                aria-current={current ? "step" : undefined}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] ${
                  current ? "bg-ink text-white" : locked ? "text-ink-3/60" : "text-ink-2 hover:bg-line/60"
                }`}
              >
                {done && !current ? <Check size={13} className={s.id === "test" ? "text-green" : ""} /> : null}
                {s.label}
              </button>
            </div>
          );
        })}
      </nav>

      <div className="flex items-center gap-2">
        <div className="flex rounded-full border border-line-strong p-0.5 text-[12px]" role="group" aria-label="View">
          {(["builder", "developer", "approver"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => onView(v)}
              aria-pressed={view === v}
              className={`rounded-full px-2.5 py-1 ${view === v ? "bg-blue-wash font-medium text-blue-ink" : "text-ink-2 hover:text-ink"}`}
            >
              {v[0].toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="flex h-8 items-center gap-1.5 rounded-md border border-line-strong px-2.5 text-[13px] hover:border-ink-3"
        >
          <Share2 size={14} /> {copied ? "Link copied" : "Share"}
        </button>
        <button
          onClick={onShip}
          disabled={!shipReady}
          title={shipReady ? "Go to Ship" : "Ship opens once every test passes"}
          className="flex h-8 items-center gap-1.5 rounded-md bg-blue px-3 text-[13px] font-medium text-white hover:bg-blue-ink disabled:cursor-not-allowed disabled:bg-line-strong disabled:text-ink-3"
        >
          <Rocket size={14} /> Ship
        </button>
      </div>
    </header>
  );
}
