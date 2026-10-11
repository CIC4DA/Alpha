"use client";

import { useState } from "react";
import { Bot, UserCheck, Upload, Send, X, FlaskConical, Server, Wrench, Check, Loader2, Scale } from "lucide-react";
import { MODEL_RUNS, CASE_TITLES, DEFAULT_VOLUME, type ModelRun } from "@/lib/devloop";
import { Button } from "../ui";

export type AgentId = "extraction" | "policy" | "drafting";

export const AGENTS: Record<AgentId, { name: string; role: string; rules: string[]; tools: string[]; knowledge: string[] }> = {
  extraction: {
    name: "Extraction agent",
    role: "Reads the application PDF and returns applicant name, amount, income and purpose, each with its page and quoted source.",
    rules: ["Never guess between two figures; return both and flag the conflict", "Return null with a reason when a fact is missing"],
    tools: ["Read uploaded PDF"],
    knowledge: [],
  },
  policy: {
    name: "Policy agent",
    role: "Checks officer-confirmed facts against the active lending policy and recommends Approve, Decline or Manual Review.",
    rules: ["Cite at least one clause by number; no citation means Manual Review", "Ignore age, marital status and other protected characteristics", "Use only officer-confirmed facts"],
    tools: [],
    knowledge: ["kestrel-lending-policy v1.0 (26 clauses)"],
  },
  drafting: {
    name: "Drafting agent",
    role: "Writes the approval or decline email from the officer's final decision, for the officer to edit.",
    rules: ["State the policy reason in plain language", "Declines mention the 30-day review right", "Never send; sending needs the officer's separate confirmation"],
    tools: ["Gmail: send (after confirmation)"],
    knowledge: [],
  },
};

export const MODELS = ["Recommended for this agent", "Claude", "GPT", "Gemini", "Llama, self-hosted"];
const FRAMEWORKS = ["Lyzr (default)", "GitAgent repo", "LangGraph", "CrewAI", "OpenAI Agents SDK"];

function Node({ icon: Icon, title, sub, human, onClick, active }: { icon: typeof Bot; title: string; sub: string; human?: boolean; onClick?: () => void; active?: boolean }) {
  const cls = human ? "border-dashed border-amber/50 bg-amber-wash/60" : active ? "border-blue bg-blue-wash" : "border-line-strong bg-surface hover:border-ink-3";
  const Tag = onClick ? "button" : "div";
  return (
    <Tag onClick={onClick} className={`w-[136px] shrink-0 self-stretch rounded-lg border px-3 py-2.5 text-left ${cls}`}>
      <span className="flex items-center gap-1.5 text-[13px] font-semibold">
        <Icon size={14} className={human ? "text-amber" : "text-blue"} /> {title}
      </span>
      <span className="mt-0.5 block text-[12px] leading-snug text-ink-2">{sub}</span>
    </Tag>
  );
}

const Arrow = () => <span className="h-px w-4 shrink-0 bg-ink-3" aria-hidden="true" />;

export type Mcp = { name: string; url: string };
export type CustomTool = { name: string; detail: string };
export type Extensions = {
  mcpServers: Mcp[];
  tools: CustomTool[];
  onAddMcp: (m: Mcp) => void;
  models: Partial<Record<string, string>>;
  onSwitchModel: (agent: AgentId, to: ModelRun, from: ModelRun, volume: number) => void;
};

const usd = (n: number) => (n < 0.1 ? `$${n.toFixed(3)}` : `$${n.toFixed(2)}`);

/** Run the golden cases on several models side by side; a model can be switched in only if it passes them all. */
function ModelCompare({ agent, current, onSwitch, onClose }: { agent: AgentId; current: string; onSwitch: (to: ModelRun, from: ModelRun, volume: number) => void; onClose: () => void }) {
  const runs = MODEL_RUNS[agent];
  const [picked, setPicked] = useState<string[]>(runs.map((r) => r.model));
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [state, setState] = useState<"idle" | "running" | "done">("idle");
  const cur = runs.find((r) => r.model === current) ?? runs[0];
  const shown = runs.filter((r) => r.model === cur.model || picked.includes(r.model));
  const cases = Object.keys(CASE_TITLES);
  const failures = shown.flatMap((r) => r.results.filter((x) => x.note).map((x) => ({ model: r.model, title: CASE_TITLES[x.caseId], note: x.note!, pass: x.pass })));

  return (
    <div className="absolute inset-0 z-20 overflow-y-auto bg-paper p-6 appear" role="dialog" aria-label={`Compare models for the ${AGENTS[agent].name}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Compare models for the {AGENTS[agent].name}</h3>
          <p className="mt-1 max-w-2xl text-sm text-ink-2">
            Each model runs your three golden cases. A model can be switched in only when every case passes on outcome and reason; cheaper is no use if it cites the wrong clause.
          </p>
        </div>
        <button onClick={onClose} aria-label="Close comparison" className="rounded p-1 text-ink-3 hover:text-ink">
          <X size={18} />
        </button>
      </div>

      <div className="mt-5 flex flex-wrap items-end gap-x-6 gap-y-3">
        <fieldset>
          <legend className="text-[13px] font-medium">Models</legend>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {runs.map((r) => {
              const isCur = r.model === cur.model;
              const on = isCur || picked.includes(r.model);
              return (
                <button
                  key={r.model}
                  disabled={isCur}
                  aria-pressed={on}
                  onClick={() => {
                    setPicked((p) => (p.includes(r.model) ? p.filter((m) => m !== r.model) : [...p, r.model]));
                    setState("idle");
                  }}
                  className={`h-8 rounded-md border px-3 text-[13px] ${on ? "border-blue bg-blue-wash text-blue-ink" : "border-line-strong hover:border-ink-3"} disabled:cursor-default`}
                >
                  {r.model}
                  {isCur && " (current)"}
                </button>
              );
            })}
          </div>
        </fieldset>
        <label className="text-[13px] font-medium">
          Applications a month
          <input
            type="number"
            min={1}
            value={volume}
            onChange={(e) => setVolume(Math.max(1, Number(e.target.value) || 1))}
            className="mt-1.5 block h-8 w-28 rounded-md border border-line-strong bg-surface px-2 text-sm tabular-nums"
          />
        </label>
        <Button
          variant="primary"
          size="sm"
          disabled={state === "running" || shown.length < 2}
          onClick={() => {
            setState("running");
            setTimeout(() => setState("done"), 1800);
          }}
        >
          {state === "running" ? <Loader2 size={14} className="animate-spin" /> : <FlaskConical size={14} />} {state === "done" ? "Run again" : "Run the golden tests"}
        </Button>
      </div>

      {state === "running" && <p className="mt-6 text-sm text-ink-2">Running {cases.length} cases on {shown.length} models, in parallel</p>}

      {state === "done" && (
        <>
          <div className="mt-6 overflow-x-auto rounded-lg border border-line bg-surface">
            <table className="w-full min-w-[760px] text-[13px]">
              <thead>
                <tr className="border-b border-line text-left text-[12px] text-ink-3">
                  <th className="px-4 py-2.5 font-medium">Model</th>
                  {cases.map((c) => (
                    <th key={c} className="px-3 py-2.5 font-medium">{CASE_TITLES[c]}</th>
                  ))}
                  <th className="px-3 py-2.5 text-right font-medium">Per case</th>
                  <th className="px-3 py-2.5 text-right font-medium">Time</th>
                  <th className="px-3 py-2.5 text-right font-medium">A month</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {shown.map((r) => {
                  const passed = r.results.filter((x) => x.pass).length;
                  const all = passed === r.results.length;
                  const isCur = r.model === cur.model;
                  const delta = (r.costPerCase - cur.costPerCase) * volume;
                  return (
                    <tr key={r.model} className={`border-b border-line align-top last:border-0 ${isCur ? "bg-paper/60" : ""}`}>
                      <td className="px-4 py-3">
                        <span className="font-medium">{r.model}</span>
                        {r.note && <span className="mt-0.5 block max-w-[180px] text-[12px] text-ink-3">{r.note}</span>}
                      </td>
                      {cases.map((c) => {
                        const x = r.results.find((y) => y.caseId === c)!;
                        return (
                          <td key={c} className="px-3 py-3">
                            <span className={`flex items-center gap-1 ${x.pass ? "text-green" : "text-red"}`}>
                              {x.pass ? <Check size={14} /> : <X size={14} />} {x.pass ? "Pass" : "Fail"}
                            </span>
                            <span className="block text-[12px] text-ink-3">{x.cited}</span>
                          </td>
                        );
                      })}
                      <td className="px-3 py-3 text-right">{usd(r.costPerCase)}</td>
                      <td className="px-3 py-3 text-right">{r.seconds.toFixed(1)}s</td>
                      <td className="px-3 py-3 text-right">
                        {usd(r.costPerCase * volume)}
                        {!isCur && Math.abs(delta) >= 0.01 && <span className={`block text-[12px] ${delta < 0 ? "text-green" : "text-amber"}`}>{delta < 0 ? "−" : "+"}{usd(Math.abs(delta))}</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isCur ? (
                          <span className="text-[12px] text-ink-3">Current</span>
                        ) : all ? (
                          <Button size="sm" variant="primary" onClick={() => onSwitch(r, cur, volume)}>
                            Switch
                          </Button>
                        ) : (
                          <span className="text-[12px] text-ink-3">{passed} of {r.results.length} pass</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {failures.length > 0 && (
            <div className="mt-5">
              <h4 className="text-[13px] font-semibold">What the runs got wrong</h4>
              <ul className="mt-1.5 space-y-1 text-[13px]">
                {failures.map((f) => (
                  <li key={f.model + f.title} className="flex gap-2">
                    {f.pass ? <Check size={14} className="mt-0.5 shrink-0 text-green" /> : <X size={14} className="mt-0.5 shrink-0 text-red" />}
                    <span>
                      <span className="font-medium">{f.model}, {f.title}:</span> <span className="text-ink-2">{f.note}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="mt-5 text-[12px] text-ink-3">Switching makes a new version, so it can be reverted, and it goes through review like any other change. The figures are sample data in this prototype.</p>
        </>
      )}
    </div>
  );
}

/** Servers and tools the agents can call, like the MCP Servers panel on Architect's agent graph. */
function ExtensionsPanel({ ext }: { ext: Extensions }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const valid = name.trim() && /^https?:\/\/\S+$/.test(url.trim());
  const built = [{ name: "Gmail", url: "Connection gmail-01, send needs officer confirmation" }];
  return (
    <section className="mt-8 max-w-2xl" aria-label="MCP servers and tools">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">MCP servers and tools</h3>
        {!adding && (
          <button onClick={() => setAdding(true)} className="text-[13px] font-medium text-blue hover:underline">
            Add MCP server
          </button>
        )}
      </div>
      <p className="mt-0.5 text-[13px] text-ink-3">What the agents can call. Anything new runs through the golden tests before it reaches production.</p>
      <ul className="mt-3 divide-y divide-line rounded-lg border border-line bg-surface text-sm">
        {[...built, ...ext.mcpServers].map((m) => (
          <li key={m.name + m.url} className="flex items-center gap-3 px-4 py-2.5">
            <Server size={14} className="shrink-0 text-ink-3" />
            <span className="font-medium">{m.name}</span>
            <span className="min-w-0 flex-1 truncate text-[13px] text-ink-3">{m.url}</span>
            <span className="text-[12px] text-green">Connected</span>
          </li>
        ))}
        {ext.tools.map((t) => (
          <li key={t.name} className="flex items-center gap-3 px-4 py-2.5">
            <Wrench size={14} className="shrink-0 text-ink-3" />
            <span className="font-medium">{t.name}</span>
            <span className="min-w-0 flex-1 truncate text-[13px] text-ink-3">{t.detail}</span>
            <span className="text-[12px] text-ink-3">Custom tool</span>
          </li>
        ))}
      </ul>
      {adding && (
        <form
          className="mt-3 grid gap-2 rounded-lg border border-line bg-surface p-3 sm:grid-cols-[1fr_1.4fr_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid) return;
            ext.onAddMcp({ name: name.trim(), url: url.trim() });
            setName("");
            setUrl("");
            setAdding(false);
          }}
        >
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name, e.g. Companies House" aria-label="Server name" className="h-9 rounded-md border border-line-strong px-2.5 text-sm outline-none focus:border-blue" />
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://mcp.example.com/sse" aria-label="Server URL" className="h-9 rounded-md border border-line-strong px-2.5 text-sm outline-none focus:border-blue" />
          <div className="flex gap-2">
            <button type="submit" disabled={!valid} className="h-9 rounded-md bg-blue px-3 text-sm font-medium text-white disabled:opacity-45">
              Add server
            </button>
            <button type="button" onClick={() => setAdding(false)} className="h-9 rounded-md px-2 text-sm text-ink-2 hover:text-ink">
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

export function AgentsCanvas({ initialOpen = null, ext }: { initialOpen?: AgentId | null; ext?: Extensions }) {
  const [open, setOpen] = useState<AgentId | null>(initialOpen);
  const [framework, setFramework] = useState<Record<AgentId, string>>({ extraction: FRAMEWORKS[0], policy: FRAMEWORKS[0], drafting: FRAMEWORKS[0] });
  const [comparing, setComparing] = useState<AgentId | null>(null);
  const a = open ? AGENTS[open] : null;

  return (
    <div className="relative h-full overflow-auto p-6">
      <p className="text-sm text-ink-2">How a case moves through the app. Dashed steps are people, not agents. Click an agent to change it here, no other tool needed.</p>
      <div className="mt-6 flex items-center overflow-x-auto pb-2">
        <Node icon={Upload} title="Upload" sub="Officer adds a PDF" />
        <Arrow />
        <Node icon={Bot} title="Extraction" sub="Facts with sources" onClick={() => setOpen("extraction")} active={open === "extraction"} />
        <Arrow />
        <Node icon={UserCheck} title="Officer confirms" sub="Corrects facts; logged" human />
        <Arrow />
        <Node icon={Bot} title="Policy" sub="Recommendation and clauses" onClick={() => setOpen("policy")} active={open === "policy"} />
        <Arrow />
        <Node icon={Bot} title="Drafting" sub="Email for the officer" onClick={() => setOpen("drafting")} active={open === "drafting"} />
        <Arrow />
        <Node icon={Send} title="Officer sends" sub="Separate confirmation" human />
      </div>
      {ext && <ExtensionsPanel ext={ext} />}
      {comparing && ext && (
        <ModelCompare
          agent={comparing}
          current={ext.models[comparing] ?? MODEL_RUNS[comparing][0].model}
          onClose={() => setComparing(null)}
          onSwitch={(to, from, volume) => {
            ext.onSwitchModel(comparing, to, from, volume);
            setComparing(null);
          }}
        />
      )}

      {a && open && (
        <aside className="absolute inset-y-0 right-0 w-[380px] overflow-y-auto border-l border-line bg-surface p-5 shadow-[-8px_0_24px_-16px_rgba(24,32,46,0.25)] appear" aria-label={`${a.name} settings`}>
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-semibold">{a.name}</h3>
            <button onClick={() => setOpen(null)} aria-label="Close" className="rounded p-1 text-ink-3 hover:text-ink">
              <X size={16} />
            </button>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ink-2">{a.role}</p>

          <h4 className="mt-5 text-[13px] font-semibold">Rules</h4>
          <ul className="mt-1.5 space-y-1.5 text-sm">
            {a.rules.map((r) => (
              <li key={r} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue" />
                {r}
              </li>
            ))}
          </ul>

          <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="text-[13px] font-semibold">Tools</h4>
              <p className="mt-1 text-ink-2">{a.tools.length ? a.tools.join(", ") : "None"}</p>
            </div>
            <div>
              <h4 className="text-[13px] font-semibold">Knowledge</h4>
              <p className="mt-1 text-ink-2">{a.knowledge.length ? a.knowledge.join(", ") : "None"}</p>
            </div>
          </div>

          <h4 className="mt-5 text-[13px] font-semibold">Model</h4>
          <div className="mt-1.5 flex items-center justify-between gap-3 rounded-md border border-line-strong px-3 py-2 text-sm">
            <span>{ext?.models[open] ?? MODEL_RUNS[open][0].model}</span>
            <span className="text-[12px] text-ink-3">{usd((MODEL_RUNS[open].find((r) => r.model === (ext?.models[open] ?? MODEL_RUNS[open][0].model)) ?? MODEL_RUNS[open][0]).costPerCase)} per case</span>
          </div>
          <Button size="sm" className="mt-2" onClick={() => setComparing(open)}>
            <Scale size={14} /> Compare models on the golden tests
          </Button>

          <label className="mt-5 block text-[13px] font-semibold" htmlFor="framework">
            Framework
          </label>
          <select
            id="framework"
            value={framework[open]}
            onChange={(e) => setFramework({ ...framework, [open]: e.target.value })}
            className="mt-1.5 h-9 w-full rounded-md border border-line-strong bg-surface px-2 text-sm"
          >
            {FRAMEWORKS.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
          <p className="mt-1.5 text-[12px] text-ink-3">The agent&apos;s definition stays in its GitAgent folder; switching framework regenerates only its code, behind the same tests.</p>
          <p className="mt-5 text-[12px] text-ink-3">Model figures are sample data in this prototype.</p>
        </aside>
      )}
    </div>
  );
}
