"use client";

import { getSupabase } from "./supabase";
import { describeFromPrompt, nameFromPrompt, slugify } from "./naming";
import { SAMPLE_PROMPT } from "./fixtures";

export type Stage = "plan" | "connect" | "build" | "test" | "ship" | "live";
export type Status = "draft" | "preview" | "in_review" | "live";

export type Project = {
  id: string;
  name: string;
  description: string;
  prompt: string;
  stage: Stage;
  status: Status;
  spendUsd: number;
  testsPassed: number;
  testsTotal: number;
  slug: string;
  orgId?: string;
  createdAt: string;
  updatedAt: string;
};

/** A workspace is an organisation. An FDE keeps their own, plus one per customer they build for. */
export type DeployTarget = "architect" | "customer_cloud";
export type Org = {
  id: string;
  name: string;
  approvalRequired: boolean;
  kind: "own" | "customer";
  deployTarget: DeployTarget;
  cloudAccount: string; // e.g. "AWS 4821-0093-1177, eu-west-2"; empty until connected
};
export type Role = "admin" | "builder" | "developer" | "approver";
export type Invite = { id: string; orgId: string; email: string; role: Role; status: "pending" | "accepted"; createdAt: string };
export type Blueprint = {
  id: string;
  name: string;
  description: string;
  prompt: string;
  answers: Record<string, string[]>;
  suggestedOn: string[];
  source: string; // "Loan Triage Desk, built for Kestrel Lending"
  createdAt: string;
};

type Row = {
  id: string;
  name: string;
  description: string;
  prompt: string;
  stage: Stage;
  status: Status;
  spend_usd: number | string;
  tests_passed: number;
  tests_total: number;
  slug: string;
  org_id: string;
  created_at: string;
  updated_at: string;
};

const fromRow = (r: Row): Project => ({
  id: r.id,
  name: r.name,
  description: r.description,
  prompt: r.prompt,
  stage: r.stage,
  status: r.status,
  spendUsd: Number(r.spend_usd),
  testsPassed: r.tests_passed,
  testsTotal: r.tests_total,
  slug: r.slug,
  orgId: r.org_id,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

/** Tell the rail and lists that projects changed. */
export function announceProjectsChanged() {
  window.dispatchEvent(new Event("alpha:projects"));
}

// ---------- Local demo store (no Supabase keys, or "explore without signing in") ----------

const LP = "alpha.projects";
const LO = "alpha.org"; // single organisation, before workspaces existed
const LOS = "alpha.orgs";
const LCUR = "alpha.org.current";
const LINV = "alpha.invites";
const LBP = "alpha.blueprints";

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function localRead(): Project[] {
  try {
    return JSON.parse(localStorage.getItem(LP) ?? "[]") as Project[];
  } catch {
    return [];
  }
}
function localWrite(list: Project[]) {
  localStorage.setItem(LP, JSON.stringify(list));
}

// ---------- Public API: one interface, two backends ----------

export function isDemo() {
  return Boolean(typeof window !== "undefined" && localStorage.getItem("alpha.demo-user")) || !getSupabase();
}

export async function listProjects(): Promise<Project[]> {
  const org = await getOrg();
  if (isDemo())
    return localRead()
      .filter((p) => (p.orgId ?? DEMO_ORG_ID) === org.id)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const sb = getSupabase()!;
  const { data, error } = await sb.from("projects").select("*").eq("org_id", org.id).order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as Row[]).map(fromRow);
}

export async function getProject(id: string): Promise<Project | null> {
  if (isDemo()) return localRead().find((p) => p.id === id) ?? null;
  const sb = getSupabase()!;
  const { data, error } = await sb.from("projects").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? fromRow(data as Row) : null;
}

export async function createProject(prompt: string, named?: string): Promise<Project> {
  // The scripted example keeps the name its fixtures use; anything else is named from the prompt.
  const name = named ?? (prompt.trim() === SAMPLE_PROMPT.trim() ? "Loan Triage Desk" : nameFromPrompt(prompt));
  const description = describeFromPrompt(prompt);
  const now = new Date().toISOString();
  const base = {
    name,
    description,
    prompt,
    stage: "plan" as Stage,
    status: "draft" as Status,
    spendUsd: 0,
    testsPassed: 0,
    testsTotal: 0,
    slug: `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`,
  };
  if (isDemo()) {
    const p: Project = { ...base, id: crypto.randomUUID(), orgId: (await getOrg()).id, createdAt: now, updatedAt: now };
    localWrite([p, ...localRead()]);
    announceProjectsChanged();
    return p;
  }
  const sb = getSupabase()!;
  const org = await getOrg();
  const { data, error } = await sb
    .from("projects")
    .insert({
      org_id: org.id,
      name: base.name,
      description: base.description,
      prompt: base.prompt,
      stage: base.stage,
      status: base.status,
      slug: base.slug,
    })
    .select("*")
    .single();
  if (error?.code === "42501") throw new Error("Your role in this workspace doesn't include building. Ask an admin for the builder role.");
  if (error) throw new Error(error.message);
  announceProjectsChanged();
  return fromRow(data as Row);
}

export async function updateProject(id: string, patch: Partial<Project>): Promise<void> {
  const now = new Date().toISOString();
  if (isDemo()) {
    localWrite(localRead().map((p) => (p.id === id ? { ...p, ...patch, updatedAt: now } : p)));
    announceProjectsChanged();
    return;
  }
  const row: Record<string, unknown> = { updated_at: now };
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.stage !== undefined) row.stage = patch.stage;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.spendUsd !== undefined) row.spend_usd = patch.spendUsd;
  if (patch.testsPassed !== undefined) row.tests_passed = patch.testsPassed;
  if (patch.testsTotal !== undefined) row.tests_total = patch.testsTotal;
  const { error } = await getSupabase()!.from("projects").update(row).eq("id", id);
  if (error) throw new Error(error.message);
  announceProjectsChanged();
}

export async function deleteProject(id: string): Promise<void> {
  if (isDemo()) {
    localWrite(localRead().filter((p) => p.id !== id));
    announceProjectsChanged();
    return;
  }
  const { data, error } = await getSupabase()!.from("projects").delete().eq("id", id).select("id");
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error("Only the person who created this project can delete it.");
  announceProjectsChanged();
}

// ---------- Workspaces ----------

export const DEMO_ORG_ID = "demo-org";
const ORG_COLS = "id, name, approval_required, kind, deploy_target, cloud_account";
type OrgRow = { id: string; name: string; approval_required: boolean; kind: Org["kind"]; deploy_target: DeployTarget; cloud_account: string };
const orgFromRow = (r: OrgRow): Org => ({
  id: r.id,
  name: r.name,
  approvalRequired: r.approval_required,
  kind: r.kind ?? "own",
  deployTarget: r.deploy_target ?? "architect",
  cloudAccount: r.cloud_account ?? "",
});

function demoOrgs(): Org[] {
  let list = readJSON<Org[] | null>(LOS, null);
  if (!list) {
    const old = readJSON<Partial<Org> | null>(LO, null);
    list = [{ id: DEMO_ORG_ID, name: "Your workspace", approvalRequired: false, kind: "own", deployTarget: "architect", cloudAccount: "", ...(old ?? {}) }];
    if (list[0].name === "Demo organisation") list[0].name = "Your workspace";
    localStorage.setItem(LOS, JSON.stringify(list));
  }
  return list;
}

// Claim pending invitations once per sign-in, before the first workspace list, so a new workspace shows straight away.
let accepting: Promise<void> | null = null;
export function resetInvitationCheck() {
  accepting = null;
}

export async function listOrgs(): Promise<Org[]> {
  if (isDemo()) return demoOrgs();
  const sb = getSupabase()!;
  accepting ??= Promise.resolve(sb.rpc("accept_invitations")).then(
    () => {},
    () => {},
  );
  await accepting;
  const { data, error } = await sb.from("organisations").select(ORG_COLS).order("created_at");
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error("No workspace found for this account. Run supabase/schema.sql, then sign in again.");
  return (data as OrgRow[]).map(orgFromRow);
}

/** The workspace this browser is working in. */
export async function getOrg(): Promise<Org> {
  const orgs = await listOrgs();
  const cur = typeof window !== "undefined" ? localStorage.getItem(LCUR) : null;
  return orgs.find((o) => o.id === cur) ?? orgs[0];
}

export function announceOrgChanged() {
  window.dispatchEvent(new Event("alpha:org"));
  announceProjectsChanged();
}

export function switchOrg(id: string) {
  localStorage.setItem(LCUR, id);
  announceOrgChanged();
}

export async function createWorkspace(name: string, kind: Org["kind"]): Promise<Org> {
  let org: Org;
  if (isDemo()) {
    org = { id: crypto.randomUUID(), name, approvalRequired: kind === "customer", kind, deployTarget: "architect", cloudAccount: "" };
    localStorage.setItem(LOS, JSON.stringify([...demoOrgs(), org]));
  } else {
    const { data, error } = await getSupabase()!.rpc("create_workspace", { p_name: name, p_kind: kind });
    if (error) throw new Error(error.message);
    org = (await listOrgs()).find((o) => o.id === data)!;
  }
  switchOrg(org.id);
  return org;
}

export async function updateOrg(patch: Partial<Org>): Promise<void> {
  const o = await getOrg();
  if (isDemo()) {
    localStorage.setItem(LOS, JSON.stringify(demoOrgs().map((x) => (x.id === o.id ? { ...x, ...patch } : x))));
    announceOrgChanged();
    return;
  }
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.approvalRequired !== undefined) row.approval_required = patch.approvalRequired;
  if (patch.deployTarget !== undefined) row.deploy_target = patch.deployTarget;
  if (patch.cloudAccount !== undefined) row.cloud_account = patch.cloudAccount;
  if (!Object.keys(row).length) return;
  const { data, error } = await getSupabase()!.from("organisations").update(row).eq("id", o.id).select("id");
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error("Only an admin of this workspace can change its settings.");
  announceOrgChanged();
}

// ---------- Invitations: pending until that email signs in, then a membership with the role's permissions ----------

export async function listInvites(): Promise<Invite[]> {
  const o = await getOrg();
  if (isDemo()) return readJSON<Invite[]>(LINV, []).filter((i) => i.orgId === o.id);
  const { data, error } = await getSupabase()!.from("invitations").select("id, org_id, email, role, status, created_at").eq("org_id", o.id).order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({ id: r.id, orgId: r.org_id, email: r.email, role: r.role, status: r.status, createdAt: r.created_at }));
}

export async function invite(email: string, role: Role): Promise<Invite> {
  const o = await getOrg();
  const clean = email.trim().toLowerCase();
  if (isDemo()) {
    const inv: Invite = { id: crypto.randomUUID(), orgId: o.id, email: clean, role, status: "pending", createdAt: new Date().toISOString() };
    localStorage.setItem(LINV, JSON.stringify([...readJSON<Invite[]>(LINV, []), inv]));
    return inv;
  }
  const { data, error } = await getSupabase()!.from("invitations").insert({ org_id: o.id, email: clean, role }).select("id, created_at").single();
  if (error?.code === "23505") throw new Error("That email is already invited to this workspace.");
  if (error?.code === "42501") throw new Error("Only an admin of this workspace can invite people.");
  if (error) throw new Error(error.message);
  return { id: data.id, orgId: o.id, email: clean, role, status: "pending", createdAt: data.created_at };
}

// ---------- Blueprints: an FDE's own library, reusable in any workspace ----------

export async function listBlueprints(): Promise<Blueprint[]> {
  if (isDemo()) return readJSON<Blueprint[]>(LBP, []);
  const { data, error } = await getSupabase()!.from("blueprints").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    prompt: r.prompt,
    answers: r.answers ?? {},
    suggestedOn: r.suggested_on ?? [],
    source: r.source,
    createdAt: r.created_at,
  }));
}

export async function saveBlueprint(b: Omit<Blueprint, "id" | "createdAt">): Promise<Blueprint> {
  if (isDemo()) {
    const bp: Blueprint = { ...b, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    localStorage.setItem(LBP, JSON.stringify([bp, ...readJSON<Blueprint[]>(LBP, [])]));
    return bp;
  }
  const { data, error } = await getSupabase()!
    .from("blueprints")
    .insert({ name: b.name, description: b.description, prompt: b.prompt, answers: b.answers, suggested_on: b.suggestedOn, source: b.source })
    .select("id, created_at")
    .single();
  if (error) throw new Error(error.message);
  return { ...b, id: data.id, createdAt: data.created_at };
}

// ---------- Journey state: local in demo mode, on the project row otherwise ----------

const JK = (id: string) => `alpha.journey.${id}`;

export async function loadJourney(id: string): Promise<Record<string, unknown> | null> {
  if (isDemo()) {
    try {
      const raw = localStorage.getItem(JK(id));
      return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
  const { data, error } = await getSupabase()!.from("projects").select("journey").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  const j = (data?.journey ?? null) as Record<string, unknown> | null;
  return j && Object.keys(j).length ? j : null;
}

export async function saveJourney(id: string, journey: unknown): Promise<void> {
  if (isDemo()) {
    try {
      localStorage.setItem(JK(id), JSON.stringify(journey));
    } catch {}
    return;
  }
  const { error } = await getSupabase()!.from("projects").update({ journey }).eq("id", id);
  if (error) throw new Error(error.message);
}
