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
  createdAt: string;
  updatedAt: string;
};

export type Org = { id: string; name: string; approvalRequired: boolean };

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
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

/** Tell the rail and lists that projects changed. */
export function announceProjectsChanged() {
  window.dispatchEvent(new Event("alpha:projects"));
}

// ---------- Local demo store (no Supabase keys, or "explore without signing in") ----------

const LP = "alpha.projects";
const LO = "alpha.org";

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
  if (isDemo()) return localRead().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const sb = getSupabase()!;
  const { data, error } = await sb.from("projects").select("*").order("updated_at", { ascending: false });
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

export async function createProject(prompt: string): Promise<Project> {
  // The scripted example keeps the name its fixtures use; anything else is named from the prompt.
  const name = prompt.trim() === SAMPLE_PROMPT.trim() ? "Loan Triage Desk" : nameFromPrompt(prompt);
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
    const p: Project = { ...base, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
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
  const { error } = await getSupabase()!.from("projects").delete().eq("id", id);
  if (error) throw new Error(error.message);
  announceProjectsChanged();
}

export async function getOrg(): Promise<Org> {
  if (isDemo()) {
    try {
      const o = JSON.parse(localStorage.getItem(LO) ?? "null") as Org | null;
      if (o) return o;
    } catch {}
    const o: Org = { id: "demo-org", name: "Demo organisation", approvalRequired: false };
    localStorage.setItem(LO, JSON.stringify(o));
    return o;
  }
  const sb = getSupabase()!;
  const { data, error } = await sb.from("organisations").select("id, name, approval_required").limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("No organisation found for this account. Run supabase/schema.sql, then sign in again.");
  return { id: data.id, name: data.name, approvalRequired: data.approval_required };
}

export async function updateOrg(patch: Partial<Org>): Promise<void> {
  if (isDemo()) {
    const o = await getOrg();
    localStorage.setItem(LO, JSON.stringify({ ...o, ...patch }));
    return;
  }
  const o = await getOrg();
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.approvalRequired !== undefined) row.approval_required = patch.approvalRequired;
  const { error } = await getSupabase()!.from("organisations").update(row).eq("id", o.id);
  if (error) throw new Error(error.message);
}
