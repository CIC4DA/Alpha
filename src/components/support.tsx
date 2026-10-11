"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { LifeBuoy, Send, X } from "lucide-react";
import { FAQS } from "@/lib/explore-content";

type Msg = { from: "you" | "support"; text: string; at: string };
const KEY = "alpha.support-chat";
const GREETING: Msg = { from: "support", text: "Hi. Ask anything about Architect: credits, tests, approvals, workspaces or the developer tools. I answer from the help articles, and a person takes over if that isn't enough.", at: "" };

/** Find the help article that best matches a question, by shared words. */
function bestAnswer(q: string) {
  const words = new Set(q.toLowerCase().match(/[a-z]{4,}/g) ?? []);
  let best: { score: number; f: (typeof FAQS)[number] } | null = null;
  for (const f of FAQS) {
    const score = (`${f.q} ${f.a} ${f.topic}`.toLowerCase().match(/[a-z]{4,}/g) ?? []).filter((w) => words.has(w)).length;
    if (!best || score > best.score) best = { score, f };
  }
  return best && best.score >= 2 ? best.f : null;
}

const Ctx = createContext<{ open: boolean; setOpen: (o: boolean) => void }>({ open: false, setOpen: () => {} });
export const useSupport = () => useContext(Ctx);

export function SupportProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return <Ctx.Provider value={{ open, setOpen }}>{children}</Ctx.Provider>;
}

export function SupportChat({ bubble = true }: { bubble?: boolean }) {
  const { open, setOpen } = useSupport();
  const [msgs, setMsgs] = useState<Msg[]>([GREETING]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? "null");
      if (Array.isArray(saved) && saved.length) setMsgs(saved);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(msgs));
    } catch {}
    end.current?.scrollIntoView({ block: "end" });
  }, [msgs, open]);

  const send = (q: string) => {
    const now = new Date().toISOString();
    setMsgs((m) => [...m, { from: "you", text: q, at: now }]);
    setTyping(true);
    setTimeout(() => {
      const f = bestAnswer(q);
      const human = /person|human|agent|someone|talk to/i.test(q);
      const reply = human
        ? "I've passed this to the support team with your conversation. They reply by email, usually within one working day. (In this prototype nothing is sent.)"
        : f
          ? `${f.a}\n\nFrom the help article "${f.q}". If that doesn't answer it, ask to talk to a person.`
          : "I couldn't find a help article for that. Ask to talk to a person and the support team will pick it up, or try the Help page.";
      setMsgs((m) => [...m, { from: "support", text: reply, at: new Date().toISOString() }]);
      setTyping(false);
    }, 700);
  };

  return (
    <>
      {bubble && !open && (
        <button onClick={() => setOpen(true)} aria-label="Open support chat" className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-ink text-white shadow-[0_8px_24px_-8px_rgba(24,32,46,0.5)] hover:bg-ink-2">
          <LifeBuoy size={20} />
        </button>
      )}
      {open && (
        <section role="dialog" aria-label="Support chat" className="fixed bottom-5 right-5 z-50 flex h-[480px] max-h-[calc(100vh-40px)] w-[360px] max-w-[calc(100vw-32px)] flex-col rounded-xl border border-line-strong bg-surface shadow-[0_16px_40px_-12px_rgba(24,32,46,0.4)]">
          <header className="flex items-center justify-between border-b border-line px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Support</p>
              <p className="text-[12px] text-ink-3">Answers from the help articles; a person when you need one</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close support chat" className="rounded p-1 text-ink-3 hover:text-ink">
              <X size={16} />
            </button>
          </header>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3 text-[13px] leading-relaxed">
            {msgs.map((m, i) => (
              <p key={i} className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 ${m.from === "you" ? "ml-auto bg-blue-wash text-blue-ink" : "bg-paper"}`}>
                {m.text}
              </p>
            ))}
            {typing && <p className="w-fit rounded-lg bg-paper px-3 py-2 text-ink-3">Looking it up</p>}
            {msgs.length === 1 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {["What costs credits?", "Can I approve my own changes?", "Can I use my own editor?"].map((s) => (
                  <button key={s} onClick={() => send(s)} className="rounded-full border border-line-strong px-2.5 py-1 text-[12px] hover:border-ink-3">
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div ref={end} />
          </div>
          <form
            className="flex items-end gap-2 border-t border-line p-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!text.trim()) return;
              send(text.trim());
              setText("");
            }}
          >
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
              rows={1}
              placeholder="Ask a question"
              aria-label="Message to support"
              className="max-h-24 min-h-9 flex-1 resize-none rounded-md border border-line-strong px-2.5 py-2 text-[13px] outline-none focus:border-blue"
            />
            <button type="submit" aria-label="Send to support" className="flex h-9 w-9 items-center justify-center rounded-md bg-blue text-white disabled:opacity-45" disabled={!text.trim()}>
              <Send size={15} />
            </button>
          </form>
        </section>
      )}
    </>
  );
}
