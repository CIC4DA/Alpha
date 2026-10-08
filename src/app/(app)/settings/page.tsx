"use client";

import { useEffect, useState } from "react";
import { getOrg, updateOrg, type Org } from "@/lib/store";
import { useAuth } from "@/lib/auth";

const PERMS = [
  { id: "build", label: "Build", detail: "Create projects and change them through chat" },
  { id: "edit_code", label: "Edit code", detail: "Developer view, GitHub sync, coding agents over MCP" },
  { id: "approve", label: "Approve", detail: "Sign off a version before it goes live" },
  { id: "deploy", label: "Deploy", detail: "Promote an approved version to production" },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const [org, setOrg] = useState<Org | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getOrg().then(setOrg).catch((e) => setError(e.message));
  }, []);

  const toggle = async () => {
    if (!org) return;
    const next = { ...org, approvalRequired: !org.approvalRequired };
    setOrg(next);
    try {
      await updateOrg({ approvalRequired: next.approvalRequired });
      setSaved(true);
      setTimeout(() => setSaved(false), 1600);
    } catch (e) {
      setError((e as Error).message);
      setOrg(org);
    }
  };

  return (
    <div className="mx-auto max-w-[760px] px-8 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Organisation settings</h1>
      <p className="mt-1 text-sm text-ink-2">{org?.name ?? "Loading"}</p>
      {error && <p className="mt-4 text-sm text-red">{error}</p>}

      <section className="mt-8 rounded-lg border border-line bg-surface p-5">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="font-semibold">Require a separate approver</h2>
            <p className="mt-1 max-w-[30rem] text-sm leading-relaxed text-ink-2">
              When on, a version can only go live after someone other than its builder approves it. When off, the builder runs the same checklist as a self-check and deploys.
            </p>
          </div>
          <button
            role="switch"
            aria-checked={org?.approvalRequired ?? false}
            onClick={toggle}
            disabled={!org}
            className={`relative mt-1 h-6 w-11 shrink-0 rounded-full transition-colors ${org?.approvalRequired ? "bg-blue" : "bg-line-strong"}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${org?.approvalRequired ? "translate-x-[22px]" : "translate-x-0.5"}`} />
            <span className="sr-only">Require a separate approver</span>
          </button>
        </div>
        {saved && <p className="mt-3 text-[13px] text-green">Saved</p>}
      </section>

      <section className="mt-6 rounded-lg border border-line bg-surface p-5">
        <h2 className="font-semibold">Roles</h2>
        <p className="mt-1 text-sm text-ink-2">Until you assign roles, everyone in the organisation can do all four.</p>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[13px] text-ink-3">
              <th className="py-2 font-medium">Member</th>
              {PERMS.map((p) => (
                <th key={p.id} className="py-2 text-center font-medium" title={p.detail}>
                  {p.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-3">
                <p className="font-medium">{user?.name}</p>
                <p className="text-[12px] text-ink-3">{user?.email} (admin)</p>
              </td>
              {PERMS.map((p) => (
                <td key={p.id} className="py-3 text-center">
                  <input type="checkbox" checked readOnly aria-label={`${p.label} for ${user?.name}`} className="accent-[var(--blue)]" />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
        <p className="mt-3 text-[12px] text-ink-3">Inviting members and SSO with your identity provider are part of phase 2 of this prototype.</p>
      </section>
    </div>
  );
}
