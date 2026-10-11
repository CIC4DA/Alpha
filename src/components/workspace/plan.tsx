"use client";

import { useState } from "react";
import { FileText, Sparkles, Pencil, Plus, X } from "lucide-react";
import { PLAN, QUESTIONS } from "@/lib/fixtures";
import type { Journey, PlanEdit, PlanItem } from "@/lib/journey";
import { Button } from "../ui";

/** The plan as generated from the prompt and answers, before any edits. */
function generatedPlan(j: Journey): PlanEdit {
  const rules = QUESTIONS.find((q) => q.id === "rules")!.options.filter((o) => j.answers.rules?.includes(o.id)).map((o) => o.label);
  const access = QUESTIONS[0].options.find((o) => o.id === j.answers.access?.[0])?.label ?? j.answers.access?.[0];
  const send = QUESTIONS[1].options.find((o) => o.id === j.answers.send?.[0])?.label ?? j.answers.send?.[0];
  return {
    summary: PLAN.summary,
    screens: PLAN.screens.map((x) => ({ ...x })),
    agents: PLAN.agents.map((x) => ({ ...x })),
    rules: [...rules, `Sign-in: ${access}`, `Emails: ${send}`],
  };
}

const field = "w-full rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-blue";

function ItemsEditor({ label, items, onChange, noun }: { label: string; items: PlanItem[]; onChange: (v: PlanItem[]) => void; noun: string }) {
  return (
    <section>
      <h3 className="text-sm font-semibold">{label}</h3>
      <ul className="mt-2 space-y-3">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2">
            <div className="flex flex-1 flex-col gap-1.5">
              <input
                aria-label={`${noun} ${i + 1} name`}
                value={it.name}
                onChange={(e) => onChange(items.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))}
                className={`${field} font-medium`}
              />
              <input
                aria-label={`${noun} ${i + 1} description`}
                value={it.detail}
                onChange={(e) => onChange(items.map((x, k) => (k === i ? { ...x, detail: e.target.value } : x)))}
                className={`${field} text-[13px] text-ink-2`}
              />
            </div>
            <button onClick={() => onChange(items.filter((_, k) => k !== i))} aria-label={`Remove ${it.name || noun}`} className="h-8 shrink-0 rounded p-1.5 text-ink-3 hover:bg-red-wash hover:text-red">
              <X size={15} />
            </button>
          </li>
        ))}
      </ul>
      <button onClick={() => onChange([...items, { name: "", detail: "" }])} className="mt-2 flex items-center gap-1 text-[13px] text-blue hover:underline">
        <Plus size={14} /> Add {noun}
      </button>
    </section>
  );
}

export function PlanCanvas({
  name,
  prompt,
  j,
  onToggleSuggested,
  onContinue,
  onOpenSpec,
  onSavePlan,
  done,
}: {
  name: string;
  prompt: string;
  j: Journey;
  onToggleSuggested: (id: string) => void;
  onContinue: () => void;
  onOpenSpec: () => void;
  onSavePlan: (plan: PlanEdit) => void;
  done: boolean;
}) {
  const [draft, setDraft] = useState<PlanEdit | null>(null);
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

  const plan = j.planEdit ?? generatedPlan(j);
  // Each suggested feature, screen or agent beyond the generated plan widens the estimate.
  const extraScreens = Math.max(plan.screens.length - PLAN.screens.length, 0);
  const extraAgents = Math.max(plan.agents.length - PLAN.agents.length, 0);
  const extra = j.suggestedOn.length + extraScreens * 0.75 + extraAgents;
  const low = PLAN.estimate.low + extra;
  const high = PLAN.estimate.high + extra * 1.5;

  const clean = (d: PlanEdit): PlanEdit => ({
    summary: d.summary.trim() || plan.summary,
    screens: d.screens.filter((x) => x.name.trim()),
    agents: d.agents.filter((x) => x.name.trim()),
    rules: d.rules.map((r) => r.trim()).filter(Boolean),
  });

  if (draft) {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-6 sm:px-8 sm:py-8">
        <p className="text-[13px] text-ink-3">Editing the plan</p>
        <h2 className="mt-1 font-serif text-[32px] leading-tight">{name}</h2>
        <label htmlFor="plan-summary" className="mt-4 block text-sm font-semibold">
          Summary
        </label>
        <textarea id="plan-summary" rows={3} value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} className={`${field} mt-1.5 leading-relaxed`} />

        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          <ItemsEditor label="Screens" noun="screen" items={draft.screens} onChange={(screens) => setDraft({ ...draft, screens })} />
          <ItemsEditor label="Agents" noun="agent" items={draft.agents} onChange={(agents) => setDraft({ ...draft, agents })} />
        </div>

        <section className="mt-8">
          <h3 className="text-sm font-semibold">Rules the agents will follow</h3>
          <p className="text-[13px] text-ink-2">Each becomes a test before you ship. Write them the way you&apos;d explain them to a new colleague.</p>
          <ul className="mt-2 space-y-2">
            {draft.rules.map((r, i) => (
              <li key={i} className="flex gap-2">
                <input aria-label={`Rule ${i + 1}`} value={r} onChange={(e) => setDraft({ ...draft, rules: draft.rules.map((x, k) => (k === i ? e.target.value : x)) })} className={field} />
                <button onClick={() => setDraft({ ...draft, rules: draft.rules.filter((_, k) => k !== i) })} aria-label="Remove rule" className="shrink-0 rounded p-1.5 text-ink-3 hover:bg-red-wash hover:text-red">
                  <X size={15} />
                </button>
              </li>
            ))}
          </ul>
          <button onClick={() => setDraft({ ...draft, rules: [...draft.rules, ""] })} className="mt-2 flex items-center gap-1 text-[13px] text-blue hover:underline">
            <Plus size={14} /> Add rule
          </button>
        </section>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
          <p className="max-w-[24rem] text-[12px] leading-snug text-ink-3">Your edits update the plan, its tests and the estimate. In this prototype the build that follows is scripted, so the generated app doesn&apos;t change.</p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                onSavePlan(clean(draft));
                setDraft(null);
              }}
            >
              Save plan
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[720px] px-4 py-6 sm:px-8 sm:py-8 appear">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px] text-ink-3">{done ? "Plan, approved" : j.planEdit ? "Plan, edited by you, ready to approve" : "Plan, ready to approve"}</p>
          <h2 className="mt-1 font-serif text-[32px] leading-tight">{name}</h2>
        </div>
        {!done && (
          <Button size="sm" onClick={() => setDraft(structuredClone(plan))} className="mt-1 shrink-0">
            <Pencil size={14} /> Edit plan
          </Button>
        )}
      </div>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{plan.summary}</p>
      {!prompt.toLowerCase().includes("loan") && (
        <p className="mt-3 rounded-md bg-amber-wash px-3 py-2 text-[13px] text-amber">
          This prototype walks every project through the loan-triage example. Your prompt is saved with the project.
        </p>
      )}

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <section>
          <h3 className="text-sm font-semibold">Screens</h3>
          <ul className="mt-2 space-y-2">
            {plan.screens.map((s, i) => (
              <li key={i} className="text-sm">
                <span className="font-medium">{s.name}</span>
                <span className="block text-[13px] text-ink-2">{s.detail}</span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="text-sm font-semibold">Agents</h3>
          <ul className="mt-2 space-y-2">
            {plan.agents.map((a, i) => (
              <li key={i} className="text-sm">
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
          {plan.rules.map((r, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue" />
              {r}
            </li>
          ))}
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
