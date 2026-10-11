/**
 * Shared by the Developer view, the terminal and the MCP server: the project's files with the developer's edits
 * applied, its environments, its commits and its golden-test results. Plain functions, so the server can use them.
 */
import { FILES, GOLDEN, BUILD_STEPS } from "./fixtures";

export type EnvName = "preview" | "staging" | "production";
export const ENV_NAMES: EnvName[] = ["preview", "staging", "production"];
export type EnvVar = { key: string; value: string; secret: boolean };
export type ApiKey = { id: string; name: string; env: EnvName; prefix: string; createdAt: string; revoked?: boolean };

/** The parts of a journey these helpers read. */
export type DevJourney = {
  fileEdits?: Record<string, string>;
  envs?: Partial<Record<EnvName, EnvVar[]>>;
  testRun?: "none" | "first" | "fixed";
  buildDone?: number;
  version?: number;
  review?: string;
  chat?: { from: string; text: string; at: string; commit?: { sha: string; message: string } }[];
};

export type ProjectFile = { path: string; body: string; edited: boolean; added: boolean };

export function projectFiles(j: DevJourney, extra: { path: string; body: string }[] = []): ProjectFile[] {
  const edits = j.fileEdits ?? {};
  const base = [...extra, ...FILES];
  const known = new Set(base.map((f) => f.path));
  const out: ProjectFile[] = base.map((f) => ({ path: f.path, body: edits[f.path] ?? f.body, edited: f.path in edits && edits[f.path] !== f.body, added: false }));
  for (const [path, body] of Object.entries(edits)) if (!known.has(path)) out.push({ path, body, edited: true, added: true });
  return out;
}

export function originalFile(path: string) {
  return FILES.find((f) => f.path === path)?.body;
}

export function defaultEnvs(): Record<EnvName, EnvVar[]> {
  const shared = (env: EnvName): EnvVar[] => [
    { key: "DATABASE_URL", value: `vault://projects/loan-triage-desk/${env}/database`, secret: true },
    { key: "MODEL_GATEWAY_TOKEN", value: "Short-lived project token, rotated hourly", secret: true },
    { key: "GMAIL_CONNECTION", value: env === "production" ? "gmail-01 (officers@kestrel-lending)" : "gmail-test (captures email, sends nothing)", secret: true },
    { key: "POLICY_KNOWLEDGE_BASE", value: "kestrel-lending-policy@v1.0", secret: false },
    { key: "LOCALE", value: "en-GB, GBP", secret: false },
    { key: "LOG_LEVEL", value: env === "production" ? "warn" : "debug", secret: false },
  ];
  return { preview: shared("preview"), staging: shared("staging"), production: shared("production") };
}

export function envs(j: DevJourney): Record<EnvName, EnvVar[]> {
  const d = defaultEnvs();
  return { preview: j.envs?.preview ?? d.preview, staging: j.envs?.staging ?? d.staging, production: j.envs?.production ?? d.production };
}

/** Commits, newest first: the first build, the fix, then every version recorded in chat. */
export function commits(j: DevJourney) {
  const out: { sha: string; message: string; at: string }[] = [];
  if ((j.buildDone ?? 0) >= BUILD_STEPS.length) out.push({ sha: "a3f9c21", message: "First build: 4 screens, 3 agents, database", at: "" });
  if (j.testRun === "fixed") out.push({ sha: "b7e1d04", message: "Fix: conflicting figures go to Manual Review under 5.2", at: "" });
  for (const m of j.chat ?? []) if (m.commit) out.push({ ...m.commit, at: m.at });
  return out.reverse();
}

export type CaseResult = { id: string; title: string; outcome: string; cited: string[]; pass: boolean; note: string };

/** Golden results for the project's current state: 6 checks, an outcome and a reason for each of the 3 cases. */
export function goldenResults(j: DevJourney) {
  if (!j.testRun || j.testRun === "none") return null;
  const cases: CaseResult[] = GOLDEN.map((c) => {
    const r = j.testRun === "fixed" && c.afterFix ? c.afterFix : c.firstRun;
    return { id: c.id, title: c.title, outcome: r.outcome, cited: r.cited, pass: r.pass, note: r.note };
  });
  const passed = cases.reduce((n, c) => n + (c.pass ? 2 : 1), 0);
  return { cases, passed, total: GOLDEN.length * 2 };
}

/** The Policy agent's rules are the bullet lines of its RULES.md. */
export function policyRules(j: DevJourney) {
  const body = projectFiles(j).find((f) => f.path === "agents/policy-agent/RULES.md")?.body ?? "";
  return body
    .split("\n")
    .filter((l) => l.startsWith("- "))
    .map((l) => l.slice(2).trim());
}

export function rulesFile(rules: string[]) {
  return `# Rules\n\n${rules.map((r) => `- ${r}`).join("\n")}\n`;
}

/** Each agent's rules live in its RULES.md; these are the rules the first build wrote. */
export const AGENT_IDS = ["extraction", "policy", "drafting"] as const;
export type AgentKey = (typeof AGENT_IDS)[number];
const DEFAULT_RULES: Record<AgentKey, string[]> = {
  extraction: ["Never guess between two figures; return both and flag the conflict", "Return null with a reason when a fact is missing"],
  policy: [],
  drafting: ["State the policy reason in plain language", "Declines mention the 30-day review right", "Never send; sending needs the officer's separate confirmation"],
};
export const rulesPath = (agent: AgentKey) => `agents/${agent}-agent/RULES.md`;

export function agentRules(j: DevJourney, agent: AgentKey) {
  if (agent === "policy") return policyRules(j);
  const f = projectFiles(j).find((x) => x.path === rulesPath(agent));
  return f ? f.body.split("\n").filter((l) => l.startsWith("- ")).map((l) => l.slice(2).trim()) : DEFAULT_RULES[agent];
}

export const sha = () => Math.random().toString(16).slice(2, 9);
