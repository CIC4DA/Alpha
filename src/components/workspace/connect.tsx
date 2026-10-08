"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, FileUp, Mail, Globe2, X } from "lucide-react";
import { CONNECT_ITEMS, PLAN } from "@/lib/fixtures";
import type { Journey } from "@/lib/journey";
import { Button } from "../ui";

const ICON = { file: FileUp, account: Mail, setting: Globe2 };

function GmailConsent({ onAllow, onClose }: { onAllow: () => void; onClose: () => void }) {
  // Portalled to the body: the canvas's entrance animation would otherwise clip a fixed overlay.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-6" role="dialog" aria-modal="true" aria-labelledby="consent-title">
      <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-xl appear">
        <div className="flex items-start justify-between">
          <h2 id="consent-title" className="text-lg font-semibold">
            Connect Gmail to Loan Triage Desk
          </h2>
          <button onClick={onClose} aria-label="Close" className="rounded p-1 text-ink-3 hover:text-ink">
            <X size={16} />
          </button>
        </div>
        <p className="mt-2 text-sm text-ink-2">The app will be able to:</p>
        <ul className="mt-2 space-y-1.5 text-sm">
          <li className="flex gap-2">
            <Check size={15} className="mt-0.5 text-green" /> Send email as you, only after an officer confirms each send
          </li>
        </ul>
        <p className="mt-3 text-sm text-ink-2">It will not be able to:</p>
        <ul className="mt-2 space-y-1.5 text-sm text-ink-2">
          <li className="flex gap-2">
            <X size={15} className="mt-0.5 text-red" /> Read, search or delete your email
          </li>
          <li className="flex gap-2">
            <X size={15} className="mt-0.5 text-red" /> See the access token: it stays in Architect&apos;s vault
          </li>
        </ul>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onAllow}>
            Continue to Google
          </Button>
        </div>
        <p className="mt-3 text-[12px] text-ink-3">In this prototype the Google step is simulated.</p>
      </div>
    </div>,
    document.body,
  );
}

export function ConnectCanvas({
  j,
  onConnect,
  onDemo,
  onStart,
  started,
}: {
  j: Journey;
  onConnect: (id: string, value: string) => void;
  onDemo: (on: boolean) => void;
  onStart: () => void;
  started: boolean;
}) {
  const [consent, setConsent] = useState(false);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});
  const requiredDone = CONNECT_ITEMS.filter((i) => i.required).every((i) => j.connected[i.id]);
  const canStart = requiredDone || j.demoData;

  return (
    <div className="mx-auto max-w-[720px] px-4 py-6 sm:px-8 sm:py-8 appear">
      <p className="text-[13px] text-ink-3">Before anything is built</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight">Connect what the app needs</h2>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
        Real files and accounts now mean the first preview runs on your data, and your tests use your own cases. Nothing here is shared with the generated code; it gets references, not secrets.
      </p>

      <ul className="mt-6 divide-y divide-line rounded-lg border border-line bg-surface">
        {CONNECT_ITEMS.map((it) => {
          const Icon = ICON[it.kind];
          const value = j.connected[it.id];
          return (
            <li key={it.id} className="flex items-center gap-4 px-4 py-4">
              <Icon size={18} className="shrink-0 text-ink-2" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {it.label} {!it.required && <span className="font-normal text-ink-3">(recommended)</span>}
                </p>
                <p className="text-[13px] text-ink-2">{value ? value : it.detail}</p>
              </div>
              {value ? (
                <span className="flex items-center gap-1 text-[13px] font-medium text-green">
                  <Check size={14} /> {it.kind === "account" ? "Connected" : it.kind === "file" ? "Uploaded" : "Set"}
                </span>
              ) : it.kind === "file" ? (
                <>
                  <input
                    ref={(el) => {
                      inputs.current[it.id] = el;
                    }}
                    type="file"
                    accept="application/pdf"
                    multiple={it.id === "samples"}
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []);
                      if (files.length) onConnect(it.id, files.map((f) => f.name).join(", "));
                    }}
                  />
                  <Button size="sm" onClick={() => inputs.current[it.id]?.click()}>
                    Upload PDF{it.id === "samples" ? "s" : ""}
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={() => setConsent(true)}>
                  Connect
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-[12px] text-ink-3">Files stay in your browser in this prototype; only their names are recorded.</p>

      <label className="mt-6 flex items-start gap-3 rounded-lg border border-line bg-surface p-4">
        <input type="checkbox" checked={j.demoData} onChange={(e) => onDemo(e.target.checked)} className="mt-1 accent-[var(--blue)]" />
        <span>
          <span className="text-sm font-medium">Use demo data for now</span>
          <span className="block text-[13px] text-ink-2">
            The preview shows a &quot;Demo data&quot; banner, and this version can&apos;t be deployed to production until real files and accounts are connected.
          </span>
        </span>
      </label>

      <div className="mt-8 flex items-center justify-end gap-4 border-t border-line pt-6">
        <p className="text-right text-[13px] text-ink-3">
          Estimated ${PLAN.estimate.low}–{PLAN.estimate.high}, about {PLAN.estimate.minutesLow}–{PLAN.estimate.minutesHigh} minutes
        </p>
        <Button variant="primary" onClick={onStart} disabled={!canStart || started}>
          {started ? "Build started" : "Start building"}
        </Button>
      </div>

      {consent && (
        <GmailConsent
          onClose={() => setConsent(false)}
          onAllow={() => {
            setConsent(false);
            onConnect("gmail", "officer@kestrel-lending.example, send-only");
          }}
        />
      )}
    </div>
  );
}
