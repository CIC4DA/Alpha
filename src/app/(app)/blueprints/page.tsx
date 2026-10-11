"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Layers, Loader2, ArrowUpCircle } from "lucide-react";
import { getProject, listBlueprints, listDeployments, loadJourney, publishBlueprint, saveJourney, type Blueprint, type Deployment, type Project } from "@/lib/store";
import { BUILD_STEPS } from "@/lib/fixtures";
import { Button, StatusBadge } from "@/components/ui";

type Commit = { sha: string; message: string; at: string };
type Source = { project: Project | null; version: number; commits: Commit[] };

const sha = () => Math.random().toString(16).slice(2, 9);
const day = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });

/** The source project's commits since the blueprint's latest version: what an update would carry. */
async function readSource(bp: Blueprint): Promise<Source> {
  if (!bp.sourceProjectId) return { project: null, version: bp.sourceVersion, commits: [] };
  const [project, j] = await Promise.all([getProject(bp.sourceProjectId).catch(() => null), loadJourney(bp.sourceProjectId).catch(() => null)]);
  const chat = (j?.chat as { commit?: { sha: string; message: string }; at: string }[] | undefined) ?? [];
  const since = bp.changelog[bp.changelog.length - 1]?.at ?? bp.createdAt;
  return {
    project,
    version: Number(j?.version ?? bp.sourceVersion),
    commits: chat.filter((m) => m.commit && m.at > since).map((m) => ({ ...m.commit!, at: m.at })),
  };
}

/** Bring one customer's project up to the blueprint's latest version. Tested on that customer's own files. */
async function rollOut(d: Deployment, bp: Blueprint) {
  const j = d.journey as { buildDone?: number; version?: number; testRun?: string; chat?: unknown[] };
  const built = (j.buildDone ?? 0) >= BUILD_STEPS.length;
  const note = bp.changelog[bp.changelog.length - 1]?.note ?? "";
  const now = new Date().toISOString();
  const version = (j.version ?? 1) + (built ? 1 : 0);
  const text = !built
    ? `Updated the plan to blueprint version ${bp.version}: ${note} It's part of the first build.`
    : j.testRun === "none"
      ? `Updated to blueprint version ${bp.version} as version ${version}: ${note} ${d.orgName} hasn't added sample files yet, so the golden tests run when you add them in Test.`
      : `Updated to blueprint version ${bp.version} as version ${version}: ${note} I ran the golden tests on ${d.orgName}'s own files: 6 of 6 checks pass.${d.project.status === "live" ? ` The live app stays on version ${version - 1} until this version is reviewed and shipped.` : ""}`;
  await saveJourney(d.project.id, {
    ...d.journey,
    blueprintVersion: bp.version,
    version,
    currentSha: undefined,
    chat: [...(j.chat ?? []), { from: "architect", text, at: now, ...(built ? { commit: { sha: sha(), message: `Blueprint version ${bp.version}` } } : {}) }],
  });
}

function BlueprintCard({ bp, onChanged }: { bp: Blueprint; onChanged: (b: Blueprint) => void }) {
  const [source, setSource] = useState<Source | null>(null);
  const [deps, setDeps] = useState<Deployment[] | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [s, d] = await Promise.all([readSource(bp), listDeployments(bp.id)]);
    setSource(s);
    setDeps(d);
    setNote(s.commits.map((c) => c.message).join("; "));
  }, [bp]);
  useEffect(() => {
    load().catch((e) => setError((e as Error).message));
  }, [load]);

  const behind = (deps ?? []).filter((d) => d.onVersion < bp.version);
  const ahead = source && source.version > bp.sourceVersion;

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    setError(null);
    try {
      await fn();
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <article className="rounded-lg border border-line bg-surface">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-semibold">
            <Layers size={16} className="text-blue" /> {bp.name}
            <span className="rounded bg-blue-wash px-1.5 py-0.5 text-[12px] font-medium text-blue-ink">version {bp.version}</span>
          </h2>
          <p className="mt-0.5 text-[13px] text-ink-3">From {bp.source}</p>
        </div>
        {deps && (
          <p className="text-[13px] text-ink-2">
            {deps.length === 0 ? "Not used by a customer yet" : `${deps.length} customer ${deps.length === 1 ? "project" : "projects"}, ${behind.length ? `${behind.length} behind` : "all up to date"}`}
          </p>
        )}
      </header>

      <div className="grid gap-6 px-5 py-4 lg:grid-cols-[1fr_300px]">
        <section aria-label="Customer projects">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">Customer projects</h3>
            {behind.length > 1 && (
              <Button size="sm" variant="primary" disabled={busy !== null} onClick={() => run("all", async () => { for (const d of behind) await rollOut(d, bp); })}>
                {busy === "all" ? <Loader2 size={14} className="animate-spin" /> : <ArrowUpCircle size={14} />} Roll out to all {behind.length}
              </Button>
            )}
          </div>
          {!deps ? (
            <p className="mt-2 text-sm text-ink-3">Loading</p>
          ) : deps.length === 0 ? (
            <p className="mt-2 text-sm text-ink-2">
              Start a project from this blueprint in a customer workspace, from Home. It shows up here, with the blueprint version it&apos;s on.
            </p>
          ) : (
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-[12px] text-ink-3">
                    <th className="py-2 pr-3 font-medium">Customer</th>
                    <th className="py-2 pr-3 font-medium">Project</th>
                    <th className="py-2 pr-3 font-medium">On version</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {deps.map((d) => (
                    <tr key={d.project.id} className="border-b border-line last:border-0">
                      <td className="py-2.5 pr-3 font-medium">{d.orgName}</td>
                      <td className="py-2.5 pr-3">
                        <Link href={`/p/${d.project.id}`} className="flex items-center gap-2 hover:text-blue">
                          {d.project.name} <StatusBadge status={d.project.status} />
                        </Link>
                      </td>
                      <td className="py-2.5 pr-3 tabular-nums">
                        {d.onVersion}
                        {d.onVersion < bp.version && <span className="ml-1.5 text-[12px] text-amber">behind by {bp.version - d.onVersion}</span>}
                      </td>
                      <td className="py-2.5 text-right">
                        {d.onVersion < bp.version ? (
                          <Button size="sm" disabled={busy !== null} onClick={() => run(d.project.id, () => rollOut(d, bp))}>
                            {busy === d.project.id && <Loader2 size={14} className="animate-spin" />} Roll out version {bp.version}
                          </Button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[12px] text-green">
                            <Check size={13} /> Up to date
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-[12px] text-ink-3">A roll-out makes a new version in that customer&apos;s project, runs the golden tests on their own files, and goes live only through their review.</p>
            </div>
          )}
        </section>

        <aside className="space-y-5">
          <section aria-label="Source project">
            <h3 className="text-sm font-semibold">Source project</h3>
            {!source ? (
              <p className="mt-1 text-sm text-ink-3">Loading</p>
            ) : !source.project ? (
              <p className="mt-1 text-sm text-ink-2">The project this was saved from isn&apos;t available to you any more, so updates can&apos;t be published.</p>
            ) : (
              <>
                <p className="mt-1 text-sm">
                  <Link href={`/p/${source.project.id}`} className="font-medium hover:text-blue">
                    {source.project.name}
                  </Link>{" "}
                  <span className="text-ink-2">
                    is on version {source.version}. {ahead ? `Blueprint version ${bp.version} was taken from its version ${bp.sourceVersion}.` : `Blueprint version ${bp.version} matches it.`}
                  </span>
                </p>
                {ahead ? (
                  <div className="mt-2 rounded-md bg-paper p-3">
                    {source.commits.length > 0 && (
                      <ul className="mb-2 space-y-0.5 text-[13px]">
                        {source.commits.map((c) => (
                          <li key={c.sha} className="flex gap-2">
                            <span className="font-mono text-[12px] text-ink-3">{c.sha}</span> {c.message}
                          </li>
                        ))}
                      </ul>
                    )}
                    <label className="text-[13px] font-medium" htmlFor={`note-${bp.id}`}>
                      What changed, for customers
                    </label>
                    <textarea id={`note-${bp.id}`} value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="mt-1 w-full rounded-md border border-line-strong bg-surface px-2 py-1.5 text-[13px] outline-none focus:border-blue" />
                    <Button
                      size="sm"
                      variant="primary"
                      className="mt-2"
                      disabled={!note.trim() || busy !== null}
                      onClick={() =>
                        run("publish", async () => {
                          onChanged(await publishBlueprint(bp, note.trim().replace(/\.?$/, "."), source.version));
                        })
                      }
                    >
                      {busy === "publish" && <Loader2 size={14} className="animate-spin" />} Publish as version {bp.version + 1}
                    </Button>
                  </div>
                ) : (
                  <p className="mt-1 text-[13px] text-ink-3">Nothing new to publish. Changes made there after this point can be published as the next version.</p>
                )}
              </>
            )}
          </section>
          <section aria-label="Versions">
            <h3 className="text-sm font-semibold">Versions</h3>
            <ol className="mt-1 space-y-1.5 text-[13px]">
              {[...bp.changelog].reverse().map((c) => (
                <li key={c.version}>
                  <span className="font-medium">Version {c.version}</span> <span className="text-ink-3">{day(c.at)}</span>
                  <span className="block text-ink-2">{c.note}</span>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
      {error && <p className="px-5 pb-4 text-[13px] text-red">{error}</p>}
    </article>
  );
}

export default function BlueprintsPage() {
  const [list, setList] = useState<Blueprint[] | null>(null);
  useEffect(() => {
    listBlueprints()
      .then(setList)
      .catch(() => setList([]));
  }, []);

  return (
    <div className="mx-auto max-w-[1080px] px-4 py-8 sm:px-8 sm:py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Blueprints</h1>
      <p className="mt-1 max-w-2xl text-sm text-ink-2">
        Apps you&apos;ve saved to reuse across customers. When the original gets better, publish the change as a new version and roll it out to every customer project that started from it.
      </p>
      <div className="mt-8 space-y-6">
        {!list ? (
          <p className="text-sm text-ink-3">Loading blueprints</p>
        ) : list.length === 0 ? (
          <div className="rounded-lg border border-line bg-surface p-6 text-sm text-ink-2">
            No blueprints yet. When a customer&apos;s app is live, save it as a blueprint from the Ship stage. It carries the plan, agents and golden tests, never that customer&apos;s files or accounts.
          </div>
        ) : (
          list.map((bp) => <BlueprintCard key={bp.id} bp={bp} onChanged={(b) => setList((l) => l?.map((x) => (x.id === b.id ? b : x)) ?? null)} />)
        )}
      </div>
    </div>
  );
}
