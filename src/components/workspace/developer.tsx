"use client";

import { useState } from "react";
import { FileCode2, Folder, GitBranch, Check, Copy, KeyRound, Terminal, Database as DbIcon, Lock, Search, GitPullRequest, GitMerge, ChevronDown, X, FlaskConical, Loader2 } from "lucide-react";
import { PULL_REQUESTS, reviewComment, type PrState, type PullRequest } from "@/lib/devloop";
import { BUILD_STEPS, FILES, TRACE } from "@/lib/fixtures";
import { Button } from "../ui";

export type DevTab = "files" | "database" | "traces" | "logs" | "env" | "github" | "agent";
const TABS: { id: DevTab; label: string }[] = [
  { id: "files", label: "Files" },
  { id: "database", label: "Database" },
  { id: "traces", label: "Traces" },
  { id: "logs", label: "Console" },
  { id: "env", label: "Environment" },
  { id: "github", label: "GitHub" },
  { id: "agent", label: "Your coding agent" },
];

function Files({ initial, extra }: { initial?: string; extra: { path: string; body: string }[] }) {
  const all = [...extra, ...FILES];
  const [path, setPath] = useState(initial ?? all[0].path);
  const file = all.find((f) => f.path === path) ?? all[0];
  const lines = file.body.replace(/\n$/, "").split("\n");
  return (
    <div className="grid h-full grid-cols-[260px_1fr]">
      <nav className="overflow-y-auto border-r border-line bg-surface py-2 text-[13px]" aria-label="Files">
        <p className="flex items-center gap-1.5 px-3 py-1 text-ink-3">
          <Folder size={13} /> loan-triage-desk
        </p>
        {all.map((f) => (
          <button
            key={f.path}
            onClick={() => setPath(f.path)}
            title={f.path}
            className={`flex w-full items-start gap-1.5 px-3 py-1.5 text-left font-mono text-[12px] ${f.path === path ? "bg-blue-wash text-blue-ink" : "text-ink-2 hover:bg-paper"}`}
          >
            <FileCode2 size={13} className="mt-0.5 shrink-0" />
            <span className="min-w-0">
              <span className="block truncate">{f.path.split("/").pop()}</span>
              {f.path.includes("/") && <span className="block truncate text-[11px] text-ink-3">{f.path.split("/").slice(0, -1).join("/")}</span>}
            </span>
          </button>
        ))}
      </nav>
      <div className="flex min-w-0 flex-col">
        <div className="flex items-center justify-between border-b border-line bg-surface px-4 py-2 text-[12px]">
          <span className="font-mono">{file.path}</span>
          <span className="text-ink-3">Edit here, in your IDE through GitHub, or with your coding agent</span>
        </div>
        <pre className="flex-1 overflow-auto bg-[#fbfcfd] p-4 font-mono text-[12.5px] leading-[1.7]">
          {lines.map((l, i) => (
            <div key={i} className="flex">
              <span className="w-8 shrink-0 select-none pr-3 text-right text-ink-3/70">{i + 1}</span>
              <span className="whitespace-pre text-ink">{l || " "}</span>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

function Traces() {
  return (
    <div className="overflow-y-auto p-6">
      <p className="text-sm text-ink-2">Test run, case: Brightwell Bakery. What each step received and returned, in order.</p>
      <ol className="mt-4 space-y-3">
        {TRACE.map((t, i) => (
          <li key={i} className="rounded-lg border border-line bg-surface">
            <div className="flex items-center justify-between border-b border-line px-4 py-2 text-[13px]">
              <span className="font-semibold">{t.agent}</span>
              <span className="text-ink-3">received: {t.received}</span>
            </div>
            <pre className="overflow-x-auto px-4 py-3 font-mono text-[12px] leading-relaxed text-ink">{t.returned}</pre>
          </li>
        ))}
      </ol>
    </div>
  );
}

type Level = "error" | "warn" | "log";
const LEVELS: { id: Level | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "error", label: "Errors" },
  { id: "warn", label: "Warnings" },
  { id: "log", label: "Logs" },
];

/** Build output and the preview's console in one place, filterable like Architect's console. */
function Logs({ done }: { done: number }) {
  const [level, setLevel] = useState<Level | "all">("all");
  const lines: { level: Level; text: string; step: string }[] = [];
  for (const st of BUILD_STEPS.slice(0, Math.max(done, 0))) {
    for (const t of st.dev.split("\n")) {
      const lv: Level = /type error|error:/i.test(t) && !/errors: 0/.test(t) ? "error" : /fixer:|warn/i.test(t) ? "warn" : "log";
      lines.push({ level: lv, text: t.trim(), step: st.label });
    }
  }
  const shown = level === "all" ? lines : lines.filter((l) => l.level === level);
  const count = (lv: Level) => lines.filter((l) => l.level === lv).length;
  const tone = { error: "text-[#ff9b9b]", warn: "text-[#f3c969]", log: "text-[#d6dbe4]" };
  return (
    <div className="flex h-full flex-col bg-ink">
      <div className="flex items-center gap-1 border-b border-white/10 px-3 py-2" role="group" aria-label="Filter console">
        {LEVELS.map((l) => (
          <button
            key={l.id}
            onClick={() => setLevel(l.id)}
            aria-pressed={level === l.id}
            className={`rounded px-2 py-1 text-[12px] ${level === l.id ? "bg-white/15 text-white" : "text-[#9aa3b2] hover:text-white"}`}
          >
            {l.label}
            {l.id !== "all" && <span className="ml-1 tabular-nums opacity-70">{count(l.id)}</span>}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-4 font-mono text-[12px] leading-[1.7]">
        {lines.length === 0 ? (
          <p className="text-[#9aa3b2]">No build has run yet.</p>
        ) : shown.length === 0 ? (
          <p className="text-[#9aa3b2]">Nothing at this level.</p>
        ) : (
          shown.map((l, i) => (
            <div key={i} className={`flex gap-3 ${tone[l.level]}`}>
              <span className="w-10 shrink-0 select-none text-[#6b7484]">{l.level}</span>
              <span className="whitespace-pre-wrap break-all">{l.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

type Table = { name: string; about: string; columns: [string, string][]; rows: string[][] };

function tables(hasData: boolean): Table[] {
  const t = (iso: string) => iso;
  return [
    {
      name: "applications",
      about: "One row per uploaded application PDF",
      columns: [["id", "text"], ["applicant", "text"], ["amount_gbp", "integer"], ["purpose", "text"], ["status", "text"], ["created_at", "timestamptz"]],
      rows: hasData
        ? [
            ["KCL-0101", "Hartley Joinery Ltd", "30000", "Equipment", "decided", t("2026-10-09 10:02")],
            ["KCL-0102", "Cole Ventures", "40000", "Crypto investment", "decided", t("2026-10-09 10:02")],
            ["KCL-0103", "Brightwell Bakery", "65000", "Second oven and fit-out", "manual_review", t("2026-10-09 10:03")],
          ]
        : [],
    },
    {
      name: "field_corrections",
      about: "Facts an officer changed before deciding",
      columns: [["id", "uuid"], ["application_id", "text"], ["field", "text"], ["extracted", "text"], ["corrected", "text"], ["by", "uuid"]],
      rows: hasData ? [["c7e1…", "KCL-0103", "annual_income_gbp", "180000", "140000", "officer"]] : [],
    },
    {
      name: "decisions",
      about: "Outcome, cited clauses and who confirmed it",
      columns: [["application_id", "text"], ["outcome", "text"], ["clauses", "text[]"], ["confirmed_by", "uuid"], ["email_sent", "boolean"]],
      rows: hasData
        ? [
            ["KCL-0101", "Approve", "{2.1,3.1,4.1}", "officer", "false"],
            ["KCL-0102", "Decline", "{4.2}", "officer", "false"],
            ["KCL-0103", "Manual Review", "{5.2}", "–", "false"],
          ]
        : [],
    },
    {
      name: "audit_events",
      about: "Append-only trail of every agent and person action",
      columns: [["at", "timestamptz"], ["actor", "text"], ["action", "text"], ["application_id", "text"]],
      rows: hasData
        ? [
            ["2026-10-09 10:02", "extraction-agent", "extracted 9 fields", "KCL-0101"],
            ["2026-10-09 10:02", "policy-agent", "cited 2.1, 3.1, 4.1", "KCL-0101"],
            ["2026-10-09 10:02", "extraction-agent", "extracted 9 fields", "KCL-0102"],
            ["2026-10-09 10:02", "policy-agent", "cited 4.2", "KCL-0102"],
            ["2026-10-09 10:03", "extraction-agent", "found 2 income figures", "KCL-0103"],
            ["2026-10-09 10:03", "policy-agent", "cited 5.2", "KCL-0103"],
          ]
        : [],
    },
  ];
}

/** Read-only view of the preview database, like Architect's Database tab. */
function Database({ built, hasData }: { built: boolean; hasData: boolean }) {
  const all = tables(hasData);
  const [pick, setPick] = useState(all[0].name);
  const [mode, setMode] = useState<"rows" | "schema">("rows");
  const [q, setQ] = useState("");
  if (!built) return <p className="p-6 text-sm text-ink-2">The database is created during the build. Nothing here yet.</p>;
  const tbl = all.find((x) => x.name === pick)!;
  const rows = q ? tbl.rows.filter((r) => r.some((c) => c.toLowerCase().includes(q.toLowerCase()))) : tbl.rows;
  return (
    <div className="flex h-full min-h-0">
      <aside className="w-56 shrink-0 overflow-y-auto border-r border-line bg-surface p-2" aria-label="Tables">
        <p className="px-2 pb-2 pt-1 text-[12px] text-ink-3">Preview branch, read-only</p>
        {all.map((x) => (
          <button
            key={x.name}
            onClick={() => setPick(x.name)}
            aria-current={pick === x.name}
            className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[13px] ${pick === x.name ? "bg-blue-wash text-blue-ink" : "hover:bg-paper"}`}
          >
            <span className="flex items-center gap-1.5 font-mono text-[12px]">
              <DbIcon size={13} className="text-ink-3" /> {x.name}
            </span>
            <span className="tabular-nums text-[12px] text-ink-3">{x.rows.length}</span>
          </button>
        ))}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface px-4 py-2">
          <div className="flex rounded-md border border-line-strong p-0.5" role="group" aria-label="Table view">
            {(["rows", "schema"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} aria-pressed={mode === m} className={`rounded px-2.5 py-1 text-[12px] ${mode === m ? "bg-ink text-white" : "text-ink-2"}`}>
                {m === "rows" ? "Rows" : "Schema"}
              </button>
            ))}
          </div>
          <p className="min-w-0 flex-1 truncate text-[13px] text-ink-3">{tbl.about}</p>
          {mode === "rows" && (
            <label className="flex h-8 items-center gap-1.5 rounded-md border border-line-strong px-2">
              <Search size={13} className="text-ink-3" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search rows" aria-label="Search rows" className="w-36 bg-transparent text-[13px] outline-none" />
            </label>
          )}
          <span className="flex items-center gap-1 text-[12px] text-ink-3" title="Row-level security is on">
            <Lock size={12} /> RLS on
          </span>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-4">
          {mode === "schema" ? (
            <table className="w-full max-w-lg rounded-lg border border-line bg-surface text-[13px]">
              <tbody>
                {tbl.columns.map(([c, ty]) => (
                  <tr key={c} className="border-b border-line last:border-0">
                    <td className="px-3 py-2 font-mono text-[12px]">{c}</td>
                    <td className="px-3 py-2 font-mono text-[12px] text-ink-3">{ty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : rows.length === 0 ? (
            <p className="text-sm text-ink-2">{q ? "No rows match." : "No rows yet. Rows appear when you test the app on your sample applications."}</p>
          ) : (
            <table className="w-full min-w-[560px] rounded-lg border border-line bg-surface text-[13px]">
              <thead>
                <tr className="border-b border-line text-left text-[12px] text-ink-3">
                  {tbl.columns.map(([c]) => (
                    <th key={c} className="px-3 py-2 font-mono font-normal">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-line last:border-0">
                    {r.map((c, k) => (
                      <td key={k} className="px-3 py-2 tabular-nums">{c}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function Env() {
  const rows = [
    { key: "DATABASE_URL", value: "Managed by Architect (preview branch)", secret: true },
    { key: "MODEL_GATEWAY_TOKEN", value: "Short-lived project token, rotated hourly", secret: true },
    { key: "GMAIL_CONNECTION", value: "Reference to connection gmail-01; the token stays in the vault", secret: true },
    { key: "POLICY_KNOWLEDGE_BASE", value: "kestrel-lending-policy@v1.0", secret: false },
    { key: "LOCALE", value: "en-GB, GBP", secret: false },
  ];
  return (
    <div className="overflow-y-auto p-6">
      <p className="text-sm text-ink-2">Secrets are references. Their values never enter the sandbox or the code; the egress proxy adds them on the way out.</p>
      <table className="mt-4 w-full rounded-lg border border-line bg-surface text-sm">
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-b border-line last:border-0">
              <td className="px-4 py-2.5 font-mono text-[12px]">
                <span className="flex items-center gap-1.5">
                  {r.secret && <KeyRound size={12} className="text-amber" />}
                  {r.key}
                </span>
              </td>
              <td className="px-4 py-2.5 text-ink-2">{r.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export type GitHubProps = {
  connected: boolean;
  onConnect: () => void;
  repo: string;
  version: number;
  built: boolean;
  approvalRequired: boolean;
  prs: Record<string, PrState>;
  onPrState: (id: string, state: PrState) => void;
  onMerge: (pr: PullRequest) => void;
};

const PR_CHIP: Record<PrState, { label: string; cls: string }> = {
  open: { label: "Checks not run", cls: "text-ink-3" },
  checking: { label: "Running checks", cls: "text-amber" },
  passed: { label: "Checks pass", cls: "text-green" },
  failed: { label: "Checks fail", cls: "text-red" },
  merged: { label: "Merged", cls: "text-blue" },
  closed: { label: "Closed", cls: "text-ink-3" },
};

function PullRequestCard({ pr, state, gh }: { pr: PullRequest; state: PrState; gh: GitHubProps }) {
  const [open, setOpen] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [copied, setCopied] = useState(false);
  const ran = state === "passed" || state === "failed" || state === "merged";
  const add = pr.files.reduce((n, f) => n + f.add, 0);
  const del = pr.files.reduce((n, f) => n + f.del, 0);
  return (
    <li className="rounded-lg border border-line bg-surface">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-start gap-3 px-4 py-3 text-left">
        <GitPullRequest size={16} className={`mt-0.5 shrink-0 ${state === "merged" ? "text-blue" : state === "closed" ? "text-ink-3" : "text-green"}`} />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">
            {pr.title} <span className="font-normal text-ink-3">#{pr.number}</span>
          </span>
          <span className="mt-0.5 block text-[12px] text-ink-3">
            <span className="font-mono">{pr.branch}</span>, opened from {pr.from}, {pr.files.length} files <span className="text-green">+{add}</span> <span className="text-red">−{del}</span>
          </span>
        </span>
        <span className={`shrink-0 text-[12px] font-medium ${PR_CHIP[state].cls}`}>{PR_CHIP[state].label}</span>
        <ChevronDown size={15} className={`mt-0.5 shrink-0 text-ink-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-line px-4 pb-4 pt-3">
          <ul className="space-y-0.5 font-mono text-[12px]">
            {pr.files.map((f) => (
              <li key={f.path} className="flex gap-2">
                <span className="min-w-0 flex-1 truncate">{f.path}</span>
                <span className="text-green">+{f.add}</span>
                <span className="text-red">−{f.del}</span>
              </li>
            ))}
          </ul>
          <button onClick={() => setShowDiff((d) => !d)} className="mt-2 text-[12px] font-medium text-blue hover:underline">
            {showDiff ? "Hide the diff" : "Show the diff"}
          </button>
          {showDiff && (
            <pre className="mt-2 max-h-72 overflow-auto rounded-md bg-ink p-3 font-mono text-[11.5px] leading-[1.6]">
              {pr.diff.split("\n").map((l, i) => (
                <div key={i} className={l.startsWith("+") && !l.startsWith("+++") ? "text-[#8fd6a8]" : l.startsWith("-") && !l.startsWith("---") ? "text-[#ff9b9b]" : l.startsWith("@@") ? "text-[#9ab4f5]" : "text-[#d6dbe4]"}>
                  {l || " "}
                </div>
              ))}
            </pre>
          )}

          {state === "open" && (
            <div className="mt-4 rounded-md bg-paper p-3 text-[13px]">
              <p>Architect runs the same checks on this branch as on its own changes: the golden tests, on outcome and reason, and the plan&apos;s rules.</p>
              <Button size="sm" className="mt-2" onClick={() => { gh.onPrState(pr.id, "checking"); setTimeout(() => gh.onPrState(pr.id, pr.pass ? "passed" : "failed"), 1800); }}>
                <FlaskConical size={14} /> Run the checks
              </Button>
            </div>
          )}
          {state === "checking" && <p className="mt-4 flex items-center gap-2 text-[13px] text-ink-2"><Loader2 size={14} className="animate-spin" /> Running 3 golden cases and 3 plan rules on {pr.branch}</p>}

          {ran && (
            <div className="mt-4">
              <h4 className="text-[13px] font-semibold">Golden tests: {pr.checks} of 6 checks pass</h4>
              <table className="mt-1.5 w-full text-[13px]">
                <tbody>
                  {pr.results.map((r) => (
                    <tr key={r.caseId} className="border-b border-line align-top last:border-0">
                      <td className="w-5 py-1.5">{r.pass ? <Check size={14} className="text-green" /> : <X size={14} className="text-red" />}</td>
                      <td className="w-36 py-1.5 font-medium">{r.title}</td>
                      <td className="w-32 py-1.5">{r.outcome}<span className="block text-[12px] text-ink-3">cites {r.cited}</span></td>
                      <td className="py-1.5 text-ink-2">{r.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <h4 className="mt-3 text-[13px] font-semibold">Plan rules</h4>
              <ul className="mt-1 space-y-1 text-[13px]">
                {pr.rules.map((r) => (
                  <li key={r.rule} className="flex gap-2">
                    {r.pass ? <Check size={14} className="mt-0.5 shrink-0 text-green" /> : <X size={14} className="mt-0.5 shrink-0 text-red" />}
                    <span>
                      {r.rule}
                      {r.note && <span className="block text-ink-2">{r.note}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {state === "passed" && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button size="sm" variant="primary" onClick={() => gh.onMerge(pr)}>
                <GitMerge size={14} /> Merge as version {gh.version + 1}
              </Button>
              <p className="text-[12px] text-ink-3">{gh.approvalRequired ? "It goes live only after this workspace's approver reviews it." : "It becomes the preview; ship it like any other version."}</p>
            </div>
          )}
          {state === "failed" && (
            <div className="mt-4 rounded-md border border-line bg-red-wash p-3 text-[13px]">
              <p className="font-medium text-red">Merging is blocked while a check fails.</p>
              <p className="mt-1 text-ink-2">Architect posted these results on the pull request, so {pr.from} can read them and push a fix. The checks run again on every push.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard?.writeText(reviewComment(pr));
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1400);
                  }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : `Copy results for ${pr.from}`}
                </Button>
                <Button size="sm" onClick={() => gh.onPrState(pr.id, "closed")}>
                  Close pull request
                </Button>
              </div>
            </div>
          )}
          {state === "merged" && <p className="mt-4 text-[13px] text-ink-2">Merged into main. Architect recorded it as a version, so it shows in chat and can be reverted like any other.</p>}
        </div>
      )}
    </li>
  );
}

function GitHub({ gh }: { gh: GitHubProps }) {
  const [connecting, setConnecting] = useState(false);
  if (!gh.connected)
    return (
      <div className="overflow-y-auto p-6">
        <div className="max-w-lg rounded-lg border border-line bg-surface p-5">
          <p className="flex items-center gap-2 font-semibold">
            <GitBranch size={16} /> Sync with GitHub
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-2">
            Work in Cursor, Claude Code or Codex. Every Architect version becomes a commit on main; every pull request from your editor comes back here, and Architect runs the golden tests and the plan&apos;s rules on it before it can merge.
          </p>
          <Button
            variant="primary"
            className="mt-4"
            onClick={() => {
              setConnecting(true);
              setTimeout(gh.onConnect, 1400);
            }}
            disabled={connecting}
          >
            {connecting ? "Connecting" : "Connect GitHub"}
          </Button>
          <p className="mt-3 text-[12px] text-ink-3">Simulated in this prototype: no repository is created.</p>
        </div>
      </div>
    );
  const shown = PULL_REQUESTS;
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-3xl appear">
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <Check size={15} className="text-green" /> Synced with <span className="font-mono text-[13px]">{gh.repo}</span>
          <span className="text-ink-3">main is version {gh.version}</span>
        </p>
        <h3 className="mt-6 text-sm font-semibold">Pull requests from your editor</h3>
        <p className="mt-0.5 text-[13px] text-ink-3">A merge here is the same as a change in chat: a new version, tested, and reviewed if your workspace requires it.</p>
        {!gh.built ? (
          <p className="mt-3 text-sm text-ink-2">Nothing to review until the first build is done.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {shown.map((pr) => (
              <PullRequestCard key={pr.id} pr={pr} state={gh.prs[pr.id] ?? "open"} gh={gh} />
            ))}
          </ul>
        )}
        <p className="mt-4 text-[12px] text-ink-3">Architect never force-pushes. If both sides change the same file, its version waits on its own branch as a pull request. The two pull requests here are sample data.</p>
      </div>
    </div>
  );
}

const AGENT_CONFIG: Record<string, string> = {
  "Claude Code": "claude mcp add --transport http architect https://mcp.architect.dev/projects/loan-triage-desk",
  Codex: '[mcp_servers.architect]  url = "https://mcp.architect.dev/projects/loan-triage-desk"',
  Cursor: '{ "mcpServers": { "architect": { "url": "https://mcp.architect.dev/projects/loan-triage-desk" } } }',
};

function CodingAgent() {
  const [pick, setPick] = useState("Claude Code");
  const [copied, setCopied] = useState(false);
  return (
    <div className="overflow-y-auto p-6">
      <div className="max-w-2xl">
        <p className="font-semibold">Use Architect from the coding agent you already use</p>
        <p className="mt-1 text-sm leading-relaxed text-ink-2">
          Optional. Everything here also works in this Developer view. Connecting lets Claude Code, Codex or Cursor read the plan, run the golden tests, read traces and change agents, within your organisation&apos;s roles.
        </p>
        <div className="mt-4 flex gap-1" role="group" aria-label="Coding agent">
          {Object.keys(AGENT_CONFIG).map((k) => (
            <button key={k} onClick={() => setPick(k)} aria-pressed={pick === k} className={`h-8 rounded-md px-3 text-[13px] ${pick === k ? "bg-ink text-white" : "border border-line-strong hover:border-ink-3"}`}>
              {k}
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-ink p-4">
          <Terminal size={14} className="mt-0.5 shrink-0 text-[#9aa4b5]" />
          <code className="flex-1 break-all font-mono text-[12px] leading-relaxed text-[#e6e9ef]">{AGENT_CONFIG[pick]}</code>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(AGENT_CONFIG[pick]);
              setCopied(true);
              setTimeout(() => setCopied(false), 1400);
            }}
            className="shrink-0 rounded p-1 text-[#9aa4b5] hover:text-white"
            aria-label="Copy"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
        <p className="mt-2 text-[12px] text-ink-3">Example configuration. Sign-in goes through your organisation. Access is scoped to this project; secret values are never returned.</p>

        <h3 className="mt-6 text-sm font-semibold">What your agent can do</h3>
        <ul className="mt-2 grid grid-cols-2 gap-2 text-[13px]">
          {["Read the plan, agents and rules", "Run the golden tests, with reasons", "Read traces of failed runs", "Change an agent's rules, tools or model", "Start a preview", "Request review, or deploy if your role allows"].map((t) => (
            <li key={t} className="flex gap-2 rounded-md border border-line bg-surface px-3 py-2">
              <Check size={14} className="mt-0.5 shrink-0 text-green" /> {t}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[13px] text-ink-2">Changes your agent makes come back as pull requests. Architect checks them in the GitHub tab before they can merge.</p>
        <p className="mt-2 text-[12px] text-ink-3">The MCP server is described in the architecture doc; it isn&apos;t running in this prototype.</p>
      </div>
    </div>
  );
}

export function DeveloperCanvas({
  tab,
  onTab,
  buildDone,
  hasData = false,
  initialFile,
  extraFiles = [],
  gh,
}: {
  tab: DevTab;
  onTab: (t: DevTab) => void;
  buildDone: number;
  hasData?: boolean;
  initialFile?: string;
  extraFiles?: { path: string; body: string }[];
  gh: GitHubProps;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex gap-1 overflow-x-auto border-b border-line bg-surface px-4" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => onTab(t.id)}
            className={`-mb-px shrink-0 border-b-2 px-3 py-3 text-sm ${tab === t.id ? "border-blue font-medium" : "border-transparent text-ink-3 hover:text-ink"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1">
        {tab === "files" && <Files initial={initialFile} extra={extraFiles} />}
        {tab === "database" && <Database built={buildDone > 1} hasData={hasData} />}
        {tab === "traces" && <Traces />}
        {tab === "logs" && <Logs done={buildDone} />}
        {tab === "env" && <Env />}
        {tab === "github" && <GitHub gh={gh} />}
        {tab === "agent" && <CodingAgent />}
      </div>
    </div>
  );
}
