"use client";

import Link from "next/link";
import { useCredits, CreditMeter, TopUp } from "@/components/credits";
import { money, StatusBadge } from "@/components/ui";

const PRICES = [
  { what: "Planning, questions and editing the plan", cost: "Free" },
  { what: "Ask mode in chat", cost: "Free" },
  { what: "Building a version", cost: "Shown as a range before you build" },
  { what: "Running the golden tests", cost: "A few cents per run" },
  { what: "Fixes for our mistakes", cost: "Free" },
  { what: "Changes you ask for after a review", cost: "Shown before it starts" },
  { what: "Live apps: each agent run", cost: "Per run; see Agents for each agent's cost" },
];

export default function UsagePage() {
  const c = useCredits();

  return (
    <div className="mx-auto max-w-[880px] px-4 py-8 sm:px-8 sm:py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Usage</h1>
      <p className="mt-1 text-sm text-ink-2">What this workspace has spent this month, on what, and what&apos;s left.</p>

      {!c ? (
        <p className="mt-8 text-sm text-ink-3">Loading usage</p>
      ) : (
        <>
          <section className="mt-8 grid gap-6 rounded-lg border border-line bg-surface p-5 sm:grid-cols-[1fr_260px]">
            <div>
              <p className="text-[13px] text-ink-3">Credits left this month</p>
              <p className={`text-3xl font-semibold tabular-nums ${c.balance < 3 ? "text-amber" : ""}`}>{money(c.balance)}</p>
              <div className="mt-4 max-w-md">
                <CreditMeter c={c} />
              </div>
            </div>
            <div className="sm:border-l sm:border-line sm:pl-6">
              <p className="mb-2 text-sm font-medium">Top up</p>
              <TopUp />
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-sm font-semibold">By project</h2>
            {c.byProject.length === 0 ? (
              <p className="mt-2 text-sm text-ink-2">
                Nothing spent yet. Planning is free; the first build shows its price before it starts.{" "}
                <Link href="/home" className="text-blue hover:underline">
                  Start a project
                </Link>
              </p>
            ) : (
              <div className="mt-2 overflow-x-auto rounded-lg border border-line bg-surface">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-[13px] text-ink-3">
                      <th className="px-4 py-2.5 font-medium">Project</th>
                      <th className="px-4 py-2.5 text-right font-medium">Build</th>
                      <th className="px-4 py-2.5 text-right font-medium">Tests</th>
                      <th className="px-4 py-2.5 text-right font-medium">Changes</th>
                      <th className="px-4 py-2.5 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums">
                    {c.byProject.map((p) => (
                      <tr key={p.id} className="border-b border-line last:border-0">
                        <td className="px-4 py-3">
                          <Link href={`/p/${p.id}`} className="flex items-center gap-2 font-medium hover:text-blue">
                            {p.name} <StatusBadge status={p.status} />
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-right">{money(p.build)}</td>
                        <td className="px-4 py-3 text-right">{money(p.tests)}</td>
                        <td className="px-4 py-3 text-right">{p.changes ? money(p.changes) : "–"}</td>
                        <td className="px-4 py-3 text-right font-semibold">{money(p.spend)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {c.topups.length > 0 && (
            <section className="mt-8">
              <h2 className="text-sm font-semibold">Top-ups this month</h2>
              <ul className="mt-2 divide-y divide-line rounded-lg border border-line bg-surface text-sm">
                {[...c.topups].reverse().map((t) => (
                  <li key={t.at} className="flex justify-between px-4 py-2.5">
                    <span className="text-ink-2">{new Date(t.at).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                    <span className="tabular-nums">+{money(t.amount)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-8">
            <h2 className="text-sm font-semibold">What costs credits</h2>
            <dl className="mt-2 divide-y divide-line rounded-lg border border-line bg-surface text-sm">
              {PRICES.map((p) => (
                <div key={p.what} className="flex justify-between gap-4 px-4 py-2.5">
                  <dt className="text-ink-2">{p.what}</dt>
                  <dd className={p.cost === "Free" ? "font-medium text-green" : "text-right"}>{p.cost}</dd>
                </div>
              ))}
            </dl>
          </section>
        </>
      )}
    </div>
  );
}
