"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Download, FileCode2, FilePlus2, Folder, KeyRound, Loader2, Lock, Pencil, Play, Plus, RotateCcw, Trash2, X, Bug, ArrowRight, ChevronRight } from "lucide-react";
import type { Journey } from "@/lib/journey";
import { ENV_NAMES, commits, envs as envsOf, goldenResults, originalFile, policyRules, projectFiles, type ApiKey, type EnvName, type EnvVar } from "@/lib/devkit";
import { BUILD_STEPS, GOLDEN } from "@/lib/fixtures";
import { Button } from "../ui";

/** What the Developer view's tools can read and change. Every change is saved to the project. */
export type DevCtx = {
  j: Journey;
  projectId: string;
  projectName: string;
  extraFiles: { path: string; body: string }[];
  approvalRequired: boolean;
  saveFile: (path: string, body: string, message: string) => void;
  setEnvs: (envs: Record<EnvName, EnvVar[]>, note?: string) => void;
  applyDebugFix: (rules: string[]) => void;
  setApiKeys: (keys: ApiKey[], note?: string) => void;
};

// ---------- Diff ----------

type DiffLine = { kind: " " | "+" | "-"; text: string };
export function diffLines(a: string, b: string): DiffLine[] {
  const x = a.replace(/\n$/, "").split("\n");
  const y = b.replace(/\n$/, "").split("\n");
  const n = x.length;
  const m = y.length;
  const L: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let k = m - 1; k >= 0; k--) L[i][k] = x[i] === y[k] ? L[i + 1][k + 1] + 1 : Math.max(L[i + 1][k], L[i][k + 1]);
  const out: DiffLine[] = [];
  let i = 0;
  let k = 0;
  while (i < n && k < m) {
    if (x[i] === y[k]) {
      out.push({ kind: " ", text: x[i] });
      i++;
      k++;
    } else if (L[i + 1][k] >= L[i][k + 1]) out.push({ kind: "-", text: x[i++] });
    else out.push({ kind: "+", text: y[k++] });
  }
  while (i < n) out.push({ kind: "-", text: x[i++] });
  while (k < m) out.push({ kind: "+", text: y[k++] });
  return out;
}

function DiffView({ lines, wrap = false }: { lines: DiffLine[]; wrap?: boolean }) {
  return (
    <pre className={`min-h-0 flex-1 overflow-auto bg-[#fbfcfd] p-4 font-mono text-[12.5px] leading-[1.7] ${wrap ? "rounded-md border border-line" : ""}`}>
      {lines.map((l, i) => (
        <div key={i} className={l.kind === "+" ? "bg-green-wash text-green" : l.kind === "-" ? "bg-red-wash text-red" : "text-ink"}>
          <span className="inline-block w-5 select-none text-center">{l.kind}</span>
          <span className={wrap ? "whitespace-pre-wrap break-words" : "whitespace-pre"}>{l.text || " "}</span>
        </div>
      ))}
    </pre>
  );
}

// ---------- Files: browse and edit ----------

export function FileEditor({ ctx, initial }: { ctx: DevCtx; initial?: string }) {
  const [pending, setPending] = useState<string | null>(null); // a new file, until it's saved
  const saved = projectFiles(ctx.j, ctx.extraFiles);
  const files = pending && !saved.some((f) => f.path === pending) ? [...saved, { path: pending, body: "", edited: true, added: true }] : saved;
  const [path, setPath] = useState(initial ?? files[0].path);
  const [draft, setDraft] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newPath, setNewPath] = useState("");
  const file = files.find((f) => f.path === path) ?? files[0];
  const readOnly = ctx.extraFiles.some((f) => f.path === file.path);
  const editing = draft !== null;
  const base = originalFile(file.path) ?? "";
  const current = draft ?? file.body;
  const isPending = pending === file.path && !saved.some((f) => f.path === file.path);
  const changed = editing && (draft !== file.body || isPending);
  const commit = () => {
    ctx.saveFile(file.path, draft!, isPending ? `Add ${file.path}` : `Edit ${file.path}`);
    setPending(null);
    setDraft(null);
    setShowDiff(false);
  };
  const lines = file.body.replace(/\n$/, "").split("\n");

  const open = (p: string) => {
    if (editing && changed && !confirmLeave()) return;
    if (pending && p !== pending) setPending(null);
    setPath(p);
    setDraft(null);
    setShowDiff(false);
  };
  const confirmLeave = () => window.confirm("Discard your unsaved changes to this file?");

  return (
    <div className="grid h-full grid-cols-[260px_1fr]">
      <nav className="flex min-h-0 flex-col border-r border-line bg-surface text-[13px]" aria-label="Files">
        <div className="flex items-center justify-between px-3 pb-1 pt-2">
          <p className="flex items-center gap-1.5 text-ink-3">
            <Folder size={13} /> {ctx.projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
          </p>
          <button onClick={() => setCreating((c) => !c)} title="New file" aria-label="New file" className="rounded p-1 text-ink-3 hover:bg-paper hover:text-ink">
            <FilePlus2 size={14} />
          </button>
        </div>
        {creating && (
          <form
            className="px-3 pb-2"
            onSubmit={(e) => {
              e.preventDefault();
              const p = newPath.trim().replace(/^\/+/, "");
              if (!p || files.some((f) => f.path === p)) return;
              setCreating(false);
              setNewPath("");
              setPending(p);
              setPath(p);
              setDraft("");
            }}
          >
            <input autoFocus value={newPath} onChange={(e) => setNewPath(e.target.value)} placeholder="app/lib/export.ts" aria-label="New file path" className="h-8 w-full rounded-md border border-line-strong px-2 font-mono text-[12px] outline-none focus:border-blue" />
          </form>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto pb-2">
          {files.map((f) => (
            <button
              key={f.path}
              onClick={() => open(f.path)}
              title={f.path}
              className={`flex w-full items-start gap-1.5 px-3 py-1.5 text-left font-mono text-[12px] ${f.path === file.path ? "bg-blue-wash text-blue-ink" : "text-ink-2 hover:bg-paper"}`}
            >
              <FileCode2 size={13} className="mt-0.5 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block truncate">{f.path.split("/").pop()}</span>
                {f.path.includes("/") && <span className="block truncate text-[11px] text-ink-3">{f.path.split("/").slice(0, -1).join("/")}</span>}
              </span>
              {f.edited && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber" title={f.added ? "New file" : "Edited"} />}
            </button>
          ))}
        </div>
      </nav>
      <div className="flex min-h-0 min-w-0 flex-col">
        <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface px-4 py-2 text-[12px]">
          <span className="min-w-0 flex-1 truncate font-mono">
            {file.path}
            {file.added && <span className="ml-2 font-sans text-amber">new</span>}
            {!file.added && file.edited && <span className="ml-2 font-sans text-amber">edited</span>}
          </span>
          {readOnly ? (
            <span className="text-ink-3">Written by Architect from the project</span>
          ) : editing ? (
            <>
              <button onClick={() => setShowDiff((d) => !d)} className="rounded-md px-2 py-1 text-ink-2 hover:bg-paper">
                {showDiff ? "Edit" : "Show changes"}
              </button>
              <button
                onClick={() => {
                  if (!changed || confirmLeave()) {
                    setDraft(null);
                    setShowDiff(false);
                    if (isPending) {
                      setPending(null);
                      setPath(saved[0].path);
                    }
                  }
                }}
                className="rounded-md px-2 py-1 text-ink-2 hover:bg-paper"
              >
                Cancel
              </button>
              <Button
                size="sm"
                variant="primary"
                disabled={!changed}
                onClick={commit}
              >
                Save as version {ctx.j.version + 1}
              </Button>
            </>
          ) : (
            <>
              {file.edited && !file.added && (
                <button onClick={() => setShowDiff((d) => !d)} className="rounded-md px-2 py-1 text-ink-2 hover:bg-paper">
                  {showDiff ? "Hide changes" : "Changes since the build"}
                </button>
              )}
              <Button size="sm" onClick={() => setDraft(file.body)}>
                <Pencil size={13} /> Edit
              </Button>
            </>
          )}
        </div>
        {showDiff ? (
          <DiffView lines={diffLines(editing ? file.body : base, current)} />
        ) : editing ? (
          <textarea
            autoFocus
            value={draft!}
            onChange={(e) => setDraft(e.target.value)}
            spellCheck={false}
            aria-label={`Edit ${file.path}`}
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                e.preventDefault();
                const t = e.currentTarget;
                const s = t.selectionStart;
                setDraft(draft!.slice(0, s) + "  " + draft!.slice(t.selectionEnd));
                requestAnimationFrame(() => t.setSelectionRange(s + 2, s + 2));
              }
              if ((e.metaKey || e.ctrlKey) && e.key === "s") {
                e.preventDefault();
                if (changed) commit();
              }
            }}
            className="min-h-0 flex-1 resize-none bg-[#fbfcfd] p-4 font-mono text-[12.5px] leading-[1.7] text-ink outline-none"
          />
        ) : (
          <pre className="min-h-0 flex-1 overflow-auto bg-[#fbfcfd] p-4 font-mono text-[12.5px] leading-[1.7]">
            {lines.map((l, i) => (
              <div key={i} className="flex">
                <span className="w-8 shrink-0 select-none pr-3 text-right text-ink-3/70">{i + 1}</span>
                <span className="whitespace-pre text-ink">{l || " "}</span>
              </div>
            ))}
          </pre>
        )}
        {editing && <p className="border-t border-line bg-surface px-4 py-1.5 text-[11px] text-ink-3">Saving makes a new version: the golden tests run on it, and it ships only through review. Ctrl+S saves.</p>}
      </div>
    </div>
  );
}

// ---------- Environments ----------

const NEXT: Record<EnvName, EnvName | null> = { preview: "staging", staging: "production", production: null };
const LABEL: Record<EnvName, string> = { preview: "Preview", staging: "Staging", production: "Production" };

export function Environments({ ctx }: { ctx: DevCtx }) {
  const all = envsOf(ctx.j);
  const [env, setEnv] = useState<EnvName>("preview");
  const [editing, setEditing] = useState<string | null>(null);
  const [val, setVal] = useState("");
  const [adding, setAdding] = useState(false);
  const [nk, setNk] = useState("");
  const [nv, setNv] = useState("");
  const [ns, setNs] = useState(false);
  const [compare, setCompare] = useState<EnvName | "">("");
  const rows = all[env];
  const save = (list: EnvVar[], note?: string) => ctx.setEnvs({ ...all, [env]: list }, note);
  const next = NEXT[env];

  const diff = compare
    ? Array.from(new Set([...rows.map((r) => r.key), ...all[compare].map((r) => r.key)])).map((key) => {
        const a = rows.find((r) => r.key === key);
        const b = all[compare].find((r) => r.key === key);
        return { key, a, b, same: Boolean(a && b && (a.secret ? b.secret : a.value === b.value)) };
      })
    : [];
  const toPromote = next ? rows.filter((r) => !r.secret && all[next].find((x) => x.key === r.key)?.value !== r.value) : [];
  const missingSecrets = next ? rows.filter((r) => r.secret && !all[next].some((x) => x.key === r.key)) : [];

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-md border border-line-strong p-0.5" role="tablist" aria-label="Environment">
            {ENV_NAMES.map((e) => (
              <button key={e} role="tab" aria-selected={env === e} onClick={() => { setEnv(e); setEditing(null); setCompare(""); }} className={`rounded px-3 py-1 text-[13px] ${env === e ? "bg-ink text-white" : "text-ink-2"}`}>
                {LABEL[e]}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-[13px] text-ink-2">
            Compare with
            <select value={compare} onChange={(e) => setCompare(e.target.value as EnvName | "")} className="h-8 rounded-md border border-line-strong bg-surface px-2 text-[13px]">
              <option value="">Nothing</option>
              {ENV_NAMES.filter((e) => e !== env).map((e) => (
                <option key={e} value={e}>
                  {LABEL[e]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="mt-3 text-sm text-ink-2">
          {env === "preview" ? "Used by the preview and the golden tests. " : env === "staging" ? "A copy of production for the customer's own checks. " : "What the live app runs with. Changes here apply with the next approved deploy. "}
          Secrets are references to the vault: their values never enter the sandbox or the code.
        </p>

        {compare ? (
          <table className="mt-4 w-full rounded-lg border border-line bg-surface text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[12px] text-ink-3">
                <th className="px-4 py-2 font-medium">Variable</th>
                <th className="px-4 py-2 font-medium">{LABEL[env]}</th>
                <th className="px-4 py-2 font-medium">{LABEL[compare]}</th>
              </tr>
            </thead>
            <tbody>
              {diff.map((d) => (
                <tr key={d.key} className={`border-b border-line last:border-0 ${d.same ? "" : "bg-amber-wash/60"}`}>
                  <td className="px-4 py-2 font-mono text-[12px]">{d.key}</td>
                  <td className="px-4 py-2 text-[13px] text-ink-2">{d.a ? (d.a.secret ? "Secret reference" : d.a.value) : <span className="text-red">Missing</span>}</td>
                  <td className="px-4 py-2 text-[13px] text-ink-2">{d.b ? (d.b.secret ? "Secret reference" : d.b.value) : <span className="text-red">Missing</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="mt-4 w-full rounded-lg border border-line bg-surface text-sm">
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-b border-line last:border-0">
                  <td className="w-[38%] px-4 py-2.5 font-mono text-[12px]">
                    <span className="flex items-center gap-1.5">
                      {r.secret && <KeyRound size={12} className="text-amber" />}
                      {r.key}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-ink-2">
                    {editing === r.key ? (
                      <form
                        className="flex gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          save(rows.map((x) => (x.key === r.key ? { ...x, value: val } : x)));
                          setEditing(null);
                        }}
                      >
                        <input autoFocus value={val} onChange={(e) => setVal(e.target.value)} aria-label={`Value of ${r.key}`} className="h-8 min-w-0 flex-1 rounded-md border border-line-strong px-2 text-[13px] outline-none focus:border-blue" />
                        <Button size="sm" type="submit">Save</Button>
                      </form>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        {r.secret && <Lock size={12} className="shrink-0 text-ink-3" />}
                        {r.secret ? "Reference set in the vault" : r.value}
                      </span>
                    )}
                  </td>
                  <td className="w-20 px-2 text-right">
                    {editing !== r.key && (
                      <span className="flex justify-end gap-1">
                        <button aria-label={`Edit ${r.key}`} onClick={() => { setEditing(r.key); setVal(r.secret ? "" : r.value); }} className="rounded p-1 text-ink-3 hover:text-ink">
                          <Pencil size={13} />
                        </button>
                        <button aria-label={`Remove ${r.key}`} onClick={() => save(rows.filter((x) => x.key !== r.key))} className="rounded p-1 text-ink-3 hover:text-red">
                          <Trash2 size={13} />
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!compare &&
          (adding ? (
            <form
              className="mt-3 grid gap-2 rounded-lg border border-line bg-surface p-3 sm:grid-cols-[1fr_1.4fr_auto_auto]"
              onSubmit={(e) => {
                e.preventDefault();
                const key = nk.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_");
                if (!key || rows.some((r) => r.key === key)) return;
                save([...rows, { key, value: nv, secret: ns }]);
                setNk("");
                setNv("");
                setNs(false);
                setAdding(false);
              }}
            >
              <input value={nk} onChange={(e) => setNk(e.target.value)} placeholder="CREDIT_BUREAU_URL" aria-label="Variable name" className="h-9 rounded-md border border-line-strong px-2.5 font-mono text-[12px] outline-none focus:border-blue" />
              <input value={nv} onChange={(e) => setNv(e.target.value)} placeholder={ns ? "Stored in the vault, never shown again" : "Value"} aria-label="Variable value" className="h-9 rounded-md border border-line-strong px-2.5 text-sm outline-none focus:border-blue" />
              <label className="flex items-center gap-1.5 text-[13px]">
                <input type="checkbox" checked={ns} onChange={(e) => setNs(e.target.checked)} /> Secret
              </label>
              <Button size="sm" variant="primary" type="submit">
                Add
              </Button>
            </form>
          ) : (
            <button onClick={() => setAdding(true)} className="mt-3 flex items-center gap-1.5 text-[13px] font-medium text-blue hover:underline">
              <Plus size={14} /> Add a variable to {LABEL[env]}
            </button>
          ))}

        {next && !compare && (
          <section className="mt-6 rounded-lg border border-line bg-surface p-4">
            <h3 className="text-sm font-semibold">Promote to {LABEL[next]}</h3>
            {toPromote.length === 0 && missingSecrets.length === 0 ? (
              <p className="mt-1 text-[13px] text-ink-2">{LABEL[next]} already has these settings.</p>
            ) : (
              <>
                <ul className="mt-1.5 space-y-0.5 text-[13px]">
                  {toPromote.map((r) => (
                    <li key={r.key} className="flex gap-2">
                      <span className="font-mono text-[12px]">{r.key}</span>
                      <ArrowRight size={13} className="mt-0.5 text-ink-3" /> <span className="text-ink-2">{r.value}</span>
                    </li>
                  ))}
                  {missingSecrets.map((r) => (
                    <li key={r.key} className="text-amber">
                      <span className="font-mono text-[12px]">{r.key}</span> is a secret: set its own value in {LABEL[next]}.
                    </li>
                  ))}
                </ul>
                {toPromote.length > 0 && (
                  <Button
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      const target = [...all[next]];
                      for (const r of toPromote) {
                        const at = target.findIndex((x) => x.key === r.key);
                        if (at >= 0) target[at] = { ...r };
                        else target.push({ ...r });
                      }
                      ctx.setEnvs({ ...all, [next]: target }, `Promoted ${toPromote.length} setting${toPromote.length === 1 ? "" : "s"} from ${LABEL[env]} to ${LABEL[next]}: ${toPromote.map((r) => r.key).join(", ")}.${next === "production" ? " They apply with the next approved deploy." : ""}`);
                    }}
                  >
                    Promote {toPromote.length} to {LABEL[next]}
                  </Button>
                )}
                <p className="mt-2 text-[12px] text-ink-3">Secrets are never copied between environments; each has its own.</p>
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

// ---------- Terminal ----------

const HELP = `Commands
  ls [dir]                 list files
  cat <file>               print a file
  git log | git status     history of versions
  architect test [case]    run the golden tests (hartley, cole, brightwell)
  architect env [name]     settings for preview, staging or production
  architect logs           build output
  architect deploy         ship the current version
  npm run build            build the app
  whoami | clear | help`;

export function Terminal({ ctx }: { ctx: DevCtx }) {
  const [lines, setLines] = useState<{ kind: "in" | "out" | "err"; text: string }[]>([
    { kind: "out", text: `Sandbox terminal for ${ctx.projectName}. Type help for commands.` },
  ]);
  const [input, setInput] = useState("");
  const [hist, setHist] = useState<string[]>([]);
  const [hi, setHi] = useState(-1);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [lines]);

  const files = projectFiles(ctx.j, ctx.extraFiles);
  const built = ctx.j.buildDone >= BUILD_STEPS.length;

  const run = (cmd: string): { kind: "out" | "err"; text: string } | null => {
    const [c, ...args] = cmd.trim().split(/\s+/);
    const a = args.join(" ");
    if (!c) return null;
    if (c === "help") return { kind: "out", text: HELP };
    if (c === "clear") {
      setLines([]);
      return null;
    }
    if (c === "whoami") return { kind: "out", text: "developer (this project's sandbox; no production access)" };
    if (c === "ls") {
      const dir = a.replace(/\/$/, "");
      const list = files.filter((f) => !dir || f.path.startsWith(dir + "/")).map((f) => f.path + (f.edited ? "  (edited)" : ""));
      return list.length ? { kind: "out", text: list.join("\n") } : { kind: "err", text: `ls: ${a}: no such directory` };
    }
    if (c === "cat") {
      const f = files.find((x) => x.path === a);
      return f ? { kind: "out", text: f.body.replace(/\n$/, "") || "(empty file)" } : { kind: "err", text: `cat: ${a || "missing file name"}: no such file` };
    }
    if (c === "git") {
      if (args[0] === "status") return { kind: "out", text: "On branch main\nnothing to commit: every saved change is already a version" };
      if (args[0] === "log") {
        const list = commits(ctx.j);
        return { kind: "out", text: list.length ? list.map((x) => `${x.sha}  ${x.message}`).join("\n") : "No versions yet: the first build makes one." };
      }
      return { kind: "err", text: "git: try git log or git status" };
    }
    if (c === "npm" && args.join(" ") === "run build") {
      if (!built) return { kind: "err", text: "Nothing to build yet: the first build is still running." };
      return { kind: "out", text: "> next build\n  Compiled successfully\n  4 routes, 3 agents\n  Type check passed" };
    }
    if (c === "architect") {
      const sub = args[0];
      if (sub === "test") {
        const r = goldenResults(ctx.j);
        if (!built) return { kind: "err", text: "No build to test yet." };
        if (!r) return { kind: "out", text: "No sample files yet. Add them in the Test stage, then run architect test." };
        const pick = args[1] ? r.cases.filter((x) => x.id.startsWith(args[1].toLowerCase())) : r.cases;
        if (!pick.length) return { kind: "err", text: `No case called ${args[1]}. Cases: ${GOLDEN.map((g) => g.id).join(", ")}` };
        return {
          kind: pick.every((x) => x.pass) ? "out" : "err",
          text: [...pick.map((x) => `${x.pass ? "PASS" : "FAIL"}  ${x.title}\n      ${x.outcome}, cites ${x.cited.join(", ")}${x.pass ? "" : `\n      ${x.note}`}`), "", args[1] ? "" : `${r.passed} of ${r.total} checks pass`].join("\n").trim(),
        };
      }
      if (sub === "env") {
        const name = (args[1] ?? "preview") as EnvName;
        if (!ENV_NAMES.includes(name)) return { kind: "err", text: "architect env: use preview, staging or production" };
        return { kind: "out", text: envsOf(ctx.j)[name].map((v) => `${v.key}=${v.secret ? "<secret reference>" : v.value}`).join("\n") };
      }
      if (sub === "logs") return { kind: "out", text: BUILD_STEPS.slice(0, ctx.j.buildDone).map((s) => s.dev).join("\n") || "No build has run yet." };
      if (sub === "deploy") {
        if (ctx.approvalRequired && ctx.j.review !== "approved") return { kind: "err", text: `Blocked: version ${ctx.j.version} needs this workspace's approver. Request review from the Ship stage.` };
        const r = goldenResults(ctx.j);
        if (!r || r.passed < r.total) return { kind: "err", text: "Blocked: the golden tests must pass first. Run architect test." };
        return { kind: "out", text: "Deploys go through the Ship stage, where the receipt and the approval are recorded. Open Ship to deploy." };
      }
      return { kind: "err", text: "architect: try architect test, env, logs or deploy" };
    }
    return { kind: "err", text: `${c}: command not found. Type help for what this sandbox can run.` };
  };

  return (
    <div className="flex h-full flex-col bg-ink font-mono text-[12.5px] leading-[1.65] text-[#d6dbe4]" onClick={() => document.getElementById("term-input")?.focus()}>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {lines.map((l, i) => (
          <pre key={i} className={`whitespace-pre-wrap break-words ${l.kind === "in" ? "text-white" : l.kind === "err" ? "text-[#ff9b9b]" : ""}`}>
            {l.kind === "in" ? `$ ${l.text}` : l.text}
          </pre>
        ))}
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const cmd = input;
            setInput("");
            setHi(-1);
            if (cmd.trim()) setHist((h) => [...h, cmd]);
            const out = run(cmd);
            if (cmd.trim().split(/\s+/)[0] === "clear") return;
            setLines((ls) => [...ls, { kind: "in", text: cmd }, ...(out ? [out] : [])]);
          }}
        >
          <span className="text-white">$</span>
          <input
            id="term-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowUp" && hist.length) {
                e.preventDefault();
                const n = hi < 0 ? hist.length - 1 : Math.max(0, hi - 1);
                setHi(n);
                setInput(hist[n]);
              }
              if (e.key === "ArrowDown" && hi >= 0) {
                e.preventDefault();
                const n = hi + 1;
                if (n >= hist.length) {
                  setHi(-1);
                  setInput("");
                } else {
                  setHi(n);
                  setInput(hist[n]);
                }
              }
            }}
            autoComplete="off"
            spellCheck={false}
            aria-label="Terminal command"
            className="min-w-0 flex-1 bg-transparent text-white outline-none focus-visible:outline-none"
          />
        </form>
        <div ref={end} />
      </div>
      <p className="border-t border-white/10 px-4 py-1.5 font-sans text-[11px] text-[#9aa3b2]">Runs in this project&apos;s sandbox. In the prototype the commands are simulated against the project&apos;s real files, versions and settings.</p>
    </div>
  );
}

// ---------- Debug a failed run ----------

type Step = { agent: string; received: string; returned: string; ok: boolean; note?: string };

function stepsFor(caseId: string, fixed: boolean): Step[] {
  const c = GOLDEN.find((g) => g.id === caseId)!;
  const r = fixed && c.afterFix ? c.afterFix : c.firstRun;
  const facts: Record<string, string> = {
    hartley: `{ applicant: "Hartley Joinery Ltd", amount_gbp: 30000,\n  income_gbp: 95000, purpose: "CNC router and dust extraction",\n  trading_years: 6 }`,
    cole: `{ applicant: "Cole Ventures", amount_gbp: 40000,\n  income_gbp: 120000, purpose: "Cryptocurrency investment",\n  trading_years: 2 }`,
    brightwell: `{ applicant: "Samira Okoye (Brightwell Bakery)", amount_gbp: 65000,\n  income_gbp: null,\n  income_conflict: [ { value: 180000, source: "Section C" },\n                     { value: 140000, source: "Section D, accountant" } ],\n  purpose: "Refurbish premises and buy a second deck oven" }`,
  };
  return [
    { agent: "Extraction agent", received: c.file, returned: facts[caseId], ok: true },
    { agent: "Officer (simulated in tests)", received: "Review screen", returned: caseId === "brightwell" ? "Passed the facts on unchanged, so the conflict reaches the Policy agent" : "Confirmed the extracted facts", ok: true },
    {
      agent: "Policy agent",
      received: "Confirmed facts + kestrel-lending-policy@v1.0 + RULES.md",
      returned: `{ recommendation: "${r.outcome.toLowerCase().replace(" ", "_")}",\n  cited: [${r.cited.map((x) => `"${x}"`).join(", ")}],\n  reason: "${r.pass ? r.note : "Trading history in Section B is unclear, so the application is referred under 2.1."}" }`,
      ok: r.pass,
      note: r.pass ? undefined : `Expected clause ${c.expectCite.join(", ")}. The outcome is right, but the reason isn't.`,
    },
  ];
}

export function Debugger({ ctx }: { ctx: DevCtx }) {
  const results = goldenResults(ctx.j);
  const failing = results?.cases.find((c) => !c.pass);
  const [caseId, setCaseId] = useState(failing?.id ?? "brightwell");
  const [stepIx, setStepIx] = useState(2);
  const startRules = useMemo(() => {
    const r = policyRules(ctx.j);
    // The failing build ran before the 5.2 rule existed.
    return ctx.j.testRun === "first" ? r.filter((x) => !x.includes("5.2")) : r;
  }, [ctx.j]);
  const [rules, setRules] = useState(startRules.join("\n"));
  const [rerun, setRerun] = useState<"idle" | "running" | "pass" | "fail">("idle");

  if (!results)
    return <p className="p-6 text-sm text-ink-2">No runs yet. Run the golden tests in the Test stage; each run&apos;s trace shows up here, step by step.</p>;

  const fixed = ctx.j.testRun === "fixed";
  const steps = stepsFor(caseId, fixed);
  const step = steps[stepIx];
  const caseResult = results.cases.find((c) => c.id === caseId)!;
  const ruleList = rules.split("\n").map((r) => r.replace(/^-\s*/, "").trim()).filter(Boolean);
  const fixes = ruleList.some((r) => /5\.2|conflict|two (different )?(income )?figures/i.test(r));
  const after = `{ recommendation: "manual_review",\n  cited: ["5.2"],\n  reason: "Two income figures: £180,000 in Section C and £140,000 in Section D. The officer must verify income before a decision." }`;

  return (
    <div className="grid h-full grid-cols-[230px_1fr]">
      <nav className="overflow-y-auto border-r border-line bg-surface p-2 text-[13px]" aria-label="Runs">
        <p className="px-2 pb-2 pt-1 text-[12px] text-ink-3">Latest golden run, {results.passed} of {results.total} checks</p>
        {results.cases.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setCaseId(c.id);
              setStepIx(2);
              setRerun("idle");
            }}
            aria-current={caseId === c.id}
            className={`flex w-full items-start gap-2 rounded-md px-2 py-2 text-left ${caseId === c.id ? "bg-blue-wash text-blue-ink" : "hover:bg-paper"}`}
          >
            {c.pass ? <Check size={14} className="mt-0.5 shrink-0 text-green" /> : <X size={14} className="mt-0.5 shrink-0 text-red" />}
            <span className="min-w-0">
              <span className="block font-medium">{c.title.split(":")[0]}</span>
              <span className="block text-[12px] text-ink-3">
                {c.outcome}, cites {c.cited.join(", ")}
              </span>
            </span>
          </button>
        ))}
      </nav>
      <div className="min-w-0 overflow-y-auto p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Bug size={16} className={caseResult.pass ? "text-ink-3" : "text-red"} />
          <h3 className="font-semibold">{caseResult.title}</h3>
          <span className={`text-[13px] ${caseResult.pass ? "text-green" : "text-red"}`}>{caseResult.pass ? "Passed" : "Failed on the reason"}</span>
        </div>

        <ol className="mt-4 flex flex-wrap items-center gap-1 text-[13px]" aria-label="Steps">
          {steps.map((s, i) => (
            <li key={s.agent} className="flex items-center gap-1">
              {i > 0 && <ChevronRight size={14} className="text-ink-3" />}
              <button onClick={() => setStepIx(i)} aria-current={stepIx === i} className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 ${stepIx === i ? "border-blue bg-blue-wash text-blue-ink" : "border-line-strong hover:border-ink-3"}`}>
                {s.ok ? <Check size={13} className="text-green" /> : <X size={13} className="text-red" />} {s.agent}
              </button>
            </li>
          ))}
        </ol>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <section>
            <h4 className="text-[12px] text-ink-3">Received</h4>
            <pre className="mt-1 whitespace-pre-wrap break-words rounded-md border border-line bg-surface p-3 font-mono text-[12px] leading-relaxed">{stepIx === 2 ? `${steps[0].returned}\n\n+ policy kestrel-lending-policy@v1.0 (26 clauses)\n+ RULES.md (${startRules.length} rules)` : step.received}</pre>
          </section>
          <section>
            <h4 className="text-[12px] text-ink-3">Returned</h4>
            <pre className={`mt-1 whitespace-pre-wrap break-words rounded-md border p-3 font-mono text-[12px] leading-relaxed ${step.ok ? "border-line bg-surface" : "border-red/40 bg-red-wash"}`}>{step.returned}</pre>
            {step.note && <p className="mt-1.5 text-[13px] text-red">{step.note}</p>}
          </section>
        </div>

        {stepIx === 2 && !caseResult.pass && (
          <section className="mt-6 rounded-lg border border-line bg-surface p-4">
            <h4 className="text-sm font-semibold">Change the Policy agent&apos;s rules and re-run this case</h4>
            <p className="mt-0.5 text-[13px] text-ink-2">One rule per line. This edits agents/policy-agent/RULES.md; nothing is saved until you apply it.</p>
            <textarea value={rules} onChange={(e) => { setRules(e.target.value); setRerun("idle"); }} rows={Math.max(5, ruleList.length + 1)} spellCheck={false} aria-label="Policy agent rules" className="mt-2 w-full rounded-md border border-line-strong bg-[#fbfcfd] p-2.5 font-mono text-[12px] leading-relaxed outline-none focus:border-blue" />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                disabled={rerun === "running"}
                onClick={() => {
                  setRerun("running");
                  setTimeout(() => setRerun(fixes ? "pass" : "fail"), 1500);
                }}
              >
                {rerun === "running" ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} Re-run this case
              </Button>
              <button onClick={() => { setRules(startRules.join("\n")); setRerun("idle"); }} className="flex items-center gap-1 text-[13px] text-ink-2 hover:text-ink">
                <RotateCcw size={13} /> Reset
              </button>
              <span className="text-[12px] text-ink-3">About $0.01 a re-run</span>
            </div>
            {(rerun === "pass" || rerun === "fail") && (
              <div className="mt-4">
                <h5 className="text-[12px] text-ink-3">Before and after</h5>
                <DiffView wrap lines={diffLines(step.returned, rerun === "pass" ? after : step.returned)} />
                {rerun === "pass" ? (
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <p className="flex items-center gap-1.5 text-[13px] text-green">
                      <Check size={14} /> Passes: Manual Review, cites 5.2. The other two cases still pass with these rules.
                    </p>
                    <Button size="sm" variant="primary" onClick={() => ctx.applyDebugFix(ruleList)}>
                      Apply as a fix
                    </Button>
                  </div>
                ) : (
                  <p className="mt-3 text-[13px] text-red">Still cites 2.1. The agent needs a rule for two different figures for the same fact.</p>
                )}
              </div>
            )}
          </section>
        )}
        {fixed && caseId === "brightwell" && stepIx === 2 && <p className="mt-4 text-[13px] text-ink-2">Fixed: the rule for conflicting figures is in RULES.md, and this case now cites 5.2.</p>}
      </div>
    </div>
  );
}

// ---------- Agents as an API ----------

type Endpoint = { id: string; method: "POST"; path: string; summary: string; sample: object };
const ENDPOINTS: Endpoint[] = [
  {
    id: "triage",
    method: "POST",
    path: "/triage",
    summary: "The whole flow: facts in, a recommendation with clauses and a draft email out. An officer still confirms in the app.",
    sample: { applicant: "Brightwell Bakery", amount_gbp: 65000, purpose: "Second deck oven", income_figures: [{ value: 180000, source: "Section C" }, { value: 140000, source: "Section D" }], trading_years: 4 },
  },
  {
    id: "policy",
    method: "POST",
    path: "/agents/policy/run",
    summary: "Policy agent only: confirmed facts in, Approve, Decline or Manual Review with the clauses it relied on.",
    sample: { applicant: "Hartley Joinery Ltd", amount_gbp: 30000, purpose: "CNC router", income_figures: [{ value: 95000, source: "Section C" }], trading_years: 6 },
  },
  {
    id: "drafting",
    method: "POST",
    path: "/agents/drafting/run",
    summary: "Drafting agent only: a decision in, an applicant email out. Never sends.",
    sample: { applicant: "Cole Ventures", decision: "Decline", clauses: ["4.2"] },
  },
];

function openApi(base: string, projectName: string) {
  return {
    openapi: "3.1.0",
    info: { title: `${projectName} agents`, version: "1" },
    servers: [{ url: base }],
    security: [{ bearer: [] }],
    components: { securitySchemes: { bearer: { type: "http", scheme: "bearer" } } },
    paths: Object.fromEntries(
      ENDPOINTS.map((e) => [
        e.path,
        {
          post: {
            summary: e.summary,
            requestBody: { content: { "application/json": { example: e.sample } } },
            responses: { "200": { description: "Result with the clauses the agent cited and a run id for its trace" } },
          },
        },
      ]),
    ),
  };
}

export function ApiPanel({ ctx }: { ctx: DevCtx }) {
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const base = `${origin}/api/v1/projects/${ctx.projectId}`;
  const [ep, setEp] = useState(ENDPOINTS[0]);
  const [lang, setLang] = useState<"curl" | "python" | "typescript">("curl");
  const [body, setBody] = useState(JSON.stringify(ENDPOINTS[0].sample, null, 2));
  const [resp, setResp] = useState<{ status: number; ms: number; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [keyEnv, setKeyEnv] = useState<EnvName>("preview");
  const [fresh, setFresh] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const keys = ctx.j.apiKeys ?? [];
  const live = keys.filter((k) => !k.revoked);
  const sampleKey = fresh ?? "YOUR_API_KEY";

  const copy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1400);
  };
  const compact = JSON.stringify(JSON.parse(body || "{}"));
  const snippet = {
    curl: `curl -X POST ${base}${ep.path} \\\n  -H "Authorization: Bearer ${sampleKey}" \\\n  -H "Content-Type: application/json" \\\n  -d '${compact}'`,
    python: `import requests\n\nr = requests.post(\n    "${base}${ep.path}",\n    headers={"Authorization": "Bearer ${sampleKey}"},\n    json=${compact},\n)\nprint(r.json()["recommendation"], r.json()["cited"])`,
    typescript: `const r = await fetch("${base}${ep.path}", {\n  method: "POST",\n  headers: { Authorization: "Bearer ${sampleKey}", "Content-Type": "application/json" },\n  body: JSON.stringify(${compact}),\n});\nconst result = await r.json();`,
  }[lang];

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl">
        <p className="text-sm text-ink-2">Call this project&apos;s agents from the customer&apos;s own systems. Every call is traced, metered and runs the version that&apos;s live in the key&apos;s environment.</p>
        <p className="mt-2 flex items-center gap-2 text-[13px]">
          <span className="text-ink-3">Base URL</span>
          <code className="rounded bg-paper px-1.5 py-0.5 font-mono text-[12px]">{base}</code>
          <button onClick={() => copy("base", base)} aria-label="Copy base URL" className="text-ink-3 hover:text-ink">
            {copied === "base" ? <Check size={13} /> : <Copy size={13} />}
          </button>
        </p>

        <h3 className="mt-6 text-sm font-semibold">Endpoints</h3>
        <ul className="mt-2 divide-y divide-line rounded-lg border border-line bg-surface">
          {ENDPOINTS.map((e) => (
            <li key={e.id}>
              <button
                onClick={() => {
                  setEp(e);
                  setBody(JSON.stringify(e.sample, null, 2));
                  setResp(null);
                }}
                aria-pressed={ep.id === e.id}
                className={`flex w-full items-start gap-3 px-4 py-2.5 text-left text-sm ${ep.id === e.id ? "bg-blue-wash/60" : "hover:bg-paper"}`}
              >
                <span className="mt-0.5 rounded bg-green-wash px-1.5 font-mono text-[11px] text-green">{e.method}</span>
                <span className="min-w-0">
                  <span className="block font-mono text-[12.5px]">{e.path}</span>
                  <span className="block text-[13px] text-ink-2">{e.summary}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <section>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Try it</h3>
              <span className="font-mono text-[12px] text-ink-3">POST {ep.path}</span>
            </div>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} spellCheck={false} aria-label="Request body" className="mt-2 w-full rounded-md border border-line-strong bg-[#fbfcfd] p-2.5 font-mono text-[12px] leading-relaxed outline-none focus:border-blue" />
            <Button
              size="sm"
              variant="primary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                const t0 = performance.now();
                try {
                  const r = await fetch(`${base}${ep.path}`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${fresh ?? "ak_test_try_it"}` }, body });
                  setResp({ status: r.status, ms: Math.round(performance.now() - t0), text: JSON.stringify(await r.json(), null, 2) });
                } catch (e) {
                  setResp({ status: 0, ms: 0, text: (e as Error).message });
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} Send request
            </Button>
          </section>
          <section>
            <h3 className="text-sm font-semibold">Response</h3>
            {resp ? (
              <>
                <p className={`mt-2 text-[12px] ${resp.status === 200 ? "text-green" : "text-red"}`}>
                  {resp.status || "Network error"} · {resp.ms} ms
                </p>
                <pre className="mt-1 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-md border border-line bg-surface p-2.5 font-mono text-[12px] leading-relaxed">{resp.text}</pre>
              </>
            ) : (
              <p className="mt-2 text-[13px] text-ink-3">Send the sample, or change the figures first: try two income figures, or a crypto purpose.</p>
            )}
          </section>
        </div>

        <section className="mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Code</h3>
            <div className="flex rounded-md border border-line-strong p-0.5" role="group" aria-label="Language">
              {(["curl", "python", "typescript"] as const).map((l) => (
                <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l} className={`rounded px-2.5 py-0.5 text-[12px] ${lang === l ? "bg-ink text-white" : "text-ink-2"}`}>
                  {l === "curl" ? "curl" : l === "python" ? "Python" : "TypeScript"}
                </button>
              ))}
            </div>
          </div>
          <div className="relative mt-2">
            <pre className="whitespace-pre-wrap break-all rounded-md bg-ink p-3 pr-9 font-mono text-[12px] leading-relaxed text-[#e6e9ef]">{snippet}</pre>
            <button onClick={() => copy("snippet", snippet)} aria-label="Copy code" className="absolute right-2 top-2 rounded p-1 text-[#9aa4b5] hover:text-white">
              {copied === "snippet" ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </section>

        <section className="mt-6">
          <h3 className="text-sm font-semibold">API keys</h3>
          <p className="mt-0.5 text-[13px] text-ink-3">A key works in one environment. You see it once; Architect keeps only its first characters.</p>
          {fresh && (
            <div className="mt-2 flex items-center gap-2 rounded-md border border-amber/40 bg-amber-wash p-2.5 text-[13px]">
              <code className="min-w-0 flex-1 break-all font-mono text-[12px]">{fresh}</code>
              <Button size="sm" onClick={() => copy("key", fresh)}>
                {copied === "key" ? <Check size={14} /> : <Copy size={14} />} Copy
              </Button>
            </div>
          )}
          {live.length > 0 && (
            <ul className="mt-2 divide-y divide-line rounded-lg border border-line bg-surface text-sm">
              {live.map((k) => (
                <li key={k.id} className="flex items-center gap-3 px-4 py-2">
                  <KeyRound size={13} className="text-ink-3" />
                  <span className="font-medium">{k.name}</span>
                  <span className="font-mono text-[12px] text-ink-3">{k.prefix}…</span>
                  <span className="text-[12px] text-ink-3">{LABEL[k.env]}</span>
                  <button onClick={() => ctx.setApiKeys(keys.map((x) => (x.id === k.id ? { ...x, revoked: true } : x)), `Revoked the API key "${k.name}".`)} className="ml-auto text-[12px] text-red hover:underline">
                    Revoke
                  </button>
                </li>
              ))}
            </ul>
          )}
          <form
            className="mt-2 flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!keyName.trim()) return;
              const rand = Array.from(crypto.getRandomValues(new Uint8Array(18)), (b) => b.toString(16).padStart(2, "0")).join("");
              const full = `ak_${keyEnv === "production" ? "live" : "test"}_${rand}`;
              setFresh(full);
              ctx.setApiKeys([...keys, { id: crypto.randomUUID(), name: keyName.trim(), env: keyEnv, prefix: full.slice(0, 12), createdAt: new Date().toISOString() }], `Created the API key "${keyName.trim()}" for ${LABEL[keyEnv]}.`);
              setKeyName("");
            }}
          >
            <input value={keyName} onChange={(e) => setKeyName(e.target.value)} placeholder="Key name, e.g. Kestrel core banking" aria-label="Key name" className="h-9 min-w-0 flex-1 rounded-md border border-line-strong px-2.5 text-sm outline-none focus:border-blue" />
            <select value={keyEnv} onChange={(e) => setKeyEnv(e.target.value as EnvName)} aria-label="Key environment" className="h-9 rounded-md border border-line-strong bg-surface px-2 text-sm">
              {ENV_NAMES.map((e) => (
                <option key={e} value={e}>
                  {LABEL[e]}
                </option>
              ))}
            </select>
            <Button type="submit" size="sm">
              <Plus size={14} /> Create key
            </Button>
          </form>
        </section>

        <section className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface p-4">
          <div>
            <h3 className="text-sm font-semibold">OpenAPI spec</h3>
            <p className="text-[13px] text-ink-3">For the customer&apos;s developers, or to generate a client in any language.</p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              const blob = new Blob([JSON.stringify(openApi(base, ctx.projectName), null, 2)], { type: "application/json" });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = "openapi.json";
              a.click();
              setTimeout(() => URL.revokeObjectURL(a.href), 1000);
            }}
          >
            <Download size={14} /> Download openapi.json
          </Button>
        </section>
        <p className="mt-4 text-[12px] text-ink-3">In the prototype the endpoints are real and answer from a fixed rule set that follows the lending policy, not from a model; keys aren&apos;t checked yet.</p>
      </div>
    </div>
  );
}
