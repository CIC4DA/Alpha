"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUp, Check, Loader2, Circle, Pin, Paperclip, FileText, X, Plus, MoreVertical, ClipboardList, Hand, Zap, GitCommitHorizontal, RotateCcw, ChevronRight, Server, Wrench } from "lucide-react";
import type { Question } from "@/lib/fixtures";

export type Proposal = { id: string; title: string; changes: string[]; status: "pending" | "applied" | "discarded" };

export type ChatItem =
  | { kind: "user"; text: string; files?: string[] }
  | { kind: "architect"; text: string; who?: string }
  | { kind: "step"; text: string; state: "done" | "running" | "waiting"; detail?: string }
  | { kind: "commit"; sha: string; message: string; current: boolean }
  | { kind: "proposal"; proposal: Proposal };

/** Plan proposes without touching anything; Manual shows each change for approval; Auto applies when the tests pass. */
export type ChatMode = "plan" | "manual" | "auto";
export const MODES: { id: ChatMode; label: string; icon: typeof Zap; detail: string }[] = [
  { id: "plan", label: "Plan", icon: ClipboardList, detail: "Reads the project and proposes changes. Nothing changes, and it's free." },
  { id: "manual", label: "Manual", icon: Hand, detail: "Shows each change before it's made. You apply or discard it." },
  { id: "auto", label: "Auto", icon: Zap, detail: "Makes the change, runs the golden tests, and keeps it only if they pass." },
];

export type Todo = { id: string; text: string; action?: () => void; actionLabel?: string };

function QuestionCard({ q, index, total, onAnswer, onAllRecommended }: { q: Question; index: number; total: number; onAnswer: (v: string[]) => void; onAllRecommended: () => void }) {
  const rec = q.options.filter((o) => o.recommended).map((o) => o.id);
  const [picked, setPicked] = useState<string[]>(rec);
  const [other, setOther] = useState("");
  useEffect(() => {
    setPicked(q.options.filter((o) => o.recommended).map((o) => o.id));
    setOther("");
  }, [q]);

  const toggle = (id: string) => setPicked((p) => (q.multi ? (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]) : [id]));

  return (
    <div className="rounded-lg border border-line-strong bg-surface p-4 appear">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-semibold leading-snug">{q.ask}</p>
        <span className="shrink-0 text-[12px] text-ink-3">
          {index + 1} of {total}
        </span>
      </div>
      <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{q.why}</p>
      <div className="mt-3 flex flex-col gap-2">
        {q.options.map((o) => {
          const on = picked.includes(o.id);
          return (
            <button
              key={o.id}
              onClick={() => toggle(o.id)}
              aria-pressed={on}
              className={`rounded-md border px-3 py-2.5 text-left ${on ? "border-blue bg-blue-wash/60" : "border-line hover:border-line-strong"}`}
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <span className={`flex h-4 w-4 shrink-0 items-center justify-center ${q.multi ? "rounded" : "rounded-full"} border ${on ? "border-blue bg-blue text-white" : "border-line-strong"}`}>
                  {on && <Check size={11} strokeWidth={3} />}
                </span>
                {o.label}
                {o.recommended && <span className="ml-auto text-[11px] font-normal text-blue-ink">Recommended</span>}
              </span>
              <span className="mt-0.5 block pl-6 text-[12px] text-ink-2">{o.detail}</span>
            </button>
          );
        })}
        <input
          value={other}
          onChange={(e) => {
            setOther(e.target.value);
            if (e.target.value) setPicked([]);
          }}
          placeholder="Something else"
          className="h-9 rounded-md border border-line px-3 text-sm outline-none focus:border-blue"
          aria-label="Your own answer"
        />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <button onClick={onAllRecommended} className="text-[13px] text-blue hover:underline">
          Use recommended for the rest
        </button>
        <button
          onClick={() => onAnswer(other ? [other] : picked)}
          disabled={!other && picked.length === 0}
          className="h-8 rounded-md bg-blue px-3 text-[13px] font-medium text-white hover:bg-blue-ink disabled:opacity-40"
        >
          {index + 1 === total ? "Answer and see the plan" : "Next question"}
        </button>
      </div>
    </div>
  );
}

function StepRow({ m }: { m: Extract<ChatItem, { kind: "step" }> }) {
  const [open, setOpen] = useState(false);
  const actions = m.detail ? m.detail.split("\n").filter((l) => l.trim() && !l.startsWith(" ")) : [];
  return (
    <div className="text-[13px] text-ink-2">
      <div className="flex items-start gap-2">
        {m.state === "done" ? (
          <Check size={14} className="mt-0.5 shrink-0 text-green" />
        ) : m.state === "running" ? (
          <Loader2 size={14} className="mt-0.5 shrink-0 animate-spin text-blue" />
        ) : (
          <Circle size={12} className="mt-1 shrink-0 text-line-strong" />
        )}
        <span className={`flex-1 ${m.state === "waiting" ? "text-ink-3" : ""}`}>{m.text}</span>
        {m.state !== "waiting" && actions.length > 0 && (
          <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex shrink-0 items-center gap-0.5 text-[12px] text-ink-3 hover:text-ink">
            {actions.length} {actions.length === 1 ? "action" : "actions"} <ChevronRight size={12} className={open ? "rotate-90" : ""} />
          </button>
        )}
      </div>
      {open && m.detail && <pre className="ml-6 mt-1.5 overflow-x-auto rounded-md bg-ink px-3 py-2 font-mono text-[11.5px] leading-relaxed text-[#d6dbe4]">{m.detail}</pre>}
    </div>
  );
}

function ProposalCard({ p, onDecide }: { p: Proposal; onDecide: (id: string, apply: boolean) => void }) {
  return (
    <div className="rounded-lg border border-line-strong bg-surface p-3 appear">
      <p className="text-[12px] text-ink-3">{p.status === "pending" ? "Proposed change, waiting for you" : p.status === "applied" ? "Applied" : "Discarded"}</p>
      <p className="mt-0.5 text-sm font-medium">{p.title}</p>
      <ul className="mt-2 space-y-1 text-[13px] text-ink-2">
        {p.changes.map((c) => (
          <li key={c} className="flex gap-2">
            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-ink-3" />
            {c}
          </li>
        ))}
      </ul>
      {p.status === "pending" && (
        <div className="mt-3 flex justify-end gap-2">
          <button onClick={() => onDecide(p.id, false)} className="h-8 rounded-md px-3 text-[13px] text-ink-2 hover:bg-paper">
            Discard
          </button>
          <button onClick={() => onDecide(p.id, true)} className="h-8 rounded-md bg-blue px-3 text-[13px] font-medium text-white hover:bg-blue-ink">
            Apply change
          </button>
        </div>
      )}
    </div>
  );
}

/** Small anchored menu that closes on outside click or Escape. */
function useMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  return { open, setOpen, ref };
}

const input = "h-8 w-full rounded-md border border-line-strong bg-surface px-2.5 text-[13px] outline-none focus:border-blue";

export function ChatPane({
  items,
  todos,
  question,
  qIndex,
  qTotal,
  onAnswer,
  onAllRecommended,
  onSend,
  placeholder,
  mode,
  onMode,
  onRevert,
  onDecide,
  onAddMcp,
  onAddTool,
  browserTest,
  onBrowserTest,
}: {
  items: ChatItem[];
  todos: Todo[];
  question?: Question;
  qIndex: number;
  qTotal: number;
  onAnswer: (v: string[]) => void;
  onAllRecommended: () => void;
  onSend: (text: string, files: string[]) => void;
  placeholder: string;
  mode: ChatMode;
  onMode: (m: ChatMode) => void;
  onRevert: (sha: string) => void;
  onDecide: (id: string, apply: boolean) => void;
  onAddMcp: (s: { name: string; url: string }) => void;
  onAddTool: (t: { name: string; detail: string }) => void;
  browserTest: boolean;
  onBrowserTest: (on: boolean) => void;
}) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<string[]>([]); // file names; the prototype records names, never contents
  const [dragging, setDragging] = useState(false);
  const [dialog, setDialog] = useState<null | "mcp" | "tool">(null);
  const [f1, setF1] = useState("");
  const [f2, setF2] = useState("");
  const picker = useRef<HTMLInputElement>(null);
  const { open: plusOpen, setOpen: setPlusOpen, ref: plusRef } = useMenu();
  const { open: optsOpen, setOpen: setOptsOpen, ref: optsRef } = useMenu();
  const addFiles = (list: FileList | null) => {
    const names = Array.from(list ?? []).map((f) => f.name);
    if (names.length) setFiles((cur) => [...cur, ...names.filter((n) => !cur.includes(n))]);
  };
  const end = useRef<HTMLDivElement>(null);
  // Braces matter: newer browsers return a Promise from scrollIntoView, and an effect must not return one.
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [items.length, question]);

  const send = () => {
    if (!text.trim() && !files.length) return;
    onSend(text.trim(), files);
    setText("");
    setFiles([]);
  };
  const current = MODES.find((m) => m.id === mode)!;
  const choose = (id: "files" | "mcp" | "tool") => {
    setPlusOpen(false);
    if (id === "files") picker.current?.click();
    else setDialog(id);
  };

  const submitDialog = () => {
    if (!f1.trim()) return;
    if (dialog === "mcp") onAddMcp({ name: f1.trim(), url: f2.trim() });
    else onAddTool({ name: f1.trim(), detail: f2.trim() });
    setDialog(null);
    setF1("");
    setF2("");
  };

  return (
    <section className="flex h-full w-full shrink-0 flex-col border-r border-line bg-paper" aria-label="Chat">
      <div className="border-b border-line bg-surface px-3 py-2">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold">
            <current.icon size={14} className="text-blue" /> {current.label} mode
          </p>
          <div className="flex rounded-full border border-line-strong p-0.5 text-[12px]" role="radiogroup" aria-label="Chat mode">
            {MODES.map((m) => (
              <button
                key={m.id}
                role="radio"
                aria-checked={mode === m.id}
                title={m.detail}
                onClick={() => onMode(m.id)}
                className={`rounded-full px-2.5 py-0.5 ${mode === m.id ? "bg-blue-wash font-medium text-blue-ink" : "text-ink-2 hover:text-ink"}`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-0.5 text-[12px] text-ink-3">{current.detail}</p>
      </div>

      {/* Blockers stay pinned above the conversation until they're done. */}
      {todos.length > 0 && (
        <div className="m-3 mb-0 rounded-lg border border-amber/30 bg-amber-wash p-3">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-amber">
            <Pin size={13} /> {todos.length === 1 ? "1 thing needs you" : `${todos.length} things need you`}
          </p>
          <ul className="mt-1.5 flex flex-col gap-1">
            {todos.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-2 text-[13px] text-ink">
                <span>{t.text}</span>
                {t.action && (
                  <button onClick={t.action} className="shrink-0 font-medium text-blue hover:underline">
                    {t.actionLabel ?? "Open"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {items.map((m, i) => {
          if (m.kind === "user")
            return (
              <div key={i} className="ml-8 whitespace-pre-line rounded-lg bg-blue-wash px-3.5 py-2.5 text-sm leading-relaxed text-ink">
                {m.text}
                {m.files && m.files.length > 0 && (
                  <ul className={`flex flex-wrap gap-1.5 ${m.text ? "mt-2" : ""}`}>
                    {m.files.map((f) => (
                      <li key={f} className="flex max-w-full items-center gap-1 rounded border border-line bg-surface px-2 py-1 text-[12px]">
                        <FileText size={12} className="shrink-0 text-ink-3" /> <span className="truncate">{f}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          if (m.kind === "architect")
            return (
              <div key={i} className="mr-4 text-sm leading-relaxed text-ink">
                {m.who && <p className="mb-0.5 text-[12px] font-medium text-blue-ink">{m.who}</p>}
                <p className="whitespace-pre-line">{m.text}</p>
              </div>
            );
          if (m.kind === "step") return <StepRow key={i} m={m} />;
          if (m.kind === "proposal") return <ProposalCard key={i} p={m.proposal} onDecide={onDecide} />;
          return (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2.5">
              <GitCommitHorizontal size={16} className="shrink-0 text-ink-3" />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[11px] text-ink-3">{m.sha}</p>
                <p className="truncate text-[13px]">{m.message}</p>
              </div>
              {m.current ? (
                <span className="shrink-0 text-[12px] text-green">Current</span>
              ) : (
                <button onClick={() => onRevert(m.sha)} className="flex shrink-0 items-center gap-1 text-[12px] text-ink-2 hover:text-blue">
                  <RotateCcw size={12} /> Revert to this version
                </button>
              )}
            </div>
          );
        })}
        {question && <QuestionCard q={question} index={qIndex} total={qTotal} onAnswer={onAnswer} onAllRecommended={onAllRecommended} />}
        <div ref={end} />
      </div>

      <div className="relative border-t border-line bg-surface p-3">
        {dialog && (
          <form
            className="mb-2 rounded-lg border border-line-strong bg-surface p-3 shadow-sm"
            onSubmit={(e) => {
              e.preventDefault();
              submitDialog();
            }}
          >
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-semibold">{dialog === "mcp" ? "Add an MCP server" : "Add a custom tool"}</p>
              <button type="button" onClick={() => setDialog(null)} aria-label="Close" className="rounded p-0.5 text-ink-3 hover:text-ink">
                <X size={14} />
              </button>
            </div>
            <p className="mt-0.5 text-[12px] text-ink-3">
              {dialog === "mcp" ? "Its tools become available to this project's agents. Credentials go to the vault, never into code." : "An API the agents can call. Describe what it does so the right agent uses it."}
            </p>
            <div className="mt-2 flex flex-col gap-1.5">
              <input aria-label={dialog === "mcp" ? "Server name" : "Tool name"} autoFocus value={f1} onChange={(e) => setF1(e.target.value)} placeholder={dialog === "mcp" ? "Companies House" : "Credit bureau lookup"} className={input} />
              <input aria-label={dialog === "mcp" ? "Server URL" : "What it does"} value={f2} onChange={(e) => setF2(e.target.value)} placeholder={dialog === "mcp" ? "https://mcp.example.com/sse" : "Returns a credit score for a company number"} className={input} />
            </div>
            <div className="mt-2 flex justify-end">
              <button type="submit" disabled={!f1.trim()} className="h-8 rounded-md bg-blue px-3 text-[13px] font-medium text-white disabled:opacity-45">
                {dialog === "mcp" ? "Add server" : "Add tool"}
              </button>
            </div>
          </form>
        )}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(e.dataTransfer.files);
          }}
          className={`rounded-lg border bg-surface p-2 focus-within:border-blue ${dragging ? "border-blue bg-blue-wash/40" : "border-line-strong"}`}
        >
          {files.length > 0 && (
            <ul className="mb-2 flex flex-wrap gap-1.5" aria-label="Attached files">
              {files.map((f) => (
                <li key={f} className="flex max-w-full items-center gap-1 rounded border border-line bg-paper py-1 pl-2 pr-1 text-[12px]">
                  <FileText size={12} className="shrink-0 text-ink-3" />
                  <span className="truncate">{f}</span>
                  <button onClick={() => setFiles((cur) => cur.filter((x) => x !== f))} aria-label={`Remove ${f}`} className="rounded p-0.5 text-ink-3 hover:text-ink">
                    <X size={12} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={2}
            placeholder={placeholder}
            aria-label="Message"
            className="w-full resize-none bg-transparent px-1 text-sm outline-none placeholder:text-ink-3"
          />
          <div className="mt-1 flex items-center gap-1">
            <input
              ref={picker}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx,.csv,.txt,.md"
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <div ref={plusRef} className="relative">
              <button onClick={() => setPlusOpen((o) => !o)} aria-label="Add" aria-expanded={plusOpen} className="flex h-8 w-8 items-center justify-center rounded-md text-ink-2 hover:bg-paper hover:text-ink">
                <Plus size={17} />
              </button>
              {plusOpen && (
                <div role="menu" className="absolute bottom-full left-0 z-30 mb-1 w-52 rounded-lg border border-line-strong bg-surface p-1 shadow-[0_12px_32px_-12px_rgba(24,32,46,0.35)]">
                  {(
                    [
                      { id: "files", label: "Attach files", icon: Paperclip },
                      { id: "mcp", label: "Add MCP server", icon: Server },
                      { id: "tool", label: "Add custom tool", icon: Wrench },
                    ] as const
                  ).map((x) => (
                    <button
                      key={x.label}
                      role="menuitem"
                      onClick={() => choose(x.id)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-paper"
                    >
                      <x.icon size={14} className="text-ink-3" /> {x.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div ref={optsRef} className="relative">
              <button onClick={() => setOptsOpen((o) => !o)} aria-label="Build options and usage" aria-expanded={optsOpen} className="flex h-8 w-8 items-center justify-center rounded-md text-ink-2 hover:bg-paper hover:text-ink">
                <MoreVertical size={16} />
              </button>
              {optsOpen && (
                <div className="absolute bottom-full left-0 z-30 mb-1 w-64 rounded-lg border border-line-strong bg-surface p-3 shadow-[0_12px_32px_-12px_rgba(24,32,46,0.35)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-medium">Test in a real browser</p>
                      <p className="text-[12px] leading-snug text-ink-3">Clicks through every screen after each build. Adds 2–5 minutes.</p>
                    </div>
                    <button
                      role="switch"
                      aria-checked={browserTest}
                      aria-label="Test in a real browser after each build"
                      onClick={() => onBrowserTest(!browserTest)}
                      className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors ${browserTest ? "bg-blue" : "bg-line-strong"}`}
                    >
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${browserTest ? "translate-x-[18px]" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                  <Link href="/usage" className="mt-3 block border-t border-line pt-2 text-[13px] text-blue hover:underline">
                    Credits and usage
                  </Link>
                </div>
              )}
            </div>
            <span className="ml-1 text-[12px] text-ink-3">{mode === "plan" ? "Free" : "Uses credits"}</span>
            <button
              onClick={send}
              aria-label="Send"
              className="ml-auto flex h-8 w-8 items-center justify-center rounded-md bg-blue text-white hover:bg-blue-ink disabled:opacity-40"
              disabled={!text.trim() && !files.length}
            >
              <ArrowUp size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
