"use client";

import { useState } from "react";
import { FileCode2, Folder, GitBranch, Check, Copy, KeyRound, Terminal } from "lucide-react";
import { BUILD_STEPS, FILES, TRACE } from "@/lib/fixtures";
import { Button } from "../ui";

export type DevTab = "files" | "traces" | "logs" | "env" | "github" | "agent";
const TABS: { id: DevTab; label: string }[] = [
  { id: "files", label: "Files" },
  { id: "traces", label: "Traces" },
  { id: "logs", label: "Logs" },
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

function Logs({ done }: { done: number }) {
  return (
    <pre className="h-full overflow-auto bg-ink p-5 font-mono text-[12px] leading-[1.7] text-[#d6dbe4]">
      {BUILD_STEPS.slice(0, Math.max(done, 0))
        .map((s) => `# ${s.label}\n${s.dev}\n`)
        .join("\n") || "No build has run yet."}
    </pre>
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

function GitHub() {
  const [state, setState] = useState<"off" | "connecting" | "on">("off");
  return (
    <div className="overflow-y-auto p-6">
      {state !== "on" ? (
        <div className="max-w-lg rounded-lg border border-line bg-surface p-5">
          <p className="flex items-center gap-2 font-semibold">
            <GitBranch size={16} /> Sync with GitHub
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-2">
            Installs the Architect GitHub App on the repositories you choose. Every Architect version becomes a pull request; every push to your main branch comes back into Architect and runs the tests.
          </p>
          <Button
            variant="primary"
            className="mt-4"
            onClick={() => {
              setState("connecting");
              setTimeout(() => setState("on"), 1400);
            }}
            disabled={state === "connecting"}
          >
            {state === "connecting" ? "Connecting" : "Connect GitHub"}
          </Button>
          <p className="mt-3 text-[12px] text-ink-3">Simulated in this prototype.</p>
        </div>
      ) : (
        <div className="max-w-2xl appear">
          <p className="flex items-center gap-2 text-sm">
            <Check size={15} className="text-green" /> Synced with <span className="font-mono text-[13px]">kestrel-lending/loan-triage-desk</span>
          </p>
          <ul className="mt-4 divide-y divide-line rounded-lg border border-line bg-surface text-sm">
            <li className="flex items-center justify-between px-4 py-3">
              <span>
                <span className="font-mono text-[12px]">main</span> <span className="text-ink-2">v1, live</span>
              </span>
              <span className="text-[12px] text-green">Tests 6 of 6</span>
            </li>
            <li className="flex items-center justify-between px-4 py-3">
              <span>
                <span className="font-mono text-[12px]">architect/route-large-loans</span> <span className="text-ink-2">Pull request: route loans over £150,000 to the credit committee</span>
              </span>
              <span className="text-[12px] text-amber">Checks running</span>
            </li>
          </ul>
          <p className="mt-3 text-[13px] text-ink-3">Architect never force-pushes. If both sides change, its version stays on its own branch as a pull request.</p>
        </div>
      )}
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
        <p className="mt-4 text-[12px] text-ink-3">The MCP server is described in the architecture doc; it isn&apos;t running in this prototype.</p>
      </div>
    </div>
  );
}

export function DeveloperCanvas({ tab, onTab, buildDone, initialFile, extraFiles = [] }: { tab: DevTab; onTab: (t: DevTab) => void; buildDone: number; initialFile?: string; extraFiles?: { path: string; body: string }[] }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex gap-1 border-b border-line bg-surface px-4" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => onTab(t.id)}
            className={`-mb-px border-b-2 px-3 py-3 text-sm ${tab === t.id ? "border-blue font-medium" : "border-transparent text-ink-3 hover:text-ink"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1">
        {tab === "files" && <Files initial={initialFile} extra={extraFiles} />}
        {tab === "traces" && <Traces />}
        {tab === "logs" && <Logs done={buildDone} />}
        {tab === "env" && <Env />}
        {tab === "github" && <GitHub />}
        {tab === "agent" && <CodingAgent />}
      </div>
    </div>
  );
}
