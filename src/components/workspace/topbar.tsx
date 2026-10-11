"use client";

import { Check, Share2, Rocket, MoreVertical, Pencil, Copy, FlaskConical, RefreshCw, Download, KeyRound, FolderTree, CopyPlus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Project, Stage } from "@/lib/store";
import { StatusBadge } from "../ui";
import { CreditsPill } from "../credits";

export type View = "builder" | "developer" | "approver";

/** Project-level actions from the More menu, matching today's Architect. */
export type ProjectActions = {
  rename: (name: string) => void;
  browserTest: boolean;
  setBrowserTest: (on: boolean) => void;
  refresh: () => void;
  download: () => void;
  openEnv: () => void;
  openFiles: () => void;
  duplicate: () => void;
  remove: () => void;
};
export const STAGES: { id: Exclude<Stage, "live">; label: string }[] = [
  { id: "plan", label: "Plan" },
  { id: "connect", label: "Connect" },
  { id: "build", label: "Build" },
  { id: "test", label: "Test" },
  { id: "ship", label: "Ship" },
];
const ORDER: Stage[] = ["plan", "connect", "build", "test", "ship", "live"];
export const stageIndex = (s: Stage) => ORDER.indexOf(s);

export function TopBar({
  project,
  viewing,
  onViewStage,
  view,
  onView,
  shipReady,
  onShip,
  actions,
}: {
  project: Project;
  viewing: Stage;
  onViewStage: (s: Stage) => void;
  view: View;
  onView: (v: View) => void;
  shipReady: boolean;
  onShip: () => void;
  actions: ProjectActions;
}) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const [menu, setMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [idCopied, setIdCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) {
        setMenu(false);
        setConfirmDelete(false);
      }
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [menu]);
  const saveName = () => {
    setEditing(false);
    const v = name.trim();
    if (v && v !== project.name) actions.rename(v);
    else setName(project.name);
  };
  const run = (fn: () => void) => {
    setMenu(false);
    fn();
  };
  const item = "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-paper";
  const reached = stageIndex(project.stage);

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-line bg-surface px-4">
      <div className="flex min-w-[7rem] items-center gap-2.5 sm:min-w-0">
        {editing ? (
          <input
            autoFocus
            aria-label="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveName();
              if (e.key === "Escape") {
                setName(project.name);
                setEditing(false);
              }
            }}
            className="h-8 w-56 rounded-md border border-blue px-2 font-semibold outline-none"
          />
        ) : (
          <button onClick={() => setEditing(true)} title="Rename" className="group flex min-w-0 items-center gap-1.5">
            <h1 className="truncate font-semibold">{project.name}</h1>
            <Pencil size={13} className="shrink-0 text-ink-3 opacity-0 group-hover:opacity-100" />
          </button>
        )}
        <span className="hidden shrink-0 sm:inline-flex">
          <StatusBadge status={project.status} />
        </span>
      </div>

      {/* The stepper: reached stages can be reopened; later ones are locked until earlier ones finish. */}
      <nav aria-label="Stages" className="mx-auto hidden items-center md:flex">
        {STAGES.map((s, i) => {
          const done = reached > i;
          const current = viewing === s.id || (viewing === "live" && s.id === "ship");
          const locked = i > reached;
          return (
            <div key={s.id} className="flex items-center">
              {i > 0 && <span className={`mx-1 h-px w-6 ${reached >= i ? "bg-ink-3" : "bg-line-strong"}`} />}
              <button
                onClick={() => onViewStage(s.id)}
                disabled={locked}
                aria-current={current ? "step" : undefined}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] ${
                  current ? "bg-ink text-white" : locked ? "text-ink-3/60" : "text-ink-2 hover:bg-line/60"
                }`}
              >
                {done && !current ? <Check size={13} className={s.id === "test" ? "text-green" : ""} /> : null}
                {s.label}
              </button>
            </div>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-2 md:ml-0">
        <div className="hidden rounded-full border border-line-strong p-0.5 text-[12px] sm:flex" role="group" aria-label="View">
          {(["builder", "developer", "approver"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => onView(v)}
              aria-pressed={view === v}
              className={`rounded-full px-2.5 py-1 ${view === v ? "bg-blue-wash font-medium text-blue-ink" : "text-ink-2 hover:text-ink"}`}
            >
              {v[0].toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
        <div className="hidden sm:block">
          <CreditsPill />
        </div>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="flex h-8 items-center gap-1.5 rounded-md border border-line-strong px-2.5 text-[13px] hover:border-ink-3"
        >
          <Share2 size={14} /> <span className="hidden sm:inline">{copied ? "Link copied" : "Share"}</span>
        </button>
        <button
          onClick={onShip}
          disabled={!shipReady}
          title={shipReady ? "Go to Ship" : "Ship opens once every test passes"}
          className="flex h-8 items-center gap-1.5 rounded-md bg-blue px-3 text-[13px] font-medium text-white hover:bg-blue-ink disabled:cursor-not-allowed disabled:bg-line-strong disabled:text-ink-3"
        >
          <Rocket size={14} /> Ship
        </button>
        <div ref={menuRef} className="relative">
          <button onClick={() => setMenu((m) => !m)} aria-label="More actions" aria-expanded={menu} className="flex h-8 w-8 items-center justify-center rounded-md text-ink-2 hover:bg-paper hover:text-ink">
            <MoreVertical size={16} />
          </button>
          {menu && (
            <div role="menu" className="absolute right-0 top-full z-40 mt-1 w-64 rounded-lg border border-line-strong bg-surface p-1 shadow-[0_12px_32px_-12px_rgba(24,32,46,0.35)]">
              <button
                role="menuitem"
                onClick={() => {
                  navigator.clipboard?.writeText(project.id);
                  setIdCopied(true);
                  setTimeout(() => setIdCopied(false), 1400);
                }}
                className={item}
              >
                <Copy size={14} className="text-ink-3" />
                <span className="flex-1">{idCopied ? "Project ID copied" : "Copy project ID"}</span>
                <span className="font-mono text-[11px] text-ink-3">{project.id.slice(0, 8)}</span>
              </button>
              <button role="menuitem" onClick={() => run(() => setEditing(true))} className={item}>
                <Pencil size={14} className="text-ink-3" /> Rename
              </button>
              <button role="menuitemcheckbox" aria-checked={actions.browserTest} onClick={() => run(() => actions.setBrowserTest(!actions.browserTest))} className={item}>
                <FlaskConical size={14} className="text-ink-3" /> <span className="flex-1">Feature testing</span>
                <span className="text-[12px] text-ink-3">{actions.browserTest ? "On" : "Off"}</span>
              </button>
              <button role="menuitem" onClick={() => run(actions.refresh)} className={item}>
                <RefreshCw size={14} className="text-ink-3" /> Refresh preview
              </button>
              <div className="my-1 border-t border-line" />
              <button role="menuitem" onClick={() => run(actions.download)} className={item}>
                <Download size={14} className="text-ink-3" /> Download code
              </button>
              <button role="menuitem" onClick={() => run(actions.openEnv)} className={item}>
                <KeyRound size={14} className="text-ink-3" /> Environment variables
              </button>
              <button role="menuitem" onClick={() => run(actions.openFiles)} className={item}>
                <FolderTree size={14} className="text-ink-3" /> View file tree
              </button>
              <button role="menuitem" onClick={() => run(actions.duplicate)} className={item}>
                <CopyPlus size={14} className="text-ink-3" /> Duplicate project
              </button>
              <div className="my-1 border-t border-line" />
              <button
                role="menuitem"
                onClick={() => (confirmDelete ? run(actions.remove) : setConfirmDelete(true))}
                className={`${item} text-red hover:bg-red-wash`}
              >
                <Trash2 size={14} /> {confirmDelete ? "Click again to delete for good" : "Delete project"}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
