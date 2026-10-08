"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GitBranch, Lock, Check, Loader2 } from "lucide-react";
import { createProject } from "@/lib/store";
import { Button } from "@/components/ui";

const REPOS = [
  { name: "acme-lending/credit-memo-drafter", updated: "2 days ago", priv: true },
  { name: "acme-lending/kyc-document-checker", updated: "last week", priv: true },
  { name: "acme-lending/ops-dashboard", updated: "3 weeks ago", priv: true },
];

const DETECTED = [
  { label: "App", value: "Next.js 15, TypeScript" },
  { label: "Agents", value: "2 agents written with LangGraph" },
  { label: "Database", value: "Postgres, 6 tables" },
  { label: "Needs", value: "OPENAI_API_KEY, DATABASE_URL, an S3 bucket" },
  { label: "Tests", value: "None found for the agents" },
];

type Step = "pick" | "reading" | "found";

export default function ImportPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("pick");
  const [repo, setRepo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const read = (name: string) => {
    setRepo(name);
    setStep("reading");
    setTimeout(() => setStep("found"), 1800);
  };

  const create = async () => {
    setBusy(true);
    const p = await createProject(
      "Build a credit memo drafter that reads a borrower's financial statements, summarises cash flow and leverage, and drafts a credit memo for the analyst to edit. Imported from acme-lending/credit-memo-drafter.",
    );
    router.push(`/p/${p.id}`);
  };

  return (
    <div className="mx-auto max-w-[760px] px-4 py-8 sm:px-8 sm:py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Import from GitHub</h1>
      <p className="mt-1 text-sm text-ink-2">Bring an existing app into Architect and keep working on it, in chat or in code.</p>

      <div className="mt-6 flex items-center gap-3 rounded-lg border border-line bg-surface p-4 text-sm">
        <GitBranch size={18} className="text-ink-2" />
        <span className="flex-1">
          Architect GitHub App installed on <span className="font-medium">acme-lending</span>, with access to 3 repositories.
        </span>
        <span className="text-[12px] text-ink-3">Sample data</span>
      </div>

      {step === "pick" && (
        <ul className="mt-4 divide-y divide-line rounded-lg border border-line bg-surface">
          {REPOS.map((r) => (
            <li key={r.name} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="flex items-center gap-2 text-sm">
                {r.priv && <Lock size={13} className="text-ink-3" />}
                <span className="font-medium">{r.name}</span>
                <span className="text-ink-3">updated {r.updated}</span>
              </div>
              <Button size="sm" onClick={() => read(r.name)}>
                Import
              </Button>
            </li>
          ))}
        </ul>
      )}

      {step === "reading" && (
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-line bg-surface p-5 text-sm">
          <Loader2 size={16} className="animate-spin text-blue" /> Reading {repo}: framework, agents, database and the settings it needs
        </div>
      )}

      {step === "found" && (
        <div className="mt-4 rounded-lg border border-line bg-surface p-5 appear">
          <p className="font-semibold">Here&apos;s what Architect found in {repo}</p>
          <dl className="mt-4 divide-y divide-line text-sm">
            {DETECTED.map((d) => (
              <div key={d.label} className="grid grid-cols-[120px_1fr] gap-4 py-2.5">
                <dt className="text-ink-3">{d.label}</dt>
                <dd>{d.value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 rounded-md bg-paper p-4 text-sm leading-relaxed">
            <p className="font-medium">Drafted plan</p>
            <p className="mt-1 text-ink-2">
              A credit memo drafter: reads a borrower&apos;s financial statements, summarises cash flow and leverage, and drafts a memo for the analyst to edit. The two LangGraph agents stay in LangGraph; Architect adds golden tests built from three sample statements you&apos;ll provide.
            </p>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <Button variant="primary" onClick={create} disabled={busy}>
              <Check size={16} /> {busy ? "Creating project" : "Looks right, create the project"}
            </Button>
            <Button variant="ghost" onClick={() => setStep("pick")}>
              Choose another repository
            </Button>
          </div>
        </div>
      )}
      <p className="mt-6 text-[12px] text-ink-3">In this prototype the repository list and detection are sample data; a real GitHub repository list is planned for phase 2.</p>
    </div>
  );
}
