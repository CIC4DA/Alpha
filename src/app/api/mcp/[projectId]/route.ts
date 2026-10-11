import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { BUILD_STEPS } from "@/lib/fixtures";
import { AGENT_IDS, ENV_NAMES, agentRules, commits, envs, goldenResults, projectFiles, rulesFile, rulesPath, sha, type AgentKey, type DevJourney, type EnvName } from "@/lib/devkit";

/**
 * Architect's MCP server for one project, over Streamable HTTP (JSON responses, no session).
 * Sign-in is the person's own Architect token, so row-level security gives a coding agent exactly the access the
 * person has in the browser: no more. Every change it makes is a version, shown in the project's chat.
 */

type Rpc = { jsonrpc: "2.0"; id?: string | number | null; method: string; params?: Record<string, unknown> };
type Journey = DevJourney & Record<string, unknown> & { version: number; chat: NonNullable<DevJourney["chat"]> };
type Ctx = { sb: SupabaseClient; userId: string; projectId: string };

const TOOLS = [
  { name: "get_project", description: "The project's name, stage, status, current version, test results and recent activity.", inputSchema: { type: "object", properties: {} } },
  { name: "list_files", description: "Every file in the project, marking ones edited since the first build.", inputSchema: { type: "object", properties: {} } },
  { name: "read_file", description: "Read one file.", inputSchema: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } },
  {
    name: "write_file",
    description: "Create or replace a file. Saves a new version; the golden tests run on it and it ships only through review.",
    inputSchema: { type: "object", properties: { path: { type: "string" }, content: { type: "string" }, message: { type: "string", description: "Commit message" } }, required: ["path", "content"] },
  },
  { name: "get_agent", description: "An agent's rules and model. Agents: extraction, policy, drafting.", inputSchema: { type: "object", properties: { agent: { type: "string", enum: AGENT_IDS } }, required: ["agent"] } },
  {
    name: "update_agent",
    description: "Replace an agent's rules and/or switch its model (Claude, GPT, Gemini, Llama). Saves a new version.",
    inputSchema: { type: "object", properties: { agent: { type: "string", enum: AGENT_IDS }, rules: { type: "array", items: { type: "string" } }, model: { type: "string" } }, required: ["agent"] },
  },
  { name: "run_golden_tests", description: "Run the golden tests on the current version: outcome and cited clauses per case.", inputSchema: { type: "object", properties: {} } },
  { name: "get_env", description: "Settings for one environment. Secret values are never returned.", inputSchema: { type: "object", properties: { env: { type: "string", enum: ENV_NAMES } }, required: ["env"] } },
  {
    name: "set_env",
    description: "Add or change a setting in one environment. A secret is stored as a vault reference; its value is not kept in the project.",
    inputSchema: { type: "object", properties: { env: { type: "string", enum: ENV_NAMES }, key: { type: "string" }, value: { type: "string" }, secret: { type: "boolean" } }, required: ["env", "key", "value"] },
  },
  { name: "request_review", description: "Ask the workspace's approver to review the current version. Deploying stays in Architect's Ship stage.", inputSchema: { type: "object", properties: {} } },
];

const text = (t: string, isError = false) => ({ content: [{ type: "text", text: t }], ...(isError ? { isError: true } : {}) });

async function load(c: Ctx) {
  const { data, error } = await c.sb.from("projects").select("id, name, stage, status, journey").eq("id", c.projectId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("This project doesn't exist, or your account can't open it.");
  const j = { version: 1, chat: [], ...(data.journey ?? {}) } as Journey;
  return { project: data as { id: string; name: string; stage: string; status: string }, j };
}

async function save(c: Ctx, j: Journey) {
  const { data, error } = await c.sb.from("projects").update({ journey: j, updated_at: new Date().toISOString() }).eq("id", c.projectId).select("id");
  if (error?.code === "42501") throw new Error("Your role in this workspace can't change this project.");
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error("Your role in this workspace can't change this project.");
}

/** A change from the coding agent: a new version once the app is built, with a commit card in chat. */
function change(j: Journey, message: string, what: string): Journey {
  const built = (j.buildDone ?? 0) >= BUILD_STEPS.length;
  const version = built ? j.version + 1 : j.version;
  const r = goldenResults(j);
  const tests = !built ? "It's part of the first build." : r ? `Golden tests: ${r.passed} of ${r.total} checks pass.` : "The golden tests run once sample files are added.";
  return {
    ...j,
    version,
    currentSha: undefined,
    chat: [...j.chat, { from: "architect", text: `From your coding agent, over MCP: ${what}${built ? ` as version ${version}` : ""}. ${tests}`, at: new Date().toISOString(), ...(built ? { commit: { sha: sha(), message } } : {}) }],
  };
}

async function call(c: Ctx, name: string, a: Record<string, unknown>) {
  const { project, j } = await load(c);
  const files = projectFiles(j);
  switch (name) {
    case "get_project": {
      const r = goldenResults(j);
      return text(
        JSON.stringify(
          {
            name: project.name,
            stage: project.stage,
            status: project.status,
            version: j.version,
            review: j.review ?? "none",
            golden_tests: r ? `${r.passed} of ${r.total} checks pass` : "not run yet",
            recent_versions: commits(j).slice(0, 5),
            recent_activity: j.chat.slice(-5).map((m) => m.text),
          },
          null,
          2,
        ),
      );
    }
    case "list_files":
      return text(files.map((f) => `${f.path}${f.added ? "  (new)" : f.edited ? "  (edited)" : ""}`).join("\n"));
    case "read_file": {
      const f = files.find((x) => x.path === a.path);
      return f ? text(f.body) : text(`No file at ${a.path}. Use list_files.`, true);
    }
    case "write_file": {
      const path = String(a.path ?? "").replace(/^\/+/, "");
      if (!path || typeof a.content !== "string") return text("Send a path and the file's content.", true);
      const existed = files.some((f) => f.path === path);
      const next = change({ ...j, fileEdits: { ...(j.fileEdits ?? {}), [path]: a.content } }, String(a.message || `${existed ? "Edit" : "Add"} ${path}`), `${existed ? "saved" : "added"} ${path}`);
      await save(c, next);
      return text(`Saved ${path}. Project is on version ${next.version}.`);
    }
    case "get_agent": {
      const agent = a.agent as AgentKey;
      if (!AGENT_IDS.includes(agent)) return text("Agents: extraction, policy, drafting.", true);
      const models = (j.models ?? {}) as Record<string, string>;
      return text(JSON.stringify({ agent, model: models[agent] ?? "Recommended for this agent", rules: agentRules(j, agent), rules_file: rulesPath(agent) }, null, 2));
    }
    case "update_agent": {
      const agent = a.agent as AgentKey;
      if (!AGENT_IDS.includes(agent)) return text("Agents: extraction, policy, drafting.", true);
      const rules = Array.isArray(a.rules) ? (a.rules as unknown[]).map(String).filter(Boolean) : null;
      const model = typeof a.model === "string" && a.model.trim() ? a.model.trim() : null;
      if (!rules && !model) return text("Send rules, a model, or both.", true);
      let next: Journey = { ...j };
      if (rules) next.fileEdits = { ...(j.fileEdits ?? {}), [rulesPath(agent)]: rulesFile(rules) };
      if (model) next.models = { ...((j.models as Record<string, string>) ?? {}), [agent]: model };
      const what = [rules && `${rules.length} rules`, model && `model ${model}`].filter(Boolean).join(" and ");
      next = change(next, `${agent} agent: ${what}`, `updated the ${agent} agent (${what})`);
      await save(c, next);
      return text(`Updated the ${agent} agent: ${what}. Project is on version ${next.version}.`);
    }
    case "run_golden_tests": {
      const r = goldenResults(j);
      if (!r) return text("No sample files yet: add them in Architect's Test stage, then run the tests.", true);
      return text([...r.cases.map((x) => `${x.pass ? "PASS" : "FAIL"}  ${x.title}: ${x.outcome}, cites ${x.cited.join(", ")}${x.pass ? "" : `\n      ${x.note}`}`), `${r.passed} of ${r.total} checks pass`].join("\n"));
    }
    case "get_env": {
      const env = a.env as EnvName;
      if (!ENV_NAMES.includes(env)) return text("Environments: preview, staging, production.", true);
      return text(envs(j)[env].map((v) => `${v.key}=${v.secret ? "<secret reference>" : v.value}`).join("\n"));
    }
    case "set_env": {
      const env = a.env as EnvName;
      if (!ENV_NAMES.includes(env)) return text("Environments: preview, staging, production.", true);
      const key = String(a.key ?? "").toUpperCase().replace(/[^A-Z0-9_]/g, "_");
      if (!key) return text("Send a key.", true);
      const secret = Boolean(a.secret);
      const all = envs(j);
      const value = secret ? "Reference set in the vault" : String(a.value ?? "");
      const list = all[env].some((v) => v.key === key) ? all[env].map((v) => (v.key === key ? { key, value, secret } : v)) : [...all[env], { key, value, secret }];
      await save(c, { ...j, envs: { ...all, [env]: list }, chat: [...j.chat, { from: "architect", text: `From your coding agent, over MCP: set ${key} in ${env}${secret ? " (secret, stored in the vault)" : ""}.`, at: new Date().toISOString() }] });
      return text(`Set ${key} in ${env}.`);
    }
    case "request_review": {
      const r = goldenResults(j);
      if ((j.buildDone ?? 0) < BUILD_STEPS.length) return text("Nothing to review: the first build hasn't finished.", true);
      if (!r || r.passed < r.total) return text("The golden tests must all pass before review. Run run_golden_tests.", true);
      if (j.review === "requested") return text(`Version ${j.version} is already waiting for review.`);
      await save(c, { ...j, review: "requested", reviewRequestedBy: c.userId, chat: [...j.chat, { from: "architect", text: `From your coding agent, over MCP: review requested for version ${j.version}. The approver has it in their Inbox.`, at: new Date().toISOString() }] });
      return text(`Review requested for version ${j.version}.`);
    }
  }
  return text(`No tool called ${name}.`, true);
}

async function handle(msg: Rpc, ctx: Ctx | null, authError: string | null) {
  const reply = (result: unknown) => ({ jsonrpc: "2.0", id: msg.id ?? null, result });
  const fail = (code: number, message: string) => ({ jsonrpc: "2.0", id: msg.id ?? null, error: { code, message } });
  if (msg.id === undefined) return null; // a notification
  switch (msg.method) {
    case "initialize":
      return reply({
        protocolVersion: typeof msg.params?.protocolVersion === "string" ? msg.params.protocolVersion : "2025-06-18",
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "architect", version: "0.1.0" },
        instructions: "Tools for one Architect project. Changes become versions that are tested and reviewed like changes made in Architect.",
      });
    case "ping":
      return reply({});
    case "tools/list":
      return reply({ tools: TOOLS });
    case "tools/call": {
      if (!ctx) return reply(text(authError ?? "Not signed in.", true));
      try {
        return reply(await call(ctx, String(msg.params?.name ?? ""), (msg.params?.arguments as Record<string, unknown>) ?? {}));
      } catch (e) {
        return reply(text((e as Error).message, true));
      }
    }
  }
  return fail(-32601, `Method not found: ${msg.method}`);
}

export async function POST(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!url || !key) return NextResponse.json({ error: "This deployment runs in demo mode, so there is no project data for MCP to reach." }, { status: 503 });
  if (!token) return NextResponse.json({ error: "Missing token. Copy your access token from the project's Developer view, Your coding agent." }, { status: 401, headers: { "WWW-Authenticate": "Bearer" } });

  const sb = createClient(url, key, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) return NextResponse.json({ error: "That token has expired or isn't valid. Copy a fresh one from the Developer view." }, { status: 401, headers: { "WWW-Authenticate": "Bearer" } });
  const ctx: Ctx = { sb, userId: data.user.id, projectId };

  let body: Rpc | Rpc[];
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, { status: 400 });
  }
  const batch = Array.isArray(body) ? body : [body];
  const out = (await Promise.all(batch.map((m) => handle(m, ctx, null)))).filter(Boolean);
  if (!out.length) return new NextResponse(null, { status: 202 });
  return NextResponse.json(Array.isArray(body) ? out : out[0]);
}

export function GET() {
  return new NextResponse("This MCP server answers POST requests only (no event stream).", { status: 405, headers: { Allow: "POST" } });
}

export function DELETE() {
  return new NextResponse(null, { status: 405, headers: { Allow: "POST" } });
}
