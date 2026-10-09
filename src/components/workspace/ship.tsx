"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Loader2, ShieldCheck, ExternalLink, RotateCcw, AlertTriangle, Layers, Handshake } from "lucide-react";
import { RULE_CHECKS, RECEIPT, PLAN, CHANGE_COST } from "@/lib/fixtures";
import type { Journey } from "@/lib/journey";
import type { Org, Project } from "@/lib/store";
import { Button, money } from "../ui";

const CHECKS = [
  ...RULE_CHECKS.map((r) => ({ label: r.label, evidence: r.evidence })),
  { label: "All golden cases pass on outcome and reason", evidence: "3 of 3 cases" },
  { label: "No secrets in the code", evidence: "Build scan found 0 hard-coded keys" },
  { label: "Who can reach it", evidence: "Invited loan officers only" },
];

const deploySteps = (org: Org | null) => [
  "Production build",
  "Staging tests, all passing",
  org?.deployTarget === "customer_cloud" ? `Deploying into ${org.name}'s VPC` : "Database migrations",
  "Agents and policy pinned to tested versions",
  "Traffic switched, health checks passing",
];

/** Where the live app answers: Architect's domain, or a private address inside the customer's network. */
export const liveHost = (project: Project, org: Org | null) =>
  org?.deployTarget === "customer_cloud" ? `${project.slug}.apps.${org.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.internal` : `${project.slug}.architect.app`;

export function ShipCanvas({
  project,
  j,
  org,
  approvalRequired,
  onRequestReview,
  onDeploy,
  onOpenApprover,
  onApplyChanges,
  onHandover,
  onSaveBlueprint,
}: {
  project: Project;
  j: Journey;
  org: Org | null;
  approvalRequired: boolean;
  onRequestReview: () => void;
  onDeploy: () => void;
  onOpenApprover: () => void;
  onApplyChanges: () => void;
  onHandover: (people: { builder: string; approver: string }) => Promise<void>;
  onSaveBlueprint: () => Promise<void>;
}) {
  const [deploying, setDeploying] = useState(-1);
  const [applying, setApplying] = useState(false);
  const blocked = j.demoData;
  const noAccount = org?.deployTarget === "customer_cloud" && !org.cloudAccount;
  const canDeploy = !blocked && !noAccount && (!approvalRequired || j.review === "approved");
  const DEPLOY_STEPS = deploySteps(org);

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

  if (project.stage === "live") return <LiveCanvas project={project} j={j} org={org} onHandover={onHandover} onSaveBlueprint={onSaveBlueprint} />;

  return (
    <div className="mx-auto max-w-[760px] px-4 py-6 sm:px-8 sm:py-8 appear">
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
          {noAccount ? <AlertTriangle size={17} className="mt-0.5 shrink-0 text-amber" /> : <Check size={17} className="mt-0.5 shrink-0 text-green" />}
          <div>
            <p className="text-sm font-medium">Where it runs</p>
            <p className="text-[13px] text-ink-2">
              {org?.deployTarget === "customer_cloud"
                ? noAccount
                  ? `${org.name}'s cloud account isn't connected yet. Connect it in Workspace settings.`
                  : `${org.name}'s ${org.cloudAccount}, in an isolated VPC`
                : "Architect cloud"}
            </p>
          </div>
        </li>
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

function LiveCanvas({
  project,
  j,
  org,
  onHandover,
  onSaveBlueprint,
}: {
  project: Project;
  j: Journey;
  org: Org | null;
  onHandover: (people: { builder: string; approver: string }) => Promise<void>;
  onSaveBlueprint: () => Promise<void>;
}) {
  const version = j.version;
  const changes = (version - 1) * CHANGE_COST;
  const actual = RECEIPT.build + RECEIPT.tests + RECEIPT.fixes + changes;
  const customer = org?.kind === "customer";
  const [builder, setBuilder] = useState("");
  const [approver, setApprover] = useState("");
  const [busy, setBusy] = useState<null | "handover" | "blueprint">(null);
  const [error, setError] = useState<string | null>(null);
  const valid = (e: string) => /^\S+@\S+\.\S+$/.test(e.trim());

  const run = async (kind: "handover" | "blueprint", fn: () => Promise<void>) => {
    setBusy(kind);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-[760px] px-4 py-6 sm:px-8 sm:py-8 appear">
      <p className="text-[13px] text-green">Live</p>
      <h2 className="mt-1 font-serif text-[32px] leading-tight">{project.name} is live</h2>
      <Link href={`/live/${project.slug}`} target="_blank" className="mt-2 inline-flex items-center gap-1.5 text-blue hover:underline">
        {liveHost(project, org)} <ExternalLink size={14} />
      </Link>
      {org?.deployTarget === "customer_cloud" && <p className="mt-1 text-[13px] text-ink-2">Running in {org.name}&apos;s {org.cloudAccount}. Its data stays in that account.</p>}

      {customer && (
        <section className="mt-8 rounded-lg border border-line bg-surface p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Handshake size={16} className="text-blue" /> Hand over to {org?.name}
          </h3>
          {j.handover ? (
            <div className="mt-3 text-sm">
              <p className="flex items-center gap-2 text-green">
                <Check size={15} /> Handed over. {j.handover.emails.join(" and ")} {j.handover.emails.length > 1 ? "are" : "is"} invited to this workspace.
              </p>
              <p className="mt-2 text-ink-2">
                They get the project as it stands: the repo, its agents and rules, the golden tests, the approval history and HANDOVER.md. Their builder makes future changes through chat; every change still runs the tests and comes to their approver.
              </p>
            </div>
          ) : (
            <>
              <p className="mt-1 text-sm text-ink-2">Invite the people who will own it. Nothing is rebuilt and nothing moves: they join this workspace, where the app already lives.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-[13px]">
                  <span className="font-medium">Their builder</span>
                  <span className="block text-ink-3">Makes future changes through chat</span>
                  <input value={builder} onChange={(e) => setBuilder(e.target.value)} type="email" placeholder="ops.lead@customer.com" className="mt-1.5 h-9 w-full rounded-md border border-line-strong px-2.5 text-sm outline-none focus:border-blue" />
                </label>
                <label className="text-[13px]">
                  <span className="font-medium">Their approver</span>
                  <span className="block text-ink-3">Signs off every new version</span>
                  <input value={approver} onChange={(e) => setApprover(e.target.value)} type="email" placeholder="risk@customer.com" className="mt-1.5 h-9 w-full rounded-md border border-line-strong px-2.5 text-sm outline-none focus:border-blue" />
                </label>
              </div>
              <ul className="mt-4 grid gap-1.5 text-[13px] text-ink-2 sm:grid-cols-2">
                {["Repo and GitAgent files", "Golden tests and their history", "Approval record, version by version", "HANDOVER.md, written from the project"].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <Check size={13} className="text-green" /> {t}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex justify-end">
                <Button variant="primary" disabled={busy !== null || !valid(builder) || !valid(approver)} onClick={() => run("handover", () => onHandover({ builder: builder.trim(), approver: approver.trim() }))}>
                  {busy === "handover" ? <Loader2 size={15} className="animate-spin" /> : null} Invite and hand over
                </Button>
              </div>
            </>
          )}
        </section>
      )}

      <section className="mt-6 flex flex-col gap-3 rounded-lg border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Layers size={16} className="text-blue" /> Save as a blueprint
          </h3>
          <p className="mt-1 text-sm text-ink-2">
            {j.blueprintSaved
              ? "Saved. Start the next customer from it: Home, then Blueprints and templates."
              : "Reuse this app for your next customer. The plan, agents and golden tests come along; files, accounts and data never do."}
          </p>
        </div>
        {!j.blueprintSaved && (
          <Button className="shrink-0" disabled={busy !== null} onClick={() => run("blueprint", onSaveBlueprint)}>
            {busy === "blueprint" ? <Loader2 size={15} className="animate-spin" /> : null} Save blueprint
          </Button>
        )}
      </section>
      {error && <p className="mt-2 text-sm text-red">{error}</p>}

      <section className="mt-6 rounded-lg border border-line bg-surface p-5">
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
    </div>
  );
}
