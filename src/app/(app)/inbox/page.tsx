"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, FlaskConical, Plug } from "lucide-react";
import { listProjects, type Project } from "@/lib/store";
import { relativeTime } from "@/components/ui";

type Item = { id: string; href: string; title: string; detail: string; when: string; icon: typeof ShieldCheck };

function itemsFor(projects: Project[]): Item[] {
  const out: Item[] = [];
  for (const p of projects) {
    if (p.status === "in_review")
      out.push({ id: `${p.id}-review`, href: `/p/${p.id}?view=approver`, title: `Review ${p.name}`, detail: "A version is waiting for approval before it can go live.", when: p.updatedAt, icon: ShieldCheck });
    if (p.testsTotal > 0 && p.testsPassed < p.testsTotal)
      out.push({ id: `${p.id}-tests`, href: `/p/${p.id}`, title: `${p.name}: ${p.testsTotal - p.testsPassed} test failing`, detail: "Fix it before the version can ship.", when: p.updatedAt, icon: FlaskConical });
    if (p.stage === "connect")
      out.push({ id: `${p.id}-connect`, href: `/p/${p.id}`, title: `Connect files and accounts for ${p.name}`, detail: "The build starts once its files and accounts are connected.", when: p.updatedAt, icon: Plug });
  }
  return out;
}

export default function InboxPage() {
  const [items, setItems] = useState<Item[] | null>(null);
  useEffect(() => {
    listProjects().then((p) => setItems(itemsFor(p))).catch(() => setItems([]));
  }, []);

  return (
    <div className="mx-auto max-w-[760px] px-4 py-8 sm:px-8 sm:py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Inbox</h1>
      <p className="mt-1 text-sm text-ink-2">Everything waiting on you, across all projects: reviews, failing tests, unfinished setup.</p>
      {items === null ? (
        <p className="mt-8 text-sm text-ink-3">Loading</p>
      ) : items.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-line-strong p-8 text-center">
          <p className="font-medium">Nothing needs you right now</p>
          <p className="mt-1 text-sm text-ink-2">Review requests, failing tests and unfinished setup appear here.</p>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-line rounded-lg border border-line bg-surface">
          {items.map((it) => (
            <li key={it.id}>
              <Link href={it.href} className="flex items-start gap-3 px-4 py-4 hover:bg-paper">
                <it.icon size={18} className="mt-0.5 shrink-0 text-blue" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{it.title}</p>
                  <p className="mt-0.5 text-sm text-ink-2">{it.detail}</p>
                </div>
                <span className="shrink-0 text-[12px] text-ink-3">{relativeTime(it.when)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
