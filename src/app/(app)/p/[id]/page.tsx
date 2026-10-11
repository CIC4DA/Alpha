"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getOrg, getProject, invite, isDemo, saveBlueprint, updateProject, type Org, type Project, type Stage } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useJourney } from "@/lib/journey";
import { BUILD_STEPS, CONNECT_ITEMS, QUESTIONS, RECEIPT, GOLDEN, CHANGE_COST } from "@/lib/fixtures";
import { TopBar, STAGES, stageIndex, type View } from "@/components/workspace/topbar";
import { ChatPane, type ChatItem, type ChatMode, type Todo } from "@/components/workspace/chat";
import { PlanCanvas } from "@/components/workspace/plan";
import { ConnectCanvas } from "@/components/workspace/connect";
import { BuildCanvas } from "@/components/workspace/build";
import type { AgentId } from "@/components/workspace/agents";
import { TestCanvas, testCounts } from "@/components/workspace/test";
import { ShipCanvas, liveHost } from "@/components/workspace/ship";
import { DeveloperCanvas, type DevTab } from "@/components/workspace/developer";
import { ApproverCanvas } from "@/components/workspace/approver";

const label = (qid: string, ids: string[]) => {
  const q = QUESTIONS.find((x) => x.id === qid)!;
  return ids.map((id) => q.options.find((o) => o.id === id)?.label ?? id).join("; ");
};

/** Written from the project itself at handover, so it can't drift from what was built. */
function handoverDoc(project: Project, org: Org | null, version: number) {
  return `# ${project.name}: handover

${project.description}

## Where it runs
${org?.deployTarget === "customer_cloud" ? `${org.name}'s ${org.cloudAccount}, isolated VPC` : "Architect cloud"}
Live version: v${version}. Every earlier version can be rolled back in one click.

## Agents
- Extraction agent: reads the PDF; returns name, amount, income, purpose, each with page and quote
- Policy agent: checks confirmed facts against the lending policy; Approve, Decline or Manual Review, citing clauses
- Drafting agent: writes the email; an officer confirms every send

## Rules the agents follow (each is a test)
- Cite a policy clause for every recommendation
- Send missing or conflicting facts to Manual Review
- Officer confirms extracted facts before the policy check
- Never use age, marital status or other protected characteristics

## Making changes
Ask for the change in chat as the builder. Architect makes a new version, runs the golden tests in
tests/golden/ and sends it to the approver. Live keeps running until the new version is approved and deployed.

## Golden tests
3 cases from real applications, checked on outcome and on the clauses cited. Add a case whenever an
officer overrides a recommendation: the override becomes the expected answer.
`;
}

const CHAT_DEFAULT = 380;
const clampChat = (w: number) => Math.round(Math.min(Math.max(w, 300), 760));

export default function WorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [org, setOrg] = useState<Org | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { j, update, loaded } = useJourney(id);
  const [viewing, setViewing] = useState<Stage>("plan");
  const [view, setView] = useState<View>("builder");
  const [devTab, setDevTab] = useState<DevTab>("files");
  const [devFile, setDevFile] = useState<string | undefined>();
  const [pane, setPane] = useState<"chat" | "canvas">("chat"); // narrow screens show one at a time
  const [openAgent, setOpenAgent] = useState<AgentId | null>(null); // from the Agents page
  const [chatMode, setChatMode] = useState<ChatMode>("build");
  const [chatW, setChatW] = useState(CHAT_DEFAULT); // wide screens: the person can drag the chat wider
  const body = useRef<HTMLDivElement>(null);
  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem("alpha.chat-width"));
      if (saved) setChatW(clampChat(saved));
    } catch {}
  }, []);
  const setChat = (w: number) => {
    const v = clampChat(w);
    setChatW(v);
    try {
      localStorage.setItem("alpha.chat-width", String(v));
    } catch {}
  };
  const startDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    const left = body.current?.getBoundingClientRect().left ?? 0;
    const move = (ev: PointerEvent) => setChat(ev.clientX - left);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  useEffect(() => {
    getProject(id)
      .then((p) => {
        if (!p) return setError("This project doesn't exist, or you don't have access to it.");
        setProject(p);
        const agent = new URLSearchParams(window.location.search).get("agent") as AgentId | null;
        if (agent && stageIndex(p.stage) >= stageIndex("build")) {
          setOpenAgent(agent);
          setViewing("build");
          setPane("canvas");
        } else setViewing(p.stage);
      })
      .catch((e) => setError(e.message));
    getOrg()
      .then(setOrg)
      .catch(() => {});
    const v = new URLSearchParams(window.location.search).get("view");
    if (v === "approver" || v === "developer") setView(v);
  }, [id]);

  const persist = useCallback(
    (patch: Partial<Project>) => {
      setProject((p) => (p ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p));
      updateProject(id, patch).catch((e) => setError(e.message));
    },
    [id],
  );

  const goStage = (s: Stage) => {
    if (project && stageIndex(s) > stageIndex(project.stage)) persist({ stage: s });
    setViewing(s);
    setView("builder");
    setPane("canvas");
  };

  // The build runs step by step and survives leaving the page: progress is saved after every step.
  useEffect(() => {
    if (!project || project.stage !== "build" || !loaded || j.buildDone >= BUILD_STEPS.length) return;
    const t = setTimeout(() => update((p) => ({ buildDone: p.buildDone + 1 })), BUILD_STEPS[j.buildDone].ms);
    return () => clearTimeout(t);
  }, [project, j.buildDone, loaded, update]);

  useEffect(() => {
    if (project && j.buildDone >= BUILD_STEPS.length && project.status === "draft") persist({ status: "preview", spendUsd: RECEIPT.build });
  }, [j.buildDone, project, persist]);

  const qIndex = QUESTIONS.findIndex((q) => !j.answers[q.id]);
  const question = qIndex >= 0 ? QUESTIONS[qIndex] : undefined;
  const testsReady = j.testRun === "fixed";

  const items: ChatItem[] = useMemo(() => {
    if (!project) return [];
    const out: ChatItem[] = [{ kind: "user", text: project.prompt }];
    out.push({
      kind: "architect",
      text: j.fromBlueprint
        ? `Started from your blueprint: ${j.fromBlueprint}. The plan's answers, agents and golden tests come with it. That customer's files, accounts and data don't, so Connect starts empty for ${org?.name ?? "this workspace"}.`
        : `I've called this project "${project.name}". A few questions first, only about what your prompt leaves open.`,
    });
    for (const q of QUESTIONS) if (j.answers[q.id]) out.push({ kind: "user", text: `${q.ask}\n${label(q.id, j.answers[q.id])}` });
    if (!question)
      out.push({ kind: "architect", text: "The plan is on the right. Anything I added beyond your prompt is marked Suggested and switched off. You'll see the price before anything is built." });
    const s = stageIndex(project.stage);
    if (s >= 1) out.push({ kind: "architect", text: "Plan approved. Before building, connect the lending policy and Gmail, so the first preview runs on your data and your tests use your cases." });
    if (s >= 2) {
      out.push({
        kind: "architect",
        text: j.demoData
          ? "Building with demo data. The preview will say so, and production stays locked until real data is connected."
          : "Building now. You can watch the preview fill in, or leave: the build carries on.",
      });
      BUILD_STEPS.forEach((b, i) => out.push({ kind: "step", text: b.label, state: i < j.buildDone ? "done" : i === j.buildDone ? "running" : "waiting" }));
    }
    if (j.buildDone >= BUILD_STEPS.length)
      out.push({
        kind: "architect",
        text: "Built, and every screen checked end to end. One type error in the review screen was fixed on the first try, at no cost. Next: test it on your sample applications.",
      });
    if (j.testRun !== "none") {
      const bw = GOLDEN.find((g) => g.id === "brightwell")!;
      out.push({ kind: "architect", text: `5 of 6 checks pass. ${bw.firstRun.note} Fixing it is free.` });
    }
    if (j.testRun === "fixed")
      out.push({ kind: "architect", text: "Fixed. The Policy agent now treats two different figures for the same fact as a conflict under clause 5.2 before anything else. All 6 checks pass." });
    for (const m of j.chat) out.push(m.from === "user" ? { kind: "user", text: m.text, files: m.files } : { kind: "architect", text: m.text });
    if (project.stage === "live") out.push({ kind: "architect", text: `Live at ${liveHost(project, org)}. Total spent: $${project.spendUsd.toFixed(2)}, inside the estimate.` });
    return out;
  }, [project, j, question, org]);

  const todos: Todo[] = useMemo(() => {
    if (!project) return [];
    const t: Todo[] = [];
    if (stageIndex(project.stage) >= 1 && !j.demoData)
      for (const c of CONNECT_ITEMS.filter((x) => x.required && !j.connected[x.id]))
        t.push({ id: c.id, text: c.kind === "file" ? `Upload the ${c.label.toLowerCase()}` : `Connect ${c.label}`, action: () => goStage("connect"), actionLabel: "Open" });
    if (j.testRun === "first") t.push({ id: "fix", text: "Fix 1 failing test", action: () => goStage("test"), actionLabel: "Open" });
    if (j.review === "changes") t.push({ id: "changes", text: `Approver: ${j.reviewNote}` });
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, j]);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center p-8 text-center">
        <div>
          <p className="font-medium">{error}</p>
          <Link href="/projects" className="mt-2 inline-block text-sm text-blue hover:underline">
            Back to projects
          </Link>
        </div>
      </div>
    );
  }
  if (!project || !loaded) return <div className="flex h-screen items-center justify-center text-sm text-ink-3">Opening project</div>;

  const log = (text: string) => ({ from: "architect" as const, text, at: new Date().toISOString() });

  // Files attached in chat do real work in the journey: a policy connects as the policy, other PDFs become sample
  // applications (and so golden tests). The prototype records file names only, never contents.
  const say = (text: string, files: string[] = []) =>
    update((p) => {
      const now = new Date().toISOString();
      const connected = { ...p.connected };
      const notes: string[] = [];
      const pdfs = files.filter((f) => f.toLowerCase().endsWith(".pdf"));
      const others = files.filter((f) => !f.toLowerCase().endsWith(".pdf"));
      const policy = pdfs.find((f) => /polic/i.test(f));
      if (policy) {
        connected.policy = policy;
        notes.push(`I've connected ${policy} as the lending policy. The Policy agent will check against it and cite its clauses.`);
      }
      const samples = pdfs.filter((f) => f !== policy);
      if (samples.length) {
        const all = [...(connected.samples ? connected.samples.split(", ") : []), ...samples];
        connected.samples = Array.from(new Set(all)).join(", ");
        notes.push(`I've added ${samples.length === 1 ? samples[0] : `${samples.length} PDFs`} as sample applications. Each becomes a golden test case before you ship.`);
      }
      if (others.length) notes.push(`I've saved ${others.join(", ")} with the project. In the full product I'd read ${others.length === 1 ? "it" : "them"} and suggest changes to the plan.`);
      if (files.length) notes.push("Everything attached is listed in Connect.");
      const reply =
        text && !files.length
          ? chatMode === "ask"
            ? "Ask mode answers without changing the project, and it's free. In the full product I'd answer from the plan, the code, the traces and the test results. In this prototype answers are scripted. Switch to Build when you want a change made."
            : view === "developer"
              ? "In the full product this change becomes a new version: I'd show you the diff, run the golden tests on it, and apply it only if they pass. In this prototype code changes are scripted, so it's saved here but not applied."
              : "In the full product this becomes a new version: I'd update the plan, rebuild only what's affected and re-run the tests before you see it. In this prototype the build is scripted, so your message is saved but not applied."
          : "";
      return {
        connected,
        chat: [...p.chat, { from: "user", text, at: now, files }, { from: "architect", text: [notes.join(" "), reply].filter(Boolean).join("\n\n"), at: now }],
      };
    });

  const canvas = () => {
    if (view === "developer")
      return (
        <DeveloperCanvas
          tab={devTab}
          onTab={setDevTab}
          buildDone={j.buildDone}
          initialFile={devFile}
          extraFiles={j.handover ? [{ path: "HANDOVER.md", body: handoverDoc(project, org, j.version) }] : []}
        />
      );
    if (view === "approver")
      return (
        <ApproverCanvas
          j={j}
          testsReady={testsReady}
          approvalRequired={org?.approvalRequired ?? false}
          selfReview={Boolean(org?.approvalRequired && !isDemo() && j.reviewRequestedBy && j.reviewRequestedBy === user?.id)}
          onApprove={() => {
            update((p) => ({ review: "approved", chat: [...p.chat, log(`The approver approved version ${p.version}. You can deploy.`)] }));
            persist({ status: "preview" });
          }}
          onChanges={(note) => {
            update((p) => ({
              review: "changes",
              reviewNote: note,
              chat: [...p.chat, log(`The approver asked for a change to version ${p.version}: "${note}". It's pinned above; Ship has a button to make it.`)],
            }));
            persist({ status: "preview" });
          }}
        />
      );
    switch (viewing) {
      case "plan":
        return (
          <PlanCanvas
            name={project.name}
            prompt={project.prompt}
            j={j}
            done={stageIndex(project.stage) > 0}
            onSavePlan={(plan) =>
              update((p) => ({
                planEdit: plan,
                chat: [
                  ...p.chat,
                  log(`Plan updated: ${plan.screens.length} screens, ${plan.agents.length} agents and ${plan.rules.length} rules, each rule a test. The estimate on the plan reflects the change.`),
                ],
              }))
            }
            onToggleSuggested={(sid) => update((p) => ({ suggestedOn: p.suggestedOn.includes(sid) ? p.suggestedOn.filter((x) => x !== sid) : [...p.suggestedOn, sid] }))}
            onContinue={() => goStage("connect")}
            onOpenSpec={() => {
              setDevFile("PLAN.md");
              setDevTab("files");
              setView("developer");
            }}
          />
        );
      case "connect":
        return (
          <ConnectCanvas
            j={j}
            started={stageIndex(project.stage) > 1}
            onConnect={(cid, value) => update((p) => ({ connected: { ...p.connected, [cid]: value } }))}
            onDemo={(on) => update({ demoData: on })}
            onStart={() => goStage("build")}
          />
        );
      case "build":
        return <BuildCanvas done={j.buildDone} demo={j.demoData} onNext={() => goStage("test")} openAgent={openAgent} />;
      case "test":
        return (
          <TestCanvas
            run={j.testRun}
            fixAttempts={j.fixAttempts}
            onRun={() => {
              update({ testRun: "first" });
              const c = testCounts("first");
              persist({ testsPassed: c.passed, testsTotal: c.total, spendUsd: RECEIPT.build + RECEIPT.tests / 2 });
            }}
            onFix={() => {
              update((p) => ({ testRun: "fixed", fixAttempts: p.fixAttempts + 1 }));
              const c = testCounts("fixed");
              persist({ testsPassed: c.passed, testsTotal: c.total, spendUsd: RECEIPT.build + RECEIPT.tests });
            }}
            onShip={() => goStage("ship")}
            onTrace={() => {
              setDevTab("traces");
              setView("developer");
            }}
          />
        );
      default:
        return (
          <ShipCanvas
            project={project}
            j={j}
            org={org}
            approvalRequired={org?.approvalRequired ?? false}
            onHandover={async ({ builder, approver }) => {
              await invite(builder, "builder");
              await invite(approver, "approver");
              update((p) => ({
                handover: { emails: [builder, approver], at: new Date().toISOString() },
                chat: [...p.chat, log(`Handed over to ${org?.name}: ${builder} as builder, ${approver} as approver. I wrote HANDOVER.md from the project; it's in the Developer view.`)],
              }));
            }}
            onSaveBlueprint={async () => {
              await saveBlueprint({
                name: project.name,
                description: project.description,
                prompt: project.prompt,
                answers: j.answers,
                suggestedOn: j.suggestedOn,
                source: `${project.name}, built for ${org?.name ?? "your workspace"}`,
              });
              update({ blueprintSaved: true });
            }}
            onRequestReview={() => {
              update((p) => ({
                review: "requested",
                reviewRequestedBy: user?.id,
                chat: [...p.chat, log(`Review requested for version ${p.version}. The approver has it in their Inbox, with the checklist and evidence.`)],
              }));
              persist({ status: "in_review" });
            }}
            onDeploy={() => persist({ stage: "live", status: "live" })}
            onOpenApprover={() => setView("approver")}
            onApplyChanges={() => {
              const v = j.version + 1;
              update((p) => ({
                review: "none",
                version: v,
                chat: [
                  ...p.chat,
                  log(
                    `Version ${v} makes the approver's change: "${p.reviewNote}". I rebuilt only the parts it touches and re-ran all 6 checks; they pass. It cost $${CHANGE_COST.toFixed(2)}. Request review again when you're ready.`,
                  ),
                ],
              }));
              persist({ spendUsd: project.spendUsd + CHANGE_COST });
            }}
          />
        );
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <TopBar project={project} viewing={viewing} onViewStage={goStage} view={view} onView={setView} shipReady={testsReady} onShip={() => goStage(project.stage === "live" ? "live" : "ship")} />
      <div className="flex shrink-0 items-center gap-2 border-b border-line bg-surface px-4 py-2 lg:hidden">
        <label className="sr-only" htmlFor="stage-pick">
          Stage
        </label>
        <select
          id="stage-pick"
          value={viewing === "live" ? "ship" : viewing}
          onChange={(e) => goStage(e.target.value as Stage)}
          className="h-8 rounded-md border border-line-strong bg-surface px-2 text-[13px] md:hidden"
        >
          {STAGES.map((s, i) => (
            <option key={s.id} value={s.id} disabled={i > stageIndex(project.stage)}>
              {s.label}
            </option>
          ))}
        </select>
        <div className="ml-auto flex rounded-full border border-line-strong p-0.5 text-[12px]" role="group" aria-label="Show">
          {(["chat", "canvas"] as const).map((p) => (
            <button key={p} onClick={() => setPane(p)} aria-pressed={pane === p} className={`rounded-full px-3 py-1 ${pane === p ? "bg-blue-wash font-medium text-blue-ink" : "text-ink-2"}`}>
              {p === "chat" ? "Chat" : view === "builder" ? "Plan and app" : view === "developer" ? "Code" : "Review"}
            </button>
          ))}
        </div>
      </div>
      <div ref={body} className="flex min-h-0 flex-1" style={{ "--chat-w": `${chatW}px` } as React.CSSProperties}>
        <div className={`${pane === "canvas" ? "hidden" : "flex"} w-full min-w-0 shrink-0 lg:flex lg:w-[var(--chat-w)]`}>
          <ChatPane
            items={items}
            todos={todos}
            question={stageIndex(project.stage) === 0 ? question : undefined}
            qIndex={Math.max(qIndex, 0)}
            qTotal={QUESTIONS.length}
            onAnswer={(v) => {
              if (!question) return;
              update((p) => ({ answers: { ...p.answers, [question.id]: v } }));
              if (qIndex === QUESTIONS.length - 1) setPane("canvas");
            }}
            onAllRecommended={() => {
              update((p) => {
                const answers = { ...p.answers };
                for (const q of QUESTIONS) if (!answers[q.id]) answers[q.id] = q.options.filter((o) => o.recommended).map((o) => o.id);
                return { answers };
              });
              setPane("canvas");
            }}
            onSend={say}
            mode={chatMode}
            onMode={setChatMode}
            placeholder={
              chatMode === "ask" ? "Ask a question; nothing will change" : view === "developer" ? "Ask for a change to the code" : view === "approver" ? "Comment for the builder" : "Ask for a change"
            }
          />
        </div>
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize chat"
          aria-valuenow={chatW}
          aria-valuemin={300}
          aria-valuemax={760}
          tabIndex={0}
          title="Drag to resize the chat. Double-click to reset."
          onPointerDown={startDrag}
          onDoubleClick={() => setChat(CHAT_DEFAULT)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setChat(chatW - 24);
            if (e.key === "ArrowRight") setChat(chatW + 24);
          }}
          className="group relative z-10 -mx-[5px] hidden w-[10px] shrink-0 cursor-col-resize lg:block"
        >
          <span className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-transparent transition-colors group-hover:bg-blue/50 group-focus-visible:bg-blue" />
          <span className="absolute left-1/2 top-1/2 flex h-9 w-[10px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-[3px] rounded-full border border-line-strong bg-surface shadow-sm transition-colors group-hover:border-blue group-focus-visible:border-blue">
            <span className="h-[3px] w-[3px] rounded-full bg-ink-3" />
            <span className="h-[3px] w-[3px] rounded-full bg-ink-3" />
            <span className="h-[3px] w-[3px] rounded-full bg-ink-3" />
          </span>
        </div>
        <section className={`${pane === "chat" ? "hidden" : "block"} min-w-0 flex-1 overflow-y-auto bg-paper lg:block`}>{canvas()}</section>
      </div>
    </div>
  );
}
