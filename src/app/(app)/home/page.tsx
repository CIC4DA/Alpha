"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GitBranch, LayoutTemplate, PenLine, ArrowUp } from "lucide-react";
import { createProject, listProjects, type Project } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { SAMPLE_PROMPT } from "@/lib/fixtures";
import { ProjectCard } from "@/components/project-card";
import { Button } from "@/components/ui";

const TEMPLATES = [
  { name: "Loan application triage", detail: "Extract facts from PDFs, check a lending policy with citations, draft replies.", prompt: SAMPLE_PROMPT },
  { name: "Meeting brief assistant", detail: "Reads tomorrow's calendar and prepares a one-page brief per meeting.", prompt: "Build a meeting brief assistant that reads my Google Calendar each evening and prepares a one-page brief for every external meeting tomorrow, with attendee background and open threads from email." },
  { name: "Support ticket triage", detail: "Classify incoming tickets, suggest replies from the help centre, route urgent ones.", prompt: "Build a support ticket triage app that classifies new Zendesk tickets by topic and urgency, drafts a reply from our help-centre articles with links, and routes urgent ones to the on-call lead on Slack." },
  { name: "Invoice checker", detail: "Match supplier invoices to purchase orders and flag mismatches before payment.", prompt: "Build an invoice checker that matches each supplier invoice PDF to its purchase order, flags price or quantity mismatches with the line it found, and sends a weekly summary to finance." },
];

type Mode = "describe" | "import" | "template";

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("describe");
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[] | null>(null);

  useEffect(() => {
    listProjects().then(setProjects).catch((e) => setError(e.message));
  }, []);

  const start = async (text: string) => {
    if (text.trim().length < 12) return setError("Describe what the app should do in a sentence or two.");
    setBusy(true);
    setError(null);
    try {
      const p = await createProject(text.trim());
      router.push(`/p/${p.id}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  const waiting = (projects ?? []).filter((p) => p.status === "in_review" || p.stage === "connect");
  const first = user?.name.split(" ")[0];

  return (
    <div className="mx-auto max-w-[1040px] px-8 py-12">
      <h1 className="font-serif text-[40px] leading-tight tracking-[-0.01em]">What should we build{first ? `, ${first}` : ""}?</h1>
      <p className="mt-2 text-ink-2">Describe the work you want automated. You&apos;ll see a plan and its price before anything is built.</p>

      <div className="mt-8 rounded-xl border border-line-strong bg-surface">
        <div className="flex gap-1 border-b border-line px-3 pt-2" role="tablist">
          {(
            [
              ["describe", "Describe it", PenLine],
              ["import", "Import from GitHub", GitBranch],
              ["template", "Start from a template", LayoutTemplate],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              role="tab"
              aria-selected={mode === id}
              onClick={() => setMode(id)}
              className={`-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm ${mode === id ? "border-blue font-medium text-ink" : "border-transparent text-ink-3 hover:text-ink"}`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {mode === "describe" && (
          <div className="p-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) start(prompt);
              }}
              rows={5}
              placeholder="For example: an app where loan officers upload application PDFs, an agent checks each one against our lending policy and cites the clause, and drafts the reply for the officer to approve."
              className="w-full resize-none bg-transparent text-[15px] leading-relaxed outline-none placeholder:text-ink-3"
              aria-label="Describe your app"
            />
            <div className="mt-2 flex items-center justify-between gap-4">
              <button onClick={() => setPrompt(SAMPLE_PROMPT)} className="text-[13px] text-blue hover:underline">
                Fill in the loan-triage example
              </button>
              <Button variant="primary" onClick={() => start(prompt)} disabled={busy}>
                <ArrowUp size={16} /> {busy ? "Creating project" : "Plan it"}
              </Button>
            </div>
          </div>
        )}

        {mode === "import" && (
          <div className="flex items-center justify-between gap-6 p-5">
            <div>
              <p className="font-medium">Continue an existing app</p>
              <p className="mt-1 text-sm text-ink-2">Architect reads the repository, finds its framework and agents, and drafts a plan for you to confirm.</p>
            </div>
            <Link href="/import" className="shrink-0 rounded-md bg-blue px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-ink">
              Choose a repository
            </Link>
          </div>
        )}

        {mode === "template" && (
          <div className="grid gap-px bg-line sm:grid-cols-2">
            {TEMPLATES.map((t) => (
              <button key={t.name} onClick={() => start(t.prompt)} disabled={busy} className="bg-surface p-4 text-left hover:bg-blue-wash/50">
                <p className="font-medium">{t.name}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{t.detail}</p>
              </button>
            ))}
          </div>
        )}
      </div>
      {error && <p className="mt-3 text-sm text-red">{error}</p>}

      {waiting.length > 0 && (
        <section className="mt-12">
          <h2 className="text-sm font-semibold">Needs you</h2>
          <ul className="mt-3 divide-y divide-line rounded-lg border border-line bg-surface">
            {waiting.map((p) => (
              <li key={p.id}>
                <Link href={`/p/${p.id}`} className="flex items-center justify-between px-4 py-3 text-sm hover:bg-paper">
                  <span>
                    <span className="font-medium">{p.name}</span>
                    <span className="text-ink-2"> {p.status === "in_review" ? "is waiting for approval" : "needs its files and accounts connected"}</span>
                  </span>
                  <span className="text-blue">Open</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-12">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">Recent projects</h2>
          {projects && projects.length > 0 && (
            <Link href="/projects" className="text-[13px] text-blue hover:underline">
              All projects
            </Link>
          )}
        </div>
        {projects === null ? (
          <p className="mt-4 text-sm text-ink-3">Loading projects</p>
        ) : projects.length === 0 ? (
          <div className="mt-3 rounded-lg border border-dashed border-line-strong p-8 text-center">
            <p className="font-medium">No projects yet</p>
            <p className="mt-1 text-sm text-ink-2">Describe an app above, or start from the loan-triage template to see the whole journey.</p>
          </div>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.slice(0, 6).map((p) => (
              <ProjectCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
