"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Loader2, ShieldCheck, ExternalLink, RotateCcw, AlertTriangle } from "lucide-react";
import { RULE_CHECKS, RECEIPT, PLAN, CHANGE_COST } from "@/lib/fixtures";
import type { Journey } from "@/lib/journey";
import type { Project } from "@/lib/store";
import { Button, money } from "../ui";

const CHECKS = [
  ...RULE_CHECKS.map((r) => ({ label: r.label, evidence: r.evidence })),
  { label: "All golden cases pass on outcome and reason", evidence: "3 of 3 cases" },
  { label: "No secrets in the code", evidence: "Build scan found 0 hard-coded keys" },
  { label: "Who can reach it", evidence: "Invited loan officers only" },
];

const DEPLOY_STEPS = ["Production build", "Staging tests, all passing", "Database migrations", "Agents and policy pinned to tested versions", "Traffic switched, health checks passing"];

export function ShipCanvas({
  project,
  j,
  approvalRequired,
  onRequestReview,
  onDeploy,
  onOpenApprover,
  onApplyChanges,
}: {
  project: Project;
  j: Journey;
  approvalRequired: boolean;
  onRequestReview: () => void;
  onDeploy: () => void;
  onOpenApprover: () => void;
  onApplyChanges: () => void;
}) {
  const [deploying, setDeploying] = useState(-1);
  const [applying, setApplying] = useState(false);
  const blocked = j.demoData;
  const canDeploy = !blocked && (!approvalRequired || j.review === "approved");

  const deploy = () => {
    let i = 0;
    setDeploying(0);
    const tick = () => {
      i += 1;
      if (i >= DEPLOY_STEPS.length) {
        onDeploy();
        return;
      }
      setDeploying(i);
      setTimeout(tick, 900);
    };
    setTimeout(tick, 900);
  };

  if (project.stage === "live") return <LiveCanvas project={project} version={j.version} />;

  return (
    <div className="mx-auto max-w-[760px] px-8 py-8 appear">
      <p className="text-[13px] text-ink-3">{approvalRequired ? "Your organisation requires a separate approver" : "No separate approver required in your organisation"}</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight">{approvalRequired ? "Get it approved, then ship" : "Check it, then ship"}</h2>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
        {approvalRequired
          ? "The approver sees the same checklist with its evidence, and approves or asks for changes."
          : "You're builder and approver here, so this checklist is your pre-flight self-check."}
      </p>

      <ul className="mt-6 divide-y divide-line rounded-lg border border-line bg-surface">
        {CHECKS.map((c) => (
          <li key={c.label} className="flex items-start gap-3 px-4 py-3">
            <Check size={17} className="mt-0.5 shrink-0 text-green" />
            <div>
              <p className="text-sm font-medium">{c.label}</p>
              <p className="text-[13px] text-ink-2">{c.evidence}</p>
            </div>
          </li>
        ))}
        <li className="flex items-start gap-3 px-4 py-3">
          {blocked ? <AlertTriangle size={17} className="mt-0.5 shrink-0 text-amber" /> : <Check size={17} className="mt-0.5 shrink-0 text-green" />}
          <div>
            <p className="text-sm font-medium">Real data, not demo data</p>
            <p className="text-[13px] text-ink-2">{blocked ? "This version uses demo data. Connect the policy and Gmail in Connect first." : "Lending policy and Gmail connected"}</p>
          </div>
        </li>
      </ul>

      {approvalRequired && (
        <div className="mt-6 rounded-lg border border-line bg-surface p-4">
          {j.review === "none" && (
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-ink-2">Send this version to an approver. They get it in their Inbox.</p>
              <Button variant="primary" onClick={onRequestReview} disabled={blocked}>
                <ShieldCheck size={15} /> Request review
              </Button>
            </div>
          )}
          {j.review === "requested" && (
            <div className="flex items-center justify-between gap-4">
              <p className="flex items-center gap-2 text-sm">
                <Loader2 size={15} className="animate-spin text-amber" /> Waiting for the approver. Nothing is spent while waiting.
              </p>
              <button onClick={onOpenApprover} className="shrink-0 text-[13px] text-blue hover:underline">
                Switch to Approver view
              </button>
            </div>
          )}
          {j.review === "approved" && <p className="flex items-center gap-2 text-sm text-green"><Check size={15} /> Approved. Ready to deploy.</p>}
          {j.review === "changes" && (
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm">
                <span className="font-medium text-amber">Changes requested:</span> &ldquo;{j.reviewNote}&rdquo;
              </p>
              <Button
                variant="primary"
                className="shrink-0"
                disabled={applying}
                onClick={() => {
                  setApplying(true);
                  setTimeout(() => {
                    onApplyChanges();
                    setApplying(false);
                  }, 2600);
                }}
              >
                {applying ? <Loader2 size={15} className="animate-spin" /> : null} {applying ? `Making version ${j.version + 1}` : "Make this change"}
              </Button>
            </div>
          )}
          {j.review === "none" && j.version > 1 && <p className="mt-2 text-[12px] text-ink-3">Version {j.version}: rebuilt only what changed, all checks pass again, {money(CHANGE_COST)}.</p>}
        </div>
      )}

      <div className="mt-8 border-t border-line pt-6">
        {deploying >= 0 ? (
          <ol className="space-y-2" aria-label="Deploy progress">
            {DEPLOY_STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-2 text-sm">
                {i < deploying ? <Check size={15} className="text-green" /> : i === deploying ? <Loader2 size={15} className="animate-spin text-blue" /> : <span className="h-[15px] w-[15px] rounded-full border border-line-strong" />}
                <span className={i > deploying ? "text-ink-3" : ""}>{s}</span>
              </li>
            ))}
          </ol>
        ) : (
          <div className="flex items-center justify-end gap-3">
            <Link href={`/live/${project.slug}?preview=1`} target="_blank" className="flex h-10 items-center gap-1.5 rounded-md border border-line-strong px-4 text-sm hover:border-ink-3">
              Open preview <ExternalLink size={14} />
            </Link>
            <Button variant="primary" onClick={deploy} disabled={!canDeploy}>
              Deploy to production
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function LiveCanvas({ project, version }: { project: Project; version: number }) {
  const changes = (version - 1) * CHANGE_COST;
  const actual = RECEIPT.build + RECEIPT.tests + RECEIPT.fixes + changes;
  return (
    <div className="mx-auto max-w-[760px] px-8 py-8 appear">
      <p className="text-[13px] text-green">Live</p>
      <h2 className="mt-1 font-serif text-[32px] leading-tight">{project.name} is live</h2>
      <Link href={`/live/${project.slug}`} target="_blank" className="mt-2 inline-flex items-center gap-1.5 text-blue hover:underline">
        {project.slug}.architect.app <ExternalLink size={14} />
      </Link>

      <section className="mt-8 rounded-lg border border-line bg-surface p-5">
        <h3 className="text-sm font-semibold">Receipt</h3>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-2">Build</dt>
            <dd>{money(RECEIPT.build)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-2">Tests, including the re-run after the fix</dt>
            <dd>{money(RECEIPT.tests)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-2">Fixes for our mistakes</dt>
            <dd>Free</dd>
          </div>
          {changes > 0 && (
            <div className="flex justify-between">
              <dt className="text-ink-2">Changes the approver asked for</dt>
              <dd>{money(changes)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-line pt-2 font-semibold">
            <dt>Total</dt>
            <dd>{money(actual)}</dd>
          </div>
        </dl>
        <p className="mt-2 text-[13px] text-ink-3">
          Estimated ${PLAN.estimate.low}–{PLAN.estimate.high} before the build. Within the estimate.
        </p>
      </section>

      <section className="mt-6 rounded-lg border border-line bg-surface p-5">
        <h3 className="text-sm font-semibold">Versions</h3>
        <ul className="mt-3 divide-y divide-line text-sm">
          <li className="flex items-center justify-between py-2">
            <span>
              <span className="font-medium">v{version}</span>{" "}
              <span className="text-ink-2">{version > 1 ? "First release, with the approver's changes; 6 checks passing" : "First release: four screens, three agents, 6 checks passing"}</span>
            </span>
            <span className="text-[12px] text-green">Live</span>
          </li>
        </ul>
        <p className="mt-3 flex items-center gap-1.5 text-[13px] text-ink-3">
          <RotateCcw size={13} /> Every future version keeps a one-click rollback to the one before.
        </p>
      </section>

      <p className="mt-6 text-[13px] text-ink-2">
        Next: changes to a live app happen in a new version: preview, tests, approval if your organisation requires it, then deploy. Live keeps running meanwhile.
      </p>
    </div>
  );
}
