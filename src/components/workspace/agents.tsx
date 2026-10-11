"use client";

import { useState } from "react";
import { Bot, UserCheck, Upload, Send, X, FlaskConical, Server, Wrench } from "lucide-react";
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
export type Extensions = { mcpServers: Mcp[]; tools: CustomTool[]; onAddMcp: (m: Mcp) => void };

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
  const [model, setModel] = useState<Record<AgentId, string>>({ extraction: MODELS[0], policy: MODELS[0], drafting: MODELS[0] });
  const [framework, setFramework] = useState<Record<AgentId, string>>({ extraction: FRAMEWORKS[0], policy: FRAMEWORKS[0], drafting: FRAMEWORKS[0] });
  const [compare, setCompare] = useState<"idle" | "running" | "done">("idle");
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

          <label className="mt-5 block text-[13px] font-semibold" htmlFor="model">
            Model
          </label>
          <select
            id="model"
            value={model[open]}
            onChange={(e) => {
              setModel({ ...model, [open]: e.target.value });
              setCompare("idle");
            }}
            className="mt-1.5 h-9 w-full rounded-md border border-line-strong bg-surface px-2 text-sm"
          >
            {MODELS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          {model[open] !== MODELS[0] && (
            <div className="mt-2 rounded-md bg-paper p-3 text-[13px]">
              {compare === "idle" && (
                <>
                  <p>The switch applies only after this agent&apos;s golden tests pass on {model[open]}.</p>
                  <Button
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setCompare("running");
                      setTimeout(() => setCompare("done"), 1600);
                    }}
                  >
                    <FlaskConical size={14} /> Compare on the tests
                  </Button>
                </>
              )}
              {compare === "running" && <p className="text-ink-2">Running 3 cases on both models</p>}
              {compare === "done" && (
                <table className="w-full text-left">
                  <thead className="text-ink-3">
                    <tr>
                      <th className="pb-1 font-medium">Model</th>
                      <th className="pb-1 font-medium">Tests</th>
                      <th className="pb-1 font-medium">Cost per case</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Current</td>
                      <td className="text-green">3 of 3</td>
                      <td>$0.011</td>
                    </tr>
                    <tr>
                      <td>{model[open]}</td>
                      <td className="text-green">3 of 3</td>
                      <td>$0.008</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          )}

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
          <p className="mt-5 text-[12px] text-ink-3">Comparison figures are sample data in this prototype.</p>
        </aside>
      )}
    </div>
  );
}
