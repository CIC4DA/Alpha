"use client";

import { useState } from "react";
import { Check, Mail, FileText, Users, KeyRound } from "lucide-react";
import { GOLDEN, RULE_CHECKS } from "@/lib/fixtures";
import type { Journey } from "@/lib/journey";
import { Button } from "../ui";

export function ApproverCanvas({ j, testsReady, onApprove, onChanges, approvalRequired, selfReview = false }: { j: Journey; testsReady: boolean; onApprove: () => void; onChanges: (note: string) => void; approvalRequired: boolean; selfReview?: boolean }) {
  const [note, setNote] = useState("");
  const [asking, setAsking] = useState(false);

  if (!testsReady) {
    return (
      <div className="flex h-full items-center justify-center p-10">
        <div className="max-w-sm text-center">
          <p className="font-medium">Nothing to review yet</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-2">The review appears once the build has passed its tests and the builder requests it.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[760px] px-4 py-6 sm:px-8 sm:py-8 appear">
      <p className="text-[13px] text-ink-3">{j.review === "requested" ? "Review requested by the builder" : "Approver view"}</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight">Loan Triage Desk, version {j.version}</h2>
      {!approvalRequired && (
        <p className="mt-3 rounded-md border border-line bg-surface px-3 py-2 text-[13px] text-ink-2">
          Your organisation doesn&apos;t require a separate approver, so the builder runs this as a self-check. Turn it on in Organisation settings.
        </p>
      )}

      <section className="mt-6">
        <h3 className="text-sm font-semibold">What changed</h3>
        <p className="mt-1 text-sm leading-relaxed text-ink-2">
          {j.version > 1 && <>Version {j.version} makes the change you asked for: &ldquo;{j.reviewNote}&rdquo;. </>}
          First release. Officers upload application PDFs; three agents extract the facts, recommend a decision with cited policy clauses, and draft the email. Officers confirm facts and every send.
        </p>
      </section>

      <section className="mt-6">
        <h3 className="text-sm font-semibold">Checklist, from the rules chosen in the plan</h3>
        <ul className="mt-2 divide-y divide-line rounded-lg border border-line bg-surface">
          {RULE_CHECKS.map((r) => (
            <li key={r.id} className="flex items-start gap-3 px-4 py-3">
              <Check size={17} className="mt-0.5 shrink-0 text-green" />
              <div>
                <p className="text-sm font-medium">{r.label}</p>
                <p className="text-[13px] text-ink-2">Evidence: {r.evidence}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <h3 className="text-sm font-semibold">Test results</h3>
        <table className="mt-2 w-full rounded-lg border border-line bg-surface text-sm">
          <thead className="text-left text-[13px] text-ink-3">
            <tr className="border-b border-line">
              <th className="px-4 py-2 font-medium">Case</th>
              <th className="px-4 py-2 font-medium">Outcome</th>
              <th className="px-4 py-2 font-medium">Reason</th>
            </tr>
          </thead>
          <tbody>
            {GOLDEN.map((c) => {
              const r = c.afterFix ?? c.firstRun;
              return (
                <tr key={c.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-2.5">{c.title.split(":")[0]}</td>
                  <td className="px-4 py-2.5 text-green">{r.outcome}</td>
                  <td className="px-4 py-2.5 text-green">Cites {r.cited.join(", ")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-1.5 text-[12px] text-ink-3">One case failed on reason in the first run and was fixed; the history is in the audit log.</p>
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2">
        {[
          { icon: Mail, title: "Gmail", detail: "Send-only, after an officer's confirmation" },
          { icon: FileText, title: "Files it reads", detail: "Uploaded applications; lending policy v1.0" },
          { icon: Users, title: "Who can sign in", detail: "Invited loan officers only" },
          { icon: KeyRound, title: "Secrets", detail: "3 references in the vault; none in code" },
        ].map((x) => (
          <div key={x.title} className="flex gap-3 rounded-lg border border-line bg-surface p-3">
            <x.icon size={16} className="mt-0.5 shrink-0 text-ink-2" />
            <div>
              <p className="text-sm font-medium">{x.title}</p>
              <p className="text-[13px] text-ink-2">{x.detail}</p>
            </div>
          </div>
        ))}
      </section>

      <p className="mt-6 text-sm">
        <span className="font-semibold">Running cost:</span> <span className="text-ink-2">about $0.04 per application, roughly $12 a month at 300 applications. An estimate from the test runs.</span>
      </p>

      <div className="mt-8 border-t border-line pt-6">
        {j.review === "approved" ? (
          <p className="flex items-center gap-2 text-sm font-medium text-green">
            <Check size={16} /> You approved this version. The builder can deploy it.
          </p>
        ) : asking ? (
          <div className="flex flex-col gap-2">
            <label htmlFor="changes" className="text-sm font-medium">
              What needs to change?
            </label>
            <textarea id="changes" value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="rounded-md border border-line-strong p-3 text-sm outline-none focus:border-blue" />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setAsking(false)}>
                Cancel
              </Button>
              <Button variant="primary" disabled={!note.trim()} onClick={() => onChanges(note.trim())}>
                Send to the builder
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <Button onClick={() => setAsking(true)} disabled={j.review !== "requested"}>
              Request changes
            </Button>
            <Button variant="primary" onClick={onApprove} disabled={j.review !== "requested" || selfReview}>
              Approve version {j.version}
            </Button>
          </div>
        )}
        {selfReview && j.review === "requested" && (
          <p className="mt-2 text-right text-[12px] text-ink-3">You requested this review, and this workspace requires a different person to approve it.</p>
        )}
        {j.review === "none" && approvalRequired && <p className="mt-2 text-right text-[12px] text-ink-3">The builder hasn&apos;t requested review yet.</p>}
      </div>
    </div>
  );
}
