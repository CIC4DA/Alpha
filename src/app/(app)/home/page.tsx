"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUp, ClipboardCheck, Compass, GitBranch, Layers, LayoutTemplate, Palette, Plus, Sparkles, X } from "lucide-react";
import { takePrefill } from "@/lib/prefill";
import { createProject, getOrg, listBlueprints, listOrgs, listProjects, saveJourney, switchOrg, updateOrg, type Blueprint, type DeployTarget, type Org, type Project } from "@/lib/store";
import { DESIGN_SYSTEMS, PROMPTS } from "@/lib/explore-content";
import { SAMPLE_PROMPT } from "@/lib/fixtures";
import { MODES, type ChatMode } from "@/components/workspace/chat";
import { ProjectCard } from "@/components/project-card";
import { QuickSetting } from "@/components/quick-setting";

const DS_KEY = "alpha.design-system";

// One idea from each of a few teams, so the first screen shows the range.
// The loan-triage idea uses the scripted example's exact prompt, so the whole journey plays out.
const IDEAS = ["Lending", "Operations", "Support", "Finance"]
  .map((c) => PROMPTS.find((p) => p.category === c))
  .filter((p): p is (typeof PROMPTS)[number] => Boolean(p))
  .map((p) => (p.title === "Loan application triage" ? { ...p, text: SAMPLE_PROMPT } : p));

const chip = "flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] text-ink-2 hover:border-ink-3 hover:text-ink";
const menuItem = "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] hover:bg-paper";

/**
 * One Home for everyone. The line above the composer is the workspace: whose it is, where its apps run, who signs
 * off. A business user reads it once; an FDE switches customer there. The composer's own settings are per project.
 */
export default function HomePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [org, setOrg] = useState<Org | null>(null);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [plusOpen, setPlusOpen] = useState(false);
  // Settings for the next project
  const [mode, setMode] = useState<ChatMode>("auto");
  const [design, setDesign] = useState("ledger");
  const [browserTest, setBrowserTest] = useState(false);

  useEffect(() => {
    const handed = takePrefill();
    if (handed) setPrompt(handed);
    try {
      setDesign(localStorage.getItem(DS_KEY) ?? "ledger");
    } catch {}
  }, []);

  useEffect(() => {
    const load = () => {
      listProjects()
        .then(setProjects)
        .catch((e) => setError(e.message));
      getOrg()
        .then(setOrg)
        .catch(() => {});
      listOrgs()
        .then(setOrgs)
        .catch(() => {});
      listBlueprints()
        .then(setBlueprints)
        .catch(() => {});
    };
    load();
    window.addEventListener("alpha:org", load);
    return () => window.removeEventListener("alpha:org", load);
  }, []);

  const chooseDesign = (id: string) => {
    setDesign(id);
    try {
      localStorage.setItem(DS_KEY, id);
    } catch {}
  };

  const orgSetting = (patch: Partial<Org>) => updateOrg(patch).catch((e) => setError((e as Error).message));

  const pickBlueprint = (b: Blueprint | null) => {
    setBlueprint(b);
    setPlusOpen(false);
    if (b) setPrompt(b.prompt);
  };

  const start = async () => {
    const text = prompt.trim();
    if (text.length < 12) return setError("Describe what the app should do in a sentence or two.");
    setBusy(true);
    setError(null);
    try {
      const p = await createProject(text, blueprint?.name);
      // A blueprint carries the plan's answers and tests, never the earlier customer's files or accounts.
      const fromBp = blueprint
        ? { answers: blueprint.answers, suggestedOn: blueprint.suggestedOn, fromBlueprint: `${blueprint.source} (blueprint version ${blueprint.version})`, blueprintId: blueprint.id, blueprintVersion: blueprint.version }
        : {};
      await saveJourney(p.id, { ...fromBp, chatMode: mode, designSystem: design, browserTest });
      router.push(`/p/${p.id}`);
      // Home stays mounted in the background, so leave it ready for the next project.
      setBusy(false);
      setPrompt("");
      setBlueprint(null);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  const waiting = (projects ?? []).filter((p) => p.status === "in_review" || p.stage === "connect");
  const customer = org?.kind === "customer";

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] [background-image:linear-gradient(to_right,rgba(35,80,216,0.09)_1px,transparent_1px),linear-gradient(to_bottom,rgba(35,80,216,0.09)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_70%_80%_at_50%_0%,black_35%,transparent_80%)]"
      />

      <div className="relative mx-auto max-w-[1040px] px-4 pb-12 pt-10 sm:px-8 sm:pt-16">
        <div className="mx-auto max-w-[840px]">
          <h1 className="text-center font-serif text-[32px] leading-[1.1] tracking-[-0.015em] sm:text-[44px]">{customer ? `What are we building for ${org!.name}?` : "What do you want to build?"}</h1>
          <p className="mx-auto mt-3 max-w-[36rem] text-center text-[15px] leading-relaxed text-ink-2">
            Describe the work, or start from a blueprint or a repository. You&apos;ll answer a few questions and see the plan and its price before anything is built.
          </p>

          {/* The workspace, as one sentence. Changes here apply to every app in the workspace. */}
          <div className="mt-8 flex flex-wrap items-center gap-x-1 gap-y-1 px-1 text-[13px] text-ink-2" aria-label="Workspace settings">
            <span>Building in</span>
            <QuickSetting
              inline
              label="Workspace"
              icon={Layers}
              value={org?.id ?? ""}
              disabled={!org}
              onChange={(id) => switchOrg(id)}
              options={(orgs.length ? orgs : org ? [org] : []).map((o) => ({ id: o.id, label: o.name, detail: o.kind === "customer" ? "Customer workspace" : "Your own workspace" }))}
              footer={
                <Link href="/settings" className="text-blue hover:underline">
                  New customer workspace, or invite people
                </Link>
              }
            />
            <span className="text-ink-3">·</span>
            <span>apps run in</span>
            <QuickSetting<DeployTarget>
              inline
              label="Runs in"
              icon={Layers}
              value={org?.deployTarget ?? "architect"}
              disabled={!org}
              onChange={(v) => orgSetting({ deployTarget: v })}
              options={[
                { id: "architect", label: "Architect cloud", detail: "We host it. Quickest to go live." },
                {
                  id: "customer_cloud",
                  label: customer ? `${org!.name}'s cloud` : "your own cloud",
                  detail: org?.cloudAccount ? `Deploys into ${org.cloudAccount}.` : "Deploys into their AWS account; connect it in workspace settings.",
                },
              ]}
            />
            <span className="text-ink-3">·</span>
            <span>signed off by</span>
            <QuickSetting
              inline
              label="Sign-off"
              icon={Layers}
              value={org?.approvalRequired ? "separate" : "self"}
              disabled={!org}
              onChange={(v) => orgSetting({ approvalRequired: v === "separate" })}
              options={[
                { id: "self", label: "the builder", detail: "A pre-flight checklist with test evidence, then deploy." },
                { id: "separate", label: "a separate approver", detail: "Someone other than the builder approves before anything goes live." },
              ]}
            />
          </div>

          <div className="mt-2 rounded-2xl border border-line-strong bg-surface shadow-[0_1px_0_rgba(24,32,46,0.04),0_18px_40px_-24px_rgba(24,32,46,0.35)] focus-within:border-blue">
            {blueprint && (
              <div className="flex items-center gap-2 px-4 pt-3">
                <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-blue-wash px-2.5 py-1 text-[12px] font-medium text-blue-ink">
                  <Layers size={13} /> From blueprint: {blueprint.name}, v{blueprint.version}
                  <button onClick={() => setBlueprint(null)} aria-label="Don't use the blueprint" className="ml-0.5 rounded-full hover:text-ink">
                    <X size={13} />
                  </button>
                </span>
                <span className="hidden text-[12px] text-ink-3 sm:inline">Plan and tests come along; this customer connects their own data.</span>
              </div>
            )}
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) start();
              }}
              rows={4}
              placeholder="Describe the work, for example: loan officers upload application PDFs, an agent checks each against our lending policy and cites the clause, then drafts the reply for the officer to approve."
              className="block w-full resize-none bg-transparent px-4 pb-2 pt-4 text-[15px] leading-relaxed outline-none placeholder:text-ink-3"
              aria-label="Describe your app"
            />

            <div className="flex items-end gap-2 px-3 pb-3">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                <div
                  className="relative"
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) setPlusOpen(false);
                  }}
                >
                  <button
                    onClick={() => setPlusOpen((o) => !o)}
                    aria-label="More ways to start"
                    aria-expanded={plusOpen}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-paper/70 text-ink-2 hover:border-line-strong hover:text-ink"
                  >
                    <Plus size={16} />
                  </button>
                  {plusOpen && (
                    <div role="menu" className="absolute bottom-full left-0 z-30 mb-2 w-64 rounded-xl border border-line bg-surface p-1.5 shadow-[0_12px_32px_-12px_rgba(24,32,46,0.28)]">
                      {blueprints.length > 0 && (
                        <>
                          <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-medium text-ink-3">Start from a blueprint</p>
                          {blueprints.map((b) => (
                            <button key={b.id} role="menuitem" onClick={() => pickBlueprint(b)} className={menuItem}>
                              <Layers size={14} className="text-blue" /> {b.name}, v{b.version}
                            </button>
                          ))}
                          <div className="my-1 border-t border-line" />
                        </>
                      )}
                      <Link role="menuitem" href="/import" className={menuItem}>
                        <GitBranch size={14} className="text-ink-3" /> Import from GitHub
                      </Link>
                      <Link role="menuitem" href="/explore#templates" className={menuItem}>
                        <LayoutTemplate size={14} className="text-ink-3" /> Start from a template
                      </Link>
                      <Link role="menuitem" href="/explore#prompts" className={menuItem}>
                        <Compass size={14} className="text-ink-3" /> Browse the prompt library
                      </Link>
                    </div>
                  )}
                </div>
                <QuickSetting label="Mode" icon={Sparkles} value={mode} onChange={setMode} options={MODES.map((m) => ({ id: m.id, label: m.label, detail: m.detail }))} />
                <QuickSetting label="Look" icon={Palette} value={design} onChange={chooseDesign} options={DESIGN_SYSTEMS.map((d) => ({ id: d.id, label: d.name, detail: d.summary }))} />
                <QuickSetting
                  label="Checks"
                  icon={ClipboardCheck}
                  value={browserTest ? "browser" : "golden"}
                  onChange={(v) => setBrowserTest(v === "browser")}
                  options={[
                    { id: "golden", label: "Golden tests", detail: "Cases from your own files, checked on the outcome and the reason." },
                    { id: "browser", label: "Golden tests and a browser run", detail: "Also clicks through every screen after each build. Takes a little longer." },
                  ]}
                />
              </div>
              <button
                onClick={start}
                disabled={busy}
                aria-label={busy ? "Creating project" : "Plan it"}
                className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-blue pl-3.5 pr-3 text-sm font-medium text-white hover:bg-blue-ink disabled:opacity-60"
              >
                {busy ? "Creating" : "Plan it"} <ArrowUp size={16} />
              </button>
            </div>
          </div>
          {error && <p className="mt-3 text-center text-sm text-red">{error}</p>}

          {/* Your blueprints first, then ideas and a repository: the same row serves a first app and a tenth customer. */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {blueprints.slice(0, 2).map((b) => (
              <button key={b.id} onClick={() => pickBlueprint(b)} className={chip}>
                <Layers size={13} className="text-blue" /> {b.name}, v{b.version}
              </button>
            ))}
            {IDEAS.slice(0, blueprints.length ? 3 : 4).map((p) => (
              <button key={p.title} onClick={() => setPrompt(p.text)} className={chip}>
                {p.title}
              </button>
            ))}
            <Link href="/import" className={chip}>
              <GitBranch size={13} /> Import a repository
            </Link>
          </div>
        </div>

        {waiting.length > 0 && (
          <section className="mt-16" aria-label="Needs you">
            <h2 className="text-sm font-semibold">Needs you</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {waiting.slice(0, 4).map((p) => (
                <li key={p.id}>
                  <Link href={`/p/${p.id}`} className="flex items-center justify-between gap-3 rounded-lg border border-amber/30 bg-amber-wash/50 px-4 py-3 text-sm hover:border-amber/60">
                    <span className="min-w-0">
                      <span className="font-medium">{p.name}</span>
                      <span className="text-ink-2"> {p.status === "in_review" ? "is waiting for approval" : "needs its files and accounts connected"}</span>
                    </span>
                    <span className="shrink-0 text-blue">Open</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className={waiting.length ? "mt-10" : "mt-16"}>
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
            <div className="mt-3 rounded-lg border border-dashed border-line-strong bg-surface/60 p-8 text-center">
              <p className="font-medium">No projects yet</p>
              <p className="mt-1 text-sm text-ink-2">Describe an app above, or pick Loan application triage to see the whole journey.</p>
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
    </div>
  );
}
