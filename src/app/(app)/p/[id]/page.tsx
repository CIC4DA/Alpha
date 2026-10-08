"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getOrg, getProject, updateProject, type Org, type Project, type Stage } from "@/lib/store";
import { useJourney } from "@/lib/journey";
import { BUILD_STEPS, CONNECT_ITEMS, QUESTIONS, RECEIPT, GOLDEN } from "@/lib/fixtures";
import { TopBar, stageIndex, type View } from "@/components/workspace/topbar";
import { ChatPane, type ChatItem, type Todo } from "@/components/workspace/chat";
import { PlanCanvas } from "@/components/workspace/plan";
import { ConnectCanvas } from "@/components/workspace/connect";
import { BuildCanvas } from "@/components/workspace/build";
import { TestCanvas, testCounts } from "@/components/workspace/test";
import { ShipCanvas } from "@/components/workspace/ship";
import { DeveloperCanvas, type DevTab } from "@/components/workspace/developer";
import { ApproverCanvas } from "@/components/workspace/approver";

const label = (qid: string, ids: string[]) => {
  const q = QUESTIONS.find((x) => x.id === qid)!;
  return ids.map((id) => q.options.find((o) => o.id === id)?.label ?? id).join("; ");
};

export default function WorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [org, setOrg] = useState<Org | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { j, update, loaded } = useJourney(id);
  const [viewing, setViewing] = useState<Stage>("plan");
  const [view, setView] = useState<View>("builder");
  const [devTab, setDevTab] = useState<DevTab>("files");
  const [devFile, setDevFile] = useState<string | undefined>();

  useEffect(() => {
    getProject(id)
      .then((p) => {
        if (!p) return setError("This project doesn't exist, or you don't have access to it.");
        setProject(p);
        setViewing(p.stage);
      })
      .catch((e) => setError(e.message));
    getOrg().then(setOrg).catch(() => {});
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
    out.push({ kind: "architect", text: `I've called this project "${project.name}". A few questions first, only about what your prompt leaves open.` });
    for (const q of QUESTIONS) if (j.answers[q.id]) out.push({ kind: "user", text: `${q.ask}\n${label(q.id, j.answers[q.id])}` });
    if (!question) out.push({ kind: "architect", text: "The plan is on the right. Anything I added beyond your prompt is marked Suggested and switched off. You'll see the price before anything is built." });
    const s = stageIndex(project.stage);
    if (s >= 1) out.push({ kind: "architect", text: "Plan approved. Before building, connect the lending policy and Gmail, so the first preview runs on your data and your tests use your cases." });
    if (s >= 2) {
      out.push({ kind: "architect", text: j.demoData ? "Building with demo data. The preview will say so, and production stays locked until real data is connected." : "Building now. You can watch the preview fill in, or leave: the build carries on." });
      BUILD_STEPS.forEach((b, i) => out.push({ kind: "step", text: b.label, state: i < j.buildDone ? "done" : i === j.buildDone ? "running" : "waiting" }));
    }
    if (j.buildDone >= BUILD_STEPS.length) out.push({ kind: "architect", text: "Built, and every screen checked end to end. One type error in the review screen was fixed on the first try, at no cost. Next: test it on your sample applications." });
    if (j.testRun !== "none") {
      const bw = GOLDEN.find((g) => g.id === "brightwell")!;
      out.push({ kind: "architect", text: `5 of 6 checks pass. ${bw.firstRun.note} Fixing it is free.` });
    }
    if (j.testRun === "fixed") out.push({ kind: "architect", text: "Fixed. The Policy agent now treats two different figures for the same fact as a conflict under clause 5.2 before anything else. All 6 checks pass." });
    if (j.review === "requested") out.push({ kind: "architect", text: "Review requested. The approver has it in their Inbox, with the checklist and evidence." });
    if (j.review === "approved") out.push({ kind: "architect", text: "Approved. You can deploy." });
    if (j.review === "changes") out.push({ kind: "architect", text: `The approver asked for changes: "${j.reviewNote}". I've pinned it above.` });
    if (project.stage === "live") out.push({ kind: "architect", text: `Live at ${project.slug}.architect.app. Total spent: $${(RECEIPT.build + RECEIPT.tests).toFixed(2)}, inside the estimate.` });
    for (const m of j.chat) out.push({ kind: m.from === "user" ? "user" : "architect", text: m.text });
    return out;
  }, [project, j, question]);

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

  const say = (text: string) =>
    update((p) => ({
      chat: [
        ...p.chat,
        { from: "user", text, at: new Date().toISOString() },
        {
          from: "architect",
          text:
            view === "developer"
              ? "In the full product this change becomes a new version: I'd show you the diff, run the golden tests on it, and apply it only if they pass. In this prototype code changes are scripted, so it's saved here but not applied."
              : "In the full product this becomes a new version: I'd update the plan, rebuild only what's affected and re-run the tests before you see it. In this prototype the build is scripted, so your message is saved but not applied.",
          at: new Date().toISOString(),
        },
      ],
    }));

  const canvas = () => {
    if (view === "developer")
      return <DeveloperCanvas tab={devTab} onTab={setDevTab} buildDone={j.buildDone} initialFile={devFile} />;
    if (view === "approver")
      return (
        <ApproverCanvas
          j={j}
          testsReady={testsReady}
          approvalRequired={org?.approvalRequired ?? false}
          onApprove={() => {
            update({ review: "approved" });
            persist({ status: "preview" });
          }}
          onChanges={(note) => {
            update({ review: "changes", reviewNote: note });
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
        return <BuildCanvas done={j.buildDone} demo={j.demoData} onNext={() => goStage("test")} />;
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
            approvalRequired={org?.approvalRequired ?? false}
            onRequestReview={() => {
              update({ review: "requested" });
              persist({ status: "in_review" });
            }}
            onDeploy={() => persist({ stage: "live", status: "live" })}
            onOpenApprover={() => setView("approver")}
          />
        );
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <TopBar
        project={project}
        viewing={viewing}
        onViewStage={goStage}
        view={view}
        onView={setView}
        shipReady={testsReady}
        onShip={() => goStage(project.stage === "live" ? "live" : "ship")}
      />
      <div className="flex min-h-0 flex-1">
        <ChatPane
          items={items}
          todos={todos}
          question={stageIndex(project.stage) === 0 ? question : undefined}
          qIndex={Math.max(qIndex, 0)}
          qTotal={QUESTIONS.length}
          onAnswer={(v) => question && update((p) => ({ answers: { ...p.answers, [question.id]: v } }))}
          onAllRecommended={() =>
            update((p) => {
              const answers = { ...p.answers };
              for (const q of QUESTIONS) if (!answers[q.id]) answers[q.id] = q.options.filter((o) => o.recommended).map((o) => o.id);
              return { answers };
            })
          }
          onSend={say}
          placeholder={view === "developer" ? "Ask about the code, or ask for a change" : view === "approver" ? "Comment for the builder" : "Ask for a change, or ask a question"}
        />
        <section className="min-w-0 flex-1 overflow-y-auto bg-paper">{canvas()}</section>
      </div>
    </div>
  );
}
