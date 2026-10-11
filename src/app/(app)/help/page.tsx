"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BookOpen, ChevronDown, Code2, Hammer, MessageCircle, Search, ShieldCheck, Briefcase, MessagesSquare } from "lucide-react";
import { FAQS, GUIDES, STATUS, WHATS_NEW } from "@/lib/explore-content";
import { useSupport } from "@/components/support";
import { Button } from "@/components/ui";

const ROLE_GUIDES = [
  { role: "Builders", icon: Hammer, items: ["Your first agentic app in ten minutes", "Golden tests that check the reason, not just the answer", "Ship with a separate approver"] },
  { role: "Developers", icon: Code2, items: ["Connect Claude Code, Cursor or Codex over MCP", "Debug a failed run", "Call your agents from your own systems"] },
  { role: "Approvers", icon: ShieldCheck, items: ["Ship with a separate approver", "Golden tests that check the reason, not just the answer"] },
  { role: "FDEs", icon: Briefcase, items: ["Run apps in your customer's cloud account", "Blueprints: deliver the same app to your next customer", "Pick a model per agent on your own cases"] },
];

const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

function Faq({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <li>
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium">
        {q}
        <ChevronDown size={15} className={`shrink-0 text-ink-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="px-4 pb-3 text-sm leading-relaxed text-ink-2">{a}</p>}
    </li>
  );
}

export default function HelpPage() {
  const { setOpen } = useSupport();
  const [q, setQ] = useState("");
  const [topic, setTopic] = useState("All");
  const topics = ["All", ...Array.from(new Set(FAQS.map((f) => f.topic)))];
  const needle = q.trim().toLowerCase();
  const faqs = FAQS.filter((f) => (topic === "All" || f.topic === topic) && (!needle || `${f.q} ${f.a}`.toLowerCase().includes(needle)));
  const guides = needle ? GUIDES.filter((g) => `${g.title} ${g.summary} ${(g.steps ?? []).join(" ")}`.toLowerCase().includes(needle)) : [];

  return (
    <div className="mx-auto max-w-[1040px] px-4 py-8 sm:px-8 sm:py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Help</h1>
      <p className="mt-1 text-sm text-ink-2">Answers, guides for your role, and a person when you need one.</p>

      <label className="mt-6 flex h-11 max-w-xl items-center gap-2 rounded-lg border border-line-strong bg-surface px-3">
        <Search size={16} className="text-ink-3" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search help, for example: credits, approver, MCP" aria-label="Search help" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
      </label>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0">
          {guides.length > 0 && (
            <section className="mb-8" aria-label="Matching guides">
              <h2 className="text-sm font-semibold">Guides</h2>
              <ul className="mt-2 divide-y divide-line rounded-lg border border-line bg-surface">
                {guides.map((g) => (
                  <li key={g.title} className="px-4 py-3">
                    <p className="font-medium">{g.title}</p>
                    <p className="text-[13px] text-ink-2">{g.summary}</p>
                    {g.steps && (
                      <ol className="mt-1.5 list-decimal space-y-0.5 pl-5 text-[13px] text-ink-2">
                        {g.steps.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ol>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!needle && (
            <section aria-label="Guides by role">
              <h2 className="text-sm font-semibold">Start here, by role</h2>
              <ul className="mt-2 grid gap-3 sm:grid-cols-2">
                {ROLE_GUIDES.map((r) => (
                  <li key={r.role} className="rounded-lg border border-line bg-surface p-4">
                    <p className="flex items-center gap-2 font-medium">
                      <r.icon size={16} className="text-blue" /> {r.role}
                    </p>
                    <ul className="mt-2 space-y-1 text-[13px]">
                      {r.items.map((t) => (
                        <li key={t}>
                          <button onClick={() => setQ(t)} className="text-left text-blue hover:underline">
                            {t}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-8" aria-label="Questions">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold">Common questions</h2>
              <div className="flex flex-wrap gap-1" role="group" aria-label="Topic">
                {topics.map((t) => (
                  <button key={t} onClick={() => setTopic(t)} aria-pressed={topic === t} className={`h-7 rounded-md px-2 text-[12px] ${topic === t ? "bg-ink text-white" : "text-ink-2 hover:bg-surface"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            {faqs.length === 0 ? (
              <p className="mt-3 text-sm text-ink-2">
                Nothing matches &ldquo;{q}&rdquo;.{" "}
                <button onClick={() => setOpen(true)} className="font-medium text-blue hover:underline">
                  Ask support
                </button>
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-line rounded-lg border border-line bg-surface">
                {faqs.map((f) => (
                  <Faq key={f.q} q={f.q} a={f.a} />
                ))}
              </ul>
            )}
          </section>

          <section className="mt-8" aria-label="What's new">
            <h2 className="text-sm font-semibold">What&apos;s new</h2>
            <ol className="mt-2 space-y-3">
              {WHATS_NEW.map((w) => (
                <li key={w.title} className="grid grid-cols-[64px_1fr] gap-3 text-sm">
                  <span className="text-[13px] tabular-nums text-ink-3">{day(w.date)}</span>
                  <span>
                    <span className="font-medium">{w.title}</span>
                    <span className="block text-[13px] text-ink-2">{w.detail}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-line bg-surface p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <MessageCircle size={16} className="text-blue" /> Talk to support
            </h2>
            <p className="mt-1 text-[13px] text-ink-2">Answers straight away from the help articles; a person picks up anything they don&apos;t cover, usually within one working day.</p>
            <Button size="sm" variant="primary" className="mt-3" onClick={() => setOpen(true)}>
              Open support chat
            </Button>
          </section>

          <section className="rounded-lg border border-line bg-surface p-4">
            <h2 className="text-sm font-semibold">Status</h2>
            <ul className="mt-2 space-y-1.5 text-[13px]">
              {STATUS.map((s) => (
                <li key={s.name} className="flex items-center justify-between">
                  <span>{s.name}</span>
                  <span className="flex items-center gap-1.5 text-green">
                    <span className="h-1.5 w-1.5 rounded-full bg-green" /> {s.state}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] text-ink-3">Sample status in the prototype.</p>
          </section>

          <section className="rounded-lg border border-line bg-surface p-4">
            <h2 className="text-sm font-semibold">More help</h2>
            <ul className="mt-2 space-y-2 text-[13px]">
              <li>
                <Link href="/explore#learn" className="flex items-center gap-2 text-blue hover:underline">
                  <BookOpen size={14} /> Tutorials and use cases
                </Link>
              </li>
              <li>
                <a href="https://docs.architect.new/" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue hover:underline">
                  <BookOpen size={14} /> Docs <ArrowUpRight size={12} />
                </a>
              </li>
              <li>
                <a href="https://discord.gg/Y2hjUEyGBP" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue hover:underline">
                  <MessagesSquare size={14} /> Community on Discord <ArrowUpRight size={12} />
                </a>
              </li>
              <li>
                <Link href="/usage" className="flex items-center gap-2 text-blue hover:underline">
                  Credits and usage
                </Link>
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
