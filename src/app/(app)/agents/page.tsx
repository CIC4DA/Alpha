"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { Bot, ChevronDown, ChevronRight, AlertTriangle } from "lucide-react";
import { getOrg, listProjects, loadJourney, type Org, type Project } from "@/lib/store";
import { AGENT_MONITOR, AGENT_READY_AT, SAMPLE_PROMPT } from "@/lib/fixtures";
import { AGENTS, MODELS, type AgentId } from "@/components/workspace/agents";
import { money } from "@/components/ui";

type Row = { project: Project; agent: AgentId; testsPassed: number; testsTotal: number; live: boolean };

const IDS: AgentId[] = ["extraction", "policy", "drafting"];

// The loan-triage script is the only one whose build creates agents in this prototype.
const scripted = (p: Project) => p.prompt.trim() === SAMPLE_PROMPT.trim();

export default function AgentsPage() {
  const [org, setOrg] = useState<Org | null>(null);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [model, setModel] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      setOrg(await getOrg());
      const projects = (await listProjects()).filter(scripted);
      const out: Row[] = [];
      for (const p of projects) {
        const j = (await loadJourney(p.id)) as { buildDone?: number } | null;
        const done = j?.buildDone ?? 0;
        for (const a of IDS) if (done >= AGENT_READY_AT[a]) out.push({ project: p, agent: a, testsPassed: p.testsPassed, testsTotal: p.testsTotal, live: p.status === "live" });
      }
      setRows(out);
    };
    load().catch(() => setRows([]));
    window.addEventListener("alpha:org", load);
    return () => window.removeEventListener("alpha:org", load);
  }, []);

  const projectCount = new Set((rows ?? []).map((r) => r.project.id)).size;
  const live = (rows ?? []).filter((r) => r.live);
  const weekCost = live.reduce((t, r) => t + AGENT_MONITOR[r.agent].cost, 0);
  const failures = live.reduce((t, r) => t + AGENT_MONITOR[r.agent].failures, 0);

  return (
    <div className="mx-auto max-w-[1040px] px-4 py-8 sm:px-8 sm:py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Agents</h1>
      <p className="mt-1 max-w-[42rem] text-sm leading-relaxed text-ink-2">
        Every agent in {org?.name ?? "this workspace"}, across its projects: what it runs on, what it costs and where it fails. Change one here or in its project; there&apos;s no separate studio to go to.
      </p>

      {rows === null ? (
        <p className="mt-8 text-sm text-ink-3">Loading agents</p>
      ) : rows.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-line-strong p-8 text-center">
          <p className="font-medium">No agents in this workspace yet</p>
          <p className="mt-1 text-sm text-ink-2">Agents appear here as soon as a project&apos;s build creates them. Start from the loan-triage template to see three.</p>
        </div>
      ) : (
        <>
          <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-3 text-sm">
            <div>
              <dt className="text-ink-3">Agents</dt>
              <dd className="text-lg font-semibold">
                {rows.length} <span className="text-sm font-normal text-ink-2">in {projectCount} {projectCount === 1 ? "project" : "projects"}</span>
              </dd>
            </div>
            <div>
              <dt className="text-ink-3">Cost, last 7 days</dt>
              <dd className="text-lg font-semibold">{live.length ? money(weekCost) : "Not live yet"}</dd>
            </div>
            <div>
              <dt className="text-ink-3">Failures, last 7 days</dt>
              <dd className={`text-lg font-semibold ${failures ? "text-amber" : ""}`}>{live.length ? failures : "None yet"}</dd>
            </div>
          </dl>

          <div className="mt-6 overflow-x-auto rounded-lg border border-line bg-surface">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[13px] text-ink-3">
                  <th className="px-4 py-2.5 font-medium">Agent</th>
                  <th className="px-4 py-2.5 font-medium">Project</th>
                  <th className="px-4 py-2.5 font-medium">Model</th>
                  <th className="px-4 py-2.5 text-right font-medium">Runs, 7 days</th>
                  <th className="px-4 py-2.5 text-right font-medium">Cost</th>
                  <th className="px-4 py-2.5 text-right font-medium">Failures</th>
                  <th className="px-4 py-2.5 font-medium">Golden tests</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const key = `${r.project.id}:${r.agent}`;
                  const m = AGENT_MONITOR[r.agent];
                  const a = AGENTS[r.agent];
                  const isOpen = open === key;
                  return (
                    <Fragment key={key}>
                      <tr className={`border-b border-line last:border-0 ${isOpen ? "bg-blue-wash/40" : "hover:bg-paper"}`}>
                        <td className="px-4 py-3">
                          <button onClick={() => setOpen(isOpen ? null : key)} aria-expanded={isOpen} className="flex items-center gap-2 text-left font-medium">
                            {isOpen ? <ChevronDown size={15} className="text-ink-3" /> : <ChevronRight size={15} className="text-ink-3" />}
                            <Bot size={15} className="text-blue" /> {a.name}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-ink-2">{r.project.name}</td>
                        <td className="px-4 py-3 text-ink-2">{model[key] ?? MODELS[0]}</td>
                        <td className="px-4 py-3 text-right">{r.live ? m.runs : <span className="text-ink-3">Not live</span>}</td>
                        <td className="px-4 py-3 text-right">{r.live ? money(m.cost) : <span className="text-ink-3">–</span>}</td>
                        <td className={`px-4 py-3 text-right ${r.live && m.failures ? "text-amber" : ""}`}>{r.live ? m.failures : <span className="text-ink-3">–</span>}</td>
                        <td className="px-4 py-3">
                          {r.testsTotal ? <span className={r.testsPassed === r.testsTotal ? "text-green" : "text-amber"}>{r.testsPassed} of {r.testsTotal} pass</span> : <span className="text-ink-3">Not run</span>}
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="border-b border-line bg-blue-wash/20">
                          <td colSpan={7} className="px-4 pb-5 pt-2">
                            <div className="grid gap-5 sm:grid-cols-[1.4fr_1fr]">
                              <div>
                                <p className="text-sm leading-relaxed text-ink-2">{a.role}</p>
                                <p className="mt-3 text-[13px] font-medium">Rules</p>
                                <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[13px] text-ink-2">
                                  {a.rules.map((x) => (
                                    <li key={x}>{x}</li>
                                  ))}
                                </ul>
                                {r.live && m.note && (
                                  <p className="mt-3 flex gap-2 rounded-md border border-line bg-surface px-3 py-2 text-[13px] text-ink-2">
                                    <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber" /> {m.note}
                                  </p>
                                )}
                              </div>
                              <div>
                                <label htmlFor={`m-${key}`} className="text-[13px] font-medium">
                                  Model
                                </label>
                                <select
                                  id={`m-${key}`}
                                  value={model[key] ?? MODELS[0]}
                                  onChange={(e) => setModel((s) => ({ ...s, [key]: e.target.value }))}
                                  className="mt-1 h-9 w-full rounded-md border border-line-strong bg-surface px-2 text-sm"
                                >
                                  {MODELS.map((x) => (
                                    <option key={x}>{x}</option>
                                  ))}
                                </select>
                                {model[key] && model[key] !== MODELS[0] && (
                                  <p className="mt-1.5 text-[12px] leading-snug text-ink-2">This makes a new version of {r.project.name}. Its golden tests run on the new model first, and it ships only if they pass.</p>
                                )}
                                {r.live && <p className="mt-3 text-[13px] text-ink-2">Typical response time {m.latency}</p>}
                                <Link href={`/p/${r.project.id}?agent=${r.agent}`} className="mt-3 inline-block text-[13px] font-medium text-blue hover:underline">
                                  Open in {r.project.name}
                                </Link>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[12px] text-ink-3">
            Each agent is a GitAgent folder in its project&apos;s repo, created with the project; there is nothing to set up. Run figures are sample data in this prototype.
          </p>
        </>
      )}
    </div>
  );
}
