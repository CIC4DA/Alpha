"use client";

import { useState } from "react";
import { Loader2, MousePointer2 } from "lucide-react";

// The generated loan-triage app, drawn small. It has its own look, separate from Architect's.
const SCREENS = ["Sign in", "Applications", "Review", "Decision"] as const;

const ROWS = [
  { ref: "KCL-0101", name: "Tom Hartley", firm: "Hartley Joinery Ltd", amount: "£30,000", status: "Sent", decision: "Approve", tone: "ok" },
  { ref: "KCL-0102", name: "Danielle Cole", firm: "Cole Ventures Ltd", amount: "£40,000", status: "Draft ready", decision: "Decline", tone: "bad" },
  { ref: "KCL-0103", name: "Samira Okoye", firm: "Brightwell Bakery Ltd", amount: "£65,000", status: "Needs officer", decision: "Manual review", tone: "warn" },
] as const;

const TONE = { ok: "bg-[#e3f1ea] text-[#17643f]", bad: "bg-[#f8e4e1] text-[#97301f]", warn: "bg-[#f8edd5] text-[#875207]" };

function SignIn() {
  return (
    <div className="grid h-full grid-cols-2">
      <div className="flex flex-col justify-end bg-[#13343b] p-6 text-white">
        <p className="text-[11px] text-[#9cc9c6]">Kestrel Community Lending</p>
        <p className="mt-2 font-serif text-2xl leading-tight">Every decision, with its clause in view.</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-[220px] text-[12px]">
          <p className="text-base font-semibold">Officer sign in</p>
          <p className="mt-1 text-[#5d6b70]">Invitation only.</p>
          <div className="mt-3 h-8 rounded border border-[#cfd8da] px-2 leading-8 text-[#8a979b]">work email</div>
          <div className="mt-2 h-8 rounded bg-[#1d5c66] text-center leading-8 text-white">Send sign-in link</div>
        </div>
      </div>
    </div>
  );
}

function Applications() {
  return (
    <div className="p-5 text-[12px]">
      <div className="flex items-baseline justify-between">
        <p className="text-base font-semibold">Applications</p>
        <span className="rounded bg-[#1d5c66] px-2.5 py-1 text-white">Upload application</span>
      </div>
      <table className="mt-4 w-full">
        <thead className="text-left text-[#7b878b]">
          <tr>
            <th className="pb-2 font-medium">Applicant</th>
            <th className="pb-2 font-medium">Amount</th>
            <th className="pb-2 font-medium">Status</th>
            <th className="pb-2 font-medium">Policy</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r.ref} className="border-t border-[#e3e9ea]">
              <td className="py-2.5">
                <p className="font-medium">{r.firm}</p>
                <p className="text-[#7b878b]">
                  {r.ref}, {r.name}
                </p>
              </td>
              <td>{r.amount}</td>
              <td>{r.status}</td>
              <td>
                <span className={`rounded px-1.5 py-0.5 ${TONE[r.tone]}`}>{r.decision}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Review() {
  return (
    <div className="grid h-full grid-cols-[1fr_1.1fr] gap-4 p-5 text-[12px]">
      <div className="rounded bg-[#e9eeef] p-3">
        <p className="text-[11px] text-[#5d6b70]">app-3-brightwell-bakery.pdf</p>
        <div className="mt-2 space-y-1.5 rounded bg-white p-3">
          <div className="h-1.5 w-3/4 rounded bg-[#dbe2e4]" />
          <div className="h-1.5 w-full rounded bg-[#dbe2e4]" />
          <div className="rounded border border-[#e7c56b] bg-[#fdf3d6] p-1.5">Section C: £180,000</div>
          <div className="h-1.5 w-5/6 rounded bg-[#dbe2e4]" />
          <div className="rounded border border-[#e7c56b] bg-[#fdf3d6] p-1.5">Section D: £140,000</div>
        </div>
      </div>
      <div>
        <p className="text-base font-semibold">Check the facts</p>
        <div className="mt-2 rounded border border-[#e7c56b] bg-[#fdf3d6] p-2 text-[#6e4c06]">
          Two income figures don&apos;t match. Enter the verified one.
        </div>
        {[
          ["Applicant", "Samira Okoye", "Page 1"],
          ["Amount", "£65,000", "Page 1"],
          ["Annual income", "", "Sections C and D"],
          ["Purpose", "Refurbish premises, second deck oven", "Page 1"],
        ].map(([k, v, src]) => (
          <div key={k} className="mt-2">
            <p className="text-[#5d6b70]">{k}</p>
            <div className={`mt-0.5 h-7 rounded border px-2 leading-7 ${v ? "border-[#cfd8da]" : "border-[#d8a53a] bg-[#fffaf0]"}`}>{v}</div>
            <p className="mt-0.5 text-[10px] text-[#8a979b]">{src}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Decision() {
  return (
    <div className="p-5 text-[12px]">
      <p className="text-base font-semibold">Decision: Brightwell Bakery Ltd</p>
      <div className="mt-3 rounded border-l-4 border-[#c7951c] bg-[#fbf3df] p-3">
        <p className="text-[11px] text-[#7a5a12]">Recommendation, for the officer to decide</p>
        <p className="mt-1 text-lg font-semibold text-[#5c4208]">Manual review</p>
        <p className="mt-1 text-[#5d4a1c]">Verified income £140,000 is 2.15 times the loan: below the 2.5 times needed, above 1.5 times.</p>
      </div>
      <div className="mt-2 rounded border border-[#dbe2e4] p-2.5">
        <p className="font-medium">Clause 3.3, page 1</p>
        <p className="mt-0.5 text-[#5d6b70]">&ldquo;Where verified income is below the multiple required by 3.1 or 3.2 but at least 1.5 times the requested principal, the application must be referred for Manual Review.&rdquo;</p>
      </div>
      <div className="mt-3 flex gap-2">
        <span className="rounded bg-[#1d5c66] px-2.5 py-1 text-white">Record decision</span>
        <span className="rounded border border-[#cfd8da] px-2.5 py-1">Draft email</span>
      </div>
    </div>
  );
}

const RENDER = [SignIn, Applications, Review, Decision];

export function AppPreview({ revealed = 4, demo = false, url, building = false }: { revealed?: number; demo?: boolean; url?: string; building?: boolean }) {
  const [screen, setScreen] = useState(1);
  const shown = Math.min(screen, Math.max(revealed - 1, 0));
  const Screen = RENDER[shown];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-line-strong bg-white font-sans text-[#1c2b2f] shadow-sm">
      <div className="flex items-center gap-2 border-b border-[#e3e9ea] bg-[#f4f6f6] px-3 py-2">
        <span className="flex gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-[#d9dfe1]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#d9dfe1]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#d9dfe1]" />
        </span>
        <span className="ml-2 truncate rounded bg-white px-2 py-0.5 text-[11px] text-[#5d6b70]">{url ?? "preview--loan-triage-desk.architect.dev"}</span>
      </div>
      {demo && <div className="bg-[#fbf0dc] px-3 py-1 text-center text-[11px] font-medium text-[#8a5a0b]">Demo data: connect real files and accounts before going live</div>}
      <div className="flex gap-1 border-b border-[#e3e9ea] px-3 pt-2 text-[12px]" role="tablist" aria-label="App screens">
        {SCREENS.map((s, i) => (
          <button
            key={s}
            role="tab"
            aria-selected={shown === i}
            disabled={i >= revealed}
            onClick={() => setScreen(i)}
            className={`-mb-px border-b-2 px-2.5 py-1.5 ${shown === i ? "border-[#1d5c66] font-medium" : "border-transparent text-[#7b878b]"} disabled:text-[#c2cacc]`}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="relative min-h-[320px] flex-1 overflow-auto">
        {revealed === 0 ? (
          <div className="flex h-full min-h-[320px] items-center justify-center gap-2 text-[13px] text-[#7b878b]">
            {building ? <Loader2 size={15} className="animate-spin" /> : null} Screens appear here as they&apos;re built
          </div>
        ) : (
          <div key={shown} className="appear h-full">
            <Screen />
          </div>
        )}
        {revealed > 0 && (
          <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full border border-blue/40 bg-surface px-2.5 py-1 text-[11px] text-blue-ink">
            <MousePointer2 size={12} /> Select to edit
          </span>
        )}
      </div>
    </div>
  );
}
