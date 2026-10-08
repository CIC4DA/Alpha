"use client";

import { FileText, Sparkles } from "lucide-react";
import { PLAN, QUESTIONS } from "@/lib/fixtures";
import type { Journey } from "@/lib/journey";
import { Button } from "../ui";

export function PlanCanvas({
  name,
  prompt,
  j,
  onToggleSuggested,
  onContinue,
  onOpenSpec,
  done,
}: {
  name: string;
  prompt: string;
  j: Journey;
  onToggleSuggested: (id: string) => void;
  onContinue: () => void;
  onOpenSpec: () => void;
  done: boolean;
}) {
  const answered = QUESTIONS.every((q) => j.answers[q.id]);
  if (!answered) {
    return (
      <div className="flex h-full items-center justify-center p-10">
        <div className="max-w-sm text-center">
          <p className="font-medium">The plan appears here</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-2">Answer the questions on the left. Architect only asks what your prompt left open, and each question has a recommended answer.</p>
        </div>
      </div>
    );
  }

  const rules = QUESTIONS.find((q) => q.id === "rules")!.options.filter((o) => j.answers.rules?.includes(o.id));
  const access = QUESTIONS[0].options.find((o) => o.id === j.answers.access?.[0])?.label ?? j.answers.access?.[0];
  const send = QUESTIONS[1].options.find((o) => o.id === j.answers.send?.[0])?.label ?? j.answers.send?.[0];
  const extra = j.suggestedOn.length;
  const low = PLAN.estimate.low + extra;
  const high = PLAN.estimate.high + extra * 1.5;

  return (
    <div className="mx-auto max-w-[720px] px-4 py-6 sm:px-8 sm:py-8 appear">
      <p className="text-[13px] text-ink-3">Plan, ready to approve</p>
      <h2 className="mt-1 font-serif text-[32px] leading-tight">{name}</h2>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{PLAN.summary}</p>
      {!prompt.toLowerCase().includes("loan") && (
        <p className="mt-3 rounded-md bg-amber-wash px-3 py-2 text-[13px] text-amber">
          This prototype walks every project through the loan-triage example. Your prompt is saved with the project.
        </p>
      )}

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <section>
          <h3 className="text-sm font-semibold">Screens</h3>
          <ul className="mt-2 space-y-2">
            {PLAN.screens.map((s) => (
              <li key={s.name} className="text-sm">
                <span className="font-medium">{s.name}</span>
                <span className="block text-[13px] text-ink-2">{s.detail}</span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="text-sm font-semibold">Agents</h3>
          <ul className="mt-2 space-y-2">
            {PLAN.agents.map((a) => (
              <li key={a.name} className="text-sm">
                <span className="font-medium">{a.name}</span>
                <span className="block text-[13px] text-ink-2">{a.detail}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-8">
        <h3 className="text-sm font-semibold">Rules the agents will follow</h3>
        <p className="text-[13px] text-ink-2">Each becomes a test before you ship.</p>
        <ul className="mt-2 space-y-1.5 text-sm">
          {rules.map((r) => (
            <li key={r.id} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue" />
              {r.label}
            </li>
          ))}
          <li className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue" />
            Sign-in: {access}
          </li>
          <li className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue" />
            Emails: {send}
          </li>
        </ul>
      </section>

      <section className="mt-8 rounded-lg border border-line bg-surface">
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <Sparkles size={15} className="text-ink-3" />
          <h3 className="text-sm font-semibold">Suggested, not in your prompt</h3>
          <span className="ml-auto text-[12px] text-ink-3">Off unless you turn them on</span>
        </div>
        <ul className="divide-y divide-line">
          {PLAN.suggested.map((s) => {
            const on = j.suggestedOn.includes(s.id);
            return (
              <li key={s.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{s.label}</p>
                  <p className="text-[13px] text-ink-2">{s.detail}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={on}
                  aria-label={`Include ${s.label}`}
                  onClick={() => onToggleSuggested(s.id)}
                  disabled={done}
                  className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${on ? "bg-blue" : "bg-line-strong"} disabled:opacity-50`}
                >
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${on ? "translate-x-[18px]" : "translate-x-0.5"}`} />
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
        <button onClick={onOpenSpec} className="flex items-center gap-1.5 text-[13px] text-blue hover:underline">
          <FileText size={14} /> Full spec for developers, saved as PLAN.md
        </button>
        <div className="flex items-center gap-4">
          <p className="text-right text-[13px] leading-snug">
            <span className="font-semibold">
              Estimated ${low}–{high.toFixed(0)}
            </span>
            <span className="block text-ink-3">
              about {PLAN.estimate.minutesLow}–{PLAN.estimate.minutesHigh} minutes; fixes for our mistakes are free
            </span>
          </p>
          <Button variant="primary" onClick={onContinue} disabled={done}>
            {done ? "Plan approved" : "Approve plan"}
          </Button>
        </div>
      </div>
    </div>
  );
}
