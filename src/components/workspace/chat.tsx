"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Check, Loader2, Circle, Pin } from "lucide-react";
import type { Question } from "@/lib/fixtures";

export type ChatItem =
  | { kind: "user"; text: string }
  | { kind: "architect"; text: string }
  | { kind: "step"; text: string; state: "done" | "running" | "waiting" };

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
}: {
  items: ChatItem[];
  todos: Todo[];
  question?: Question;
  qIndex: number;
  qTotal: number;
  onAnswer: (v: string[]) => void;
  onAllRecommended: () => void;
  onSend: (text: string) => void;
  placeholder: string;
}) {
  const [text, setText] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth", block: "end" }), [items.length, question]);

  const send = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <section className="flex h-full w-full shrink-0 flex-col border-r border-line bg-paper lg:w-[380px]" aria-label="Chat">
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
        {items.map((m, i) =>
          m.kind === "user" ? (
            <div key={i} className="ml-8 rounded-lg bg-blue-wash px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line text-ink">
              {m.text}
            </div>
          ) : m.kind === "architect" ? (
            <div key={i} className="mr-4 text-sm leading-relaxed whitespace-pre-line text-ink">
              {m.text}
            </div>
          ) : (
            <div key={i} className="flex items-start gap-2 text-[13px] text-ink-2">
              {m.state === "done" ? (
                <Check size={14} className="mt-0.5 shrink-0 text-green" />
              ) : m.state === "running" ? (
                <Loader2 size={14} className="mt-0.5 shrink-0 animate-spin text-blue" />
              ) : (
                <Circle size={12} className="mt-1 shrink-0 text-line-strong" />
              )}
              <span className={m.state === "waiting" ? "text-ink-3" : ""}>{m.text}</span>
            </div>
          ),
        )}
        {question && <QuestionCard q={question} index={qIndex} total={qTotal} onAnswer={onAnswer} onAllRecommended={onAllRecommended} />}
        <div ref={end} />
      </div>

      <div className="border-t border-line bg-surface p-3">
        <div className="flex items-end gap-2 rounded-lg border border-line-strong bg-surface p-2 focus-within:border-blue">
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
            className="flex-1 resize-none bg-transparent px-1 text-sm outline-none placeholder:text-ink-3"
          />
          <button onClick={send} aria-label="Send" className="flex h-8 w-8 items-center justify-center rounded-md bg-blue text-white hover:bg-blue-ink disabled:opacity-40" disabled={!text.trim()}>
            <ArrowUp size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
