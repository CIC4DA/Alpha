"use client";

import { useState } from "react";
import { Check, X, Loader2, FlaskConical, Wrench } from "lucide-react";
import { GOLDEN, RULE_CHECKS } from "@/lib/fixtures";
import { Button } from "../ui";

type Run = "none" | "first" | "fixed";

export function testCounts(run: Run) {
  if (run === "none") return { passed: 0, total: 0 };
  const total = GOLDEN.length + RULE_CHECKS.length;
  return { passed: run === "fixed" ? total : total - 1, total };
}

export function TestCanvas({ run, fixAttempts, onRun, onFix, onShip, onTrace }: { run: Run; fixAttempts: number; onRun: () => void; onFix: () => void; onShip: () => void; onTrace: () => void }) {
  const [busy, setBusy] = useState<null | "run" | "fix">(null);
  const { passed, total } = testCounts(run);

  const go = (kind: "run" | "fix", fn: () => void) => {
    setBusy(kind);
    setTimeout(() => {
      fn();
      setBusy(null);
    }, kind === "run" ? 2200 : 2600);
  };

  return (
    <div className="mx-auto max-w-[760px] px-4 py-6 sm:px-8 sm:py-8 appear">
      <p className="text-[13px] text-ink-3">The gate before Ship</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight">Test it on your own files</h2>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
        Each case checks the outcome <em>and</em> the reason: the right answer for the wrong reason fails. Your sample applications became these cases; your rules became the checks below them.
      </p>

      <div className="mt-6 flex items-center gap-3">
        {run === "none" ? (
          <Button variant="primary" onClick={() => go("run", onRun)} disabled={busy !== null}>
            {busy === "run" ? <Loader2 size={15} className="animate-spin" /> : <FlaskConical size={15} />} {busy === "run" ? "Running 6 checks" : "Run the tests"}
          </Button>
        ) : (
          <p className={`text-sm font-semibold ${passed === total ? "text-green" : "text-amber"}`}>
            {passed} of {total} pass{passed === total ? ". Ready to ship." : ""}
          </p>
        )}
        {run !== "none" && (
          <button onClick={onTrace} className="text-[13px] text-blue hover:underline">
            See what each agent received and returned
          </button>
        )}
      </div>

      {run !== "none" && (
        <>
          <h3 className="mt-8 text-sm font-semibold">Golden cases</h3>
          <ul className="mt-2 divide-y divide-line rounded-lg border border-line bg-surface">
            {GOLDEN.map((c) => {
              const r = run === "fixed" && c.afterFix ? c.afterFix : c.firstRun;
              const outcomeOk = r.outcome === c.expectOutcome;
              const reasonOk = c.expectCite.every((x) => r.cited.includes(x));
              return (
                <li key={c.id} className="px-4 py-4 appear">
                  <div className="flex items-start gap-3">
                    {r.pass ? <Check size={17} className="mt-0.5 shrink-0 text-green" /> : <X size={17} className="mt-0.5 shrink-0 text-red" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{c.title}</p>
                      <p className="text-[12px] text-ink-3">{c.file}</p>
                      <dl className="mt-2 grid grid-cols-2 gap-3 text-[13px]">
                        <div>
                          <dt className="text-ink-3">Outcome</dt>
                          <dd className={outcomeOk ? "" : "text-red"}>
                            {r.outcome} <span className="text-ink-3">(expected {c.expectOutcome})</span>
                          </dd>
                        </div>
                        <div>
                          <dt className="text-ink-3">Reason</dt>
                          <dd className={reasonOk ? "" : "text-red"}>
                            Cited {r.cited.join(", ")} <span className="text-ink-3">(expected {c.expectCite.join(", ")})</span>
                          </dd>
                        </div>
                      </dl>
                      <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{r.note}</p>
                      {!r.pass && (
                        <div className="mt-3 flex items-center gap-3">
                          <Button size="sm" variant="primary" onClick={() => go("fix", onFix)} disabled={busy !== null}>
                            {busy === "fix" ? <Loader2 size={14} className="animate-spin" /> : <Wrench size={14} />} {busy === "fix" ? "Fixing and re-running" : "Fix it"}
                          </Button>
                          <span className="text-[12px] text-ink-3">Free: the mistake is ours. Attempt {fixAttempts + 1} of 3.</span>
                          <button onClick={onTrace} className="text-[13px] text-blue hover:underline">
                            Or debug it yourself
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <h3 className="mt-8 text-sm font-semibold">Your rules</h3>
          <ul className="mt-2 divide-y divide-line rounded-lg border border-line bg-surface">
            {RULE_CHECKS.map((r) => (
              <li key={r.id} className="flex items-start gap-3 px-4 py-3">
                <Check size={17} className="mt-0.5 shrink-0 text-green" />
                <div>
                  <p className="text-sm font-medium">{r.label}</p>
                  <p className="text-[13px] text-ink-2">{r.evidence}</p>
                </div>
              </li>
            ))}
          </ul>

          {passed === total && (
            <div className="mt-8 flex justify-end border-t border-line pt-6">
              <Button variant="primary" onClick={onShip}>
                Continue to Ship
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
