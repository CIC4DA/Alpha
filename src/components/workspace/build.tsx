"use client";

import { useState } from "react";
import { BUILD_STEPS } from "@/lib/fixtures";
import { AppPreview } from "./app-preview";
import { AgentsCanvas, type AgentId } from "./agents";
import { Button } from "../ui";

export function BuildCanvas({ done, demo, onNext, openAgent = null }: { done: number; demo: boolean; onNext: () => void; openAgent?: AgentId | null }) {
  const [tab, setTab] = useState<"preview" | "agents">(openAgent ? "agents" : "preview");
  const finished = done >= BUILD_STEPS.length;
  const revealed = BUILD_STEPS.slice(0, done).filter((s) => s.reveals !== undefined).length;
  const current = BUILD_STEPS[done];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-4 border-b border-line bg-surface px-5">
        <div className="flex gap-1" role="tablist">
          {(["preview", "agents"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 px-3 py-3 text-sm capitalize ${tab === t ? "border-blue font-medium" : "border-transparent text-ink-3 hover:text-ink"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-3 py-2">
          <div className="w-40" aria-label={`Build progress: ${done} of ${BUILD_STEPS.length} steps`}>
            <div className="h-1.5 rounded-full bg-line">
              <div className="h-1.5 rounded-full bg-blue transition-[width]" style={{ width: `${(done / BUILD_STEPS.length) * 100}%` }} />
            </div>
          </div>
          {finished ? (
            <Button size="sm" variant="primary" onClick={onNext}>
              Test it on your files
            </Button>
          ) : (
            <span className="text-[13px] text-ink-2">{current?.label}</span>
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1 p-5">
        {tab === "preview" ? <AppPreview revealed={revealed} demo={demo} building={!finished} /> : <AgentsCanvas initialOpen={openAgent} />}
      </div>
    </div>
  );
}
