"use client";

import { useEffect, useState } from "react";
import { Cloud, Server, Check, Loader2, Mail } from "lucide-react";
import { getOrg, invite, listInvites, updateOrg, isDemo, type Invite, type Org, type Role } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui";

const ROLES: { id: Role; label: string; can: string }[] = [
  { id: "builder", label: "Builder", can: "Create projects and change them through chat" },
  { id: "developer", label: "Developer", can: "Everything a builder can, plus the code: Developer view, GitHub sync, coding agents over MCP" },
  { id: "approver", label: "Approver", can: "Sign off a version and deploy it" },
  { id: "admin", label: "Admin", can: "All of the above, plus members and these settings" },
];

function Switch({ on, onClick, label, disabled }: { on: boolean; onClick: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onClick}
      disabled={disabled}
      className={`relative mt-1 h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-blue" : "bg-line-strong"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${on ? "translate-x-[22px]" : "translate-x-0.5"}`} />
      <span className="sr-only">{label}</span>
    </button>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [org, setOrg] = useState<Org | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("approver");
  const [inviting, setInviting] = useState(false);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    const load = () => {
      getOrg().then(setOrg).catch((e) => setError(e.message));
      listInvites().then(setInvites).catch(() => {});
    };
    load();
    window.addEventListener("alpha:org", load);
    return () => window.removeEventListener("alpha:org", load);
  }, []);

  const save = async (patch: Partial<Org>) => {
    if (!org) return;
    const prev = org;
    setOrg({ ...org, ...patch });
    try {
      await updateOrg(patch);
    } catch (e) {
      setError((e as Error).message);
      setOrg(prev);
    }
  };

  const send = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Enter a full email address.");
    setInviting(true);
    setError(null);
    try {
      const inv = await invite(email, role);
      setInvites((l) => [...l, inv]);
      setEmail("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setInviting(false);
    }
  };

  const customer = org?.kind === "customer";

  return (
    <div className="mx-auto max-w-[760px] px-4 py-8 sm:px-8 sm:py-12">
      <p className="text-[13px] text-ink-3">{customer ? "Customer workspace" : "Your workspace"}</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">{org?.name ?? "Workspace settings"}</h1>
      <p className="mt-1 text-sm text-ink-2">
        {customer
          ? "Everything for this customer lives here: their projects, their people, their approval rule and where their apps run."
          : "Settings for the workspace you're in. Each customer you build for can have its own."}
      </p>
      {error && <p className="mt-4 text-sm text-red">{error}</p>}

      <section className="mt-8 rounded-lg border border-line bg-surface p-5">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="font-semibold">Require a separate approver</h2>
            <p className="mt-1 max-w-[30rem] text-sm leading-relaxed text-ink-2">
              When on, a version can only go live after someone other than its builder approves it. When off, the builder runs the same checklist as a self-check and deploys.
            </p>
          </div>
          <Switch on={org?.approvalRequired ?? false} onClick={() => save({ approvalRequired: !org?.approvalRequired })} label="Require a separate approver" disabled={!org} />
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-line bg-surface p-5">
        <h2 className="font-semibold">Where apps run</h2>
        <p className="mt-1 text-sm text-ink-2">Every deploy from this workspace goes here. Changing it applies from the next deploy.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Where apps run">
          {[
            { id: "architect" as const, icon: Cloud, title: "Architect cloud", detail: "Hosted and run by Architect. Nothing to set up." },
            { id: "customer_cloud" as const, icon: Server, title: customer ? `${org?.name}'s cloud account` : "Your own cloud account", detail: "Apps and agents run in an isolated VPC in that account; data stays there." },
          ].map((t) => (
            <button
              key={t.id}
              role="radio"
              aria-checked={org?.deployTarget === t.id}
              onClick={() => save({ deployTarget: t.id })}
              className={`rounded-lg border p-4 text-left ${org?.deployTarget === t.id ? "border-blue bg-blue-wash/60" : "border-line-strong hover:border-ink-3"}`}
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <t.icon size={15} className="text-blue" /> {t.title}
              </span>
              <span className="mt-1 block text-[13px] leading-snug text-ink-2">{t.detail}</span>
            </button>
          ))}
        </div>
        {org?.deployTarget === "customer_cloud" && (
          <div className="mt-4 flex items-center justify-between gap-4 rounded-md border border-line bg-paper px-4 py-3">
            {org.cloudAccount ? (
              <p className="flex items-center gap-2 text-sm">
                <Check size={15} className="text-green" /> Connected: {org.cloudAccount}
              </p>
            ) : (
              <p className="text-sm text-ink-2">Connect the AWS account. Architect gets a deploy role scoped to one VPC; it can&apos;t read anything else.</p>
            )}
            {!org.cloudAccount && (
              <Button
                size="sm"
                disabled={linking}
                onClick={() => {
                  setLinking(true);
                  setTimeout(() => {
                    save({ cloudAccount: "AWS account 4821-0093-1177, eu-west-2" });
                    setLinking(false);
                  }, 1400);
                }}
              >
                {linking ? <Loader2 size={14} className="animate-spin" /> : null} {linking ? "Connecting" : "Connect AWS account"}
              </Button>
            )}
          </div>
        )}
        {org?.deployTarget === "customer_cloud" && <p className="mt-2 text-[12px] text-ink-3">The AWS connection is simulated in this prototype.</p>}
      </section>

      <section className="mt-6 rounded-lg border border-line bg-surface p-5">
        <h2 className="font-semibold">Members</h2>
        <p className="mt-1 text-sm text-ink-2">
          {customer ? "Invite the customer's people as you hand over: their builder for future changes, their approver for sign-off." : "Invite people by role. Until you do, everyone here can do everything."}
        </p>
        <ul className="mt-4 divide-y divide-line rounded-md border border-line">
          <li className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
            <span>
              <span className="font-medium">{user?.name}</span> <span className="text-ink-3">{user?.email}</span>
            </span>
            <span className="text-[13px] text-ink-2">Admin</span>
          </li>
          {invites.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <Mail size={14} className="shrink-0 text-ink-3" /> <span className="truncate">{i.email}</span>
              </span>
              <span className="shrink-0 text-[13px] text-ink-2">
                {ROLES.find((r) => r.id === i.role)?.label}, <span className={i.status === "accepted" ? "text-green" : "text-amber"}>{i.status === "accepted" ? "joined" : "invited"}</span>
              </span>
            </li>
          ))}
        </ul>
        <form
          className="mt-4 flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <label htmlFor="inv-email" className="sr-only">
            Email
          </label>
          <input
            id="inv-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@customer.com"
            className="h-10 min-w-0 flex-1 rounded-md border border-line-strong px-3 text-sm outline-none focus:border-blue"
          />
          <label htmlFor="inv-role" className="sr-only">
            Role
          </label>
          <select id="inv-role" value={role} onChange={(e) => setRole(e.target.value as Role)} className="h-10 rounded-md border border-line-strong bg-surface px-2 text-sm">
            {ROLES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
          <Button type="submit" variant="primary" disabled={inviting}>
            {inviting ? "Inviting" : "Invite"}
          </Button>
        </form>
        <p className="mt-2 text-[12px] text-ink-3">
          {isDemo() ? "Demo mode records the invite here; no email is sent." : "They join with this role the first time they sign in with that email. No email is sent from the prototype; share the link yourself."}
        </p>

        <dl className="mt-5 grid gap-x-6 gap-y-2 text-[13px] sm:grid-cols-[110px_1fr]">
          {ROLES.map((r) => (
            <div key={r.id} className="contents">
              <dt className="font-medium">{r.label}</dt>
              <dd className="text-ink-2">{r.can}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
