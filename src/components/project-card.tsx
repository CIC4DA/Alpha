import Link from "next/link";
import type { Project } from "@/lib/store";
import { StatusBadge, relativeTime, money } from "./ui";

const STAGE_LABEL: Record<Project["stage"], string> = {
  plan: "Planning",
  connect: "Connecting data",
  build: "Building",
  test: "Testing",
  ship: "Ready to ship",
  live: "Live",
};

export function ProjectCard({ p }: { p: Project }) {
  return (
    <Link href={`/p/${p.id}`} className="group flex flex-col rounded-lg border border-line bg-surface p-4 hover:border-ink-3">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold leading-snug group-hover:text-blue-ink">{p.name}</h3>
        <StatusBadge status={p.status} />
      </div>
      <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-ink-2">{p.description || "No description yet."}</p>
      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3 text-[12px]">
        <div>
          <dt className="text-ink-3">Stage</dt>
          <dd className="mt-0.5 font-medium">{STAGE_LABEL[p.stage]}</dd>
        </div>
        <div>
          <dt className="text-ink-3">Tests</dt>
          <dd className={`mt-0.5 font-medium ${p.testsTotal === 0 ? "text-ink-3" : p.testsPassed === p.testsTotal ? "text-green" : "text-amber"}`}>
            {p.testsTotal === 0 ? "Not run" : `${p.testsPassed} of ${p.testsTotal} pass`}
          </dd>
        </div>
        <div>
          <dt className="text-ink-3">Spent</dt>
          <dd className="mt-0.5 font-medium">{money(p.spendUsd)}</dd>
        </div>
      </dl>
      <p className="mt-3 text-[12px] text-ink-3">Edited {relativeTime(p.updatedAt)}</p>
    </Link>
  );
}
