/**
 * Stand-in data for the developer and FDE loop: pull requests from a coding agent, model comparisons on the
 * golden tests. Follows the loan-triage example, like the rest of the fixtures.
 */

export type CaseResult = { caseId: string; title: string; outcome: string; cited: string; pass: boolean; note: string };
export type RuleCheck = { rule: string; pass: boolean; note?: string };

export type PrState = "open" | "checking" | "passed" | "failed" | "merged" | "closed";

export type PullRequest = {
  id: string;
  number: number;
  title: string;
  branch: string;
  from: "Cursor" | "Claude Code" | "Codex";
  files: { path: string; add: number; del: number }[];
  diff: string;
  results: CaseResult[];
  rules: RuleCheck[];
  checks: number; // golden checks passed, of 6 (outcome and reason for each case)
  pass: boolean;
};

export const PULL_REQUESTS: PullRequest[] = [
  {
    id: "pr-14",
    number: 14,
    title: "Flag income figures that differ by more than 10%",
    branch: "cursor/income-mismatch-flag",
    from: "Cursor",
    files: [
      { path: "agents/extraction-agent/RULES.md", add: 3, del: 0 },
      { path: "app/applications/[id]/review/page.tsx", add: 18, del: 2 },
    ],
    diff: `--- a/agents/extraction-agent/RULES.md
+++ b/agents/extraction-agent/RULES.md
@@ -4,3 +4,6 @@
 - Never guess between two figures; return both and flag the conflict.
 - Return null with a reason when a fact is missing.
+- When two income figures differ by more than 10%, set
+  income_conflict: true and quote both sections, so the
+  officer sees it before the policy check runs.
--- a/app/applications/[id]/review/page.tsx
+++ b/app/applications/[id]/review/page.tsx
@@ -41,2 +41,18 @@
-  {facts.income && <Fact label="Income" value={facts.income} />}
+  {facts.income_conflict ? (
+    <ConflictBanner
+      label="Two income figures"
+      a={facts.income_sources[0]}
+      b={facts.income_sources[1]}
+    />
+  ) : (
+    <Fact label="Income" value={facts.income} />
+  )}`,
    results: [
      { caseId: "hartley", title: "Hartley Joinery", outcome: "Approve", cited: "2.1, 3.1, 4.1", pass: true, note: "One income figure, so no flag. Unchanged." },
      { caseId: "cole", title: "Cole Ventures", outcome: "Decline", cited: "4.2", pass: true, note: "Unchanged." },
      { caseId: "brightwell", title: "Brightwell Bakery", outcome: "Manual Review", cited: "5.2", pass: true, note: "Flagged at extraction now: £180,000 against £140,000, 22% apart." },
    ],
    rules: [
      { rule: "Officers confirm every fact and every send" , pass: true },
      { rule: "Only officer-confirmed facts reach the Policy agent", pass: true },
      { rule: "Applicant emails never mention scores or the agent (clause 8.3)", pass: true },
    ],
    checks: 6,
    pass: true,
  },
  {
    id: "pr-15",
    number: 15,
    title: "Approve loans under £50,000 without officer review",
    branch: "claude/fast-track-small-loans",
    from: "Claude Code",
    files: [
      { path: "app/applications/[id]/decision/page.tsx", add: 9, del: 4 },
      { path: "agents/policy-agent/agent.yaml", add: 2, del: 0 },
    ],
    diff: `--- a/app/applications/[id]/decision/page.tsx
+++ b/app/applications/[id]/decision/page.tsx
@@ -12,4 +12,9 @@
-  const decision = await officerConfirms(recommendation);
+  const decision =
+    application.amount_gbp < 50_000
+      ? { outcome: "Approve", confirmed_by: "auto" }
+      : await officerConfirms(recommendation);
--- a/agents/policy-agent/agent.yaml
+++ b/agents/policy-agent/agent.yaml
@@ -9,0 +9,2 @@
+skip_when:
+  amount_gbp_below: 50000`,
    results: [
      { caseId: "hartley", title: "Hartley Joinery", outcome: "Approve", cited: "none", pass: false, note: "Right outcome, no reason: £30,000 is under the limit, so the Policy agent never ran and nothing was cited." },
      { caseId: "cole", title: "Cole Ventures", outcome: "Approve", cited: "none", pass: false, note: "Wrong outcome: £40,000 crypto investment was approved automatically. Clause 4.2 prohibits it." },
      { caseId: "brightwell", title: "Brightwell Bakery", outcome: "Manual Review", cited: "5.2", pass: true, note: "Over the limit, so unchanged." },
    ],
    rules: [
      { rule: "Officers confirm every fact and every send", pass: false, note: "Loans under £50,000 are decided with no officer." },
      { rule: "Only officer-confirmed facts reach the Policy agent", pass: true },
      { rule: "Applicant emails never mention scores or the agent (clause 8.3)", pass: true },
    ],
    checks: 3,
    pass: false,
  },
];

/** What Architect posts back to the pull request, so the coding agent can fix it. */
export function reviewComment(pr: PullRequest) {
  const failing = [...pr.results.filter((r) => !r.pass).map((r) => `- ${r.title}: ${r.note}`), ...pr.rules.filter((r) => !r.pass).map((r) => `- Plan rule "${r.rule}": ${r.note}`)];
  return `Architect checks on #${pr.number}: ${pr.pass ? "all passed" : `${failing.length} failing`}\n${failing.join("\n")}`;
}

// ---------- Comparing models on the golden tests ----------

export type ModelRun = {
  model: string;
  results: { caseId: string; pass: boolean; cited: string; note?: string }[];
  costPerCase: number; // USD
  seconds: number; // median per case
  note?: string;
};

/** Per agent; the first entry is what the agent runs on now. */
export const MODEL_RUNS: Record<string, ModelRun[]> = {
  policy: [
    { model: "Claude", costPerCase: 0.011, seconds: 3.1, results: [{ caseId: "hartley", pass: true, cited: "2.1, 3.1, 4.1" }, { caseId: "cole", pass: true, cited: "4.2" }, { caseId: "brightwell", pass: true, cited: "5.2" }] },
    { model: "GPT", costPerCase: 0.009, seconds: 2.4, results: [{ caseId: "hartley", pass: true, cited: "2.1, 3.1, 4.1" }, { caseId: "cole", pass: true, cited: "4.2" }, { caseId: "brightwell", pass: true, cited: "5.2" }] },
    {
      model: "Gemini",
      costPerCase: 0.006,
      seconds: 1.9,
      results: [
        { caseId: "hartley", pass: true, cited: "2.1, 3.1, 4.1" },
        { caseId: "cole", pass: true, cited: "4.2" },
        { caseId: "brightwell", pass: false, cited: "2.1", note: "Right outcome, wrong reason: cites trading history, not the income conflict." },
      ],
    },
    {
      model: "Llama, self-hosted",
      costPerCase: 0.002,
      seconds: 4.8,
      note: "Runs in the customer's cloud account; no data leaves it.",
      results: [
        { caseId: "hartley", pass: true, cited: "2.1, 3.1" , note: "Missed clause 4.1, but cited enough to pass." },
        { caseId: "cole", pass: false, cited: "4.1", note: "Declined, but cited the wrong clause: 4.1 instead of 4.2." },
        { caseId: "brightwell", pass: false, cited: "none", note: "Approved: did not notice the two income figures." },
      ],
    },
  ],
  extraction: [
    { model: "Claude", costPerCase: 0.018, seconds: 5.2, results: [{ caseId: "hartley", pass: true, cited: "9 of 9 fields" }, { caseId: "cole", pass: true, cited: "9 of 9 fields" }, { caseId: "brightwell", pass: true, cited: "both income figures" }] },
    { model: "GPT", costPerCase: 0.015, seconds: 4.6, results: [{ caseId: "hartley", pass: true, cited: "9 of 9 fields" }, { caseId: "cole", pass: true, cited: "9 of 9 fields" }, { caseId: "brightwell", pass: false, cited: "one income figure", note: "Returned £180,000 only; the conflict was lost." }] },
    { model: "Gemini", costPerCase: 0.009, seconds: 3.3, results: [{ caseId: "hartley", pass: true, cited: "9 of 9 fields" }, { caseId: "cole", pass: true, cited: "9 of 9 fields" }, { caseId: "brightwell", pass: true, cited: "both income figures" }] },
    {
      model: "Llama, self-hosted",
      costPerCase: 0.004,
      seconds: 7.9,
      note: "Runs in the customer's cloud account; no data leaves it.",
      results: [{ caseId: "hartley", pass: true, cited: "9 of 9 fields" }, { caseId: "cole", pass: false, cited: "8 of 9 fields", note: "Missed the loan purpose on page 2." }, { caseId: "brightwell", pass: false, cited: "one income figure", note: "Returned £140,000 only." }],
    },
  ],
  drafting: [
    { model: "Claude", costPerCase: 0.006, seconds: 2.2, results: [{ caseId: "hartley", pass: true, cited: "reason stated" }, { caseId: "cole", pass: true, cited: "30-day review right" }, { caseId: "brightwell", pass: true, cited: "asks for income proof" }] },
    { model: "GPT", costPerCase: 0.005, seconds: 1.8, results: [{ caseId: "hartley", pass: true, cited: "reason stated" }, { caseId: "cole", pass: true, cited: "30-day review right" }, { caseId: "brightwell", pass: true, cited: "asks for income proof" }] },
    { model: "Gemini", costPerCase: 0.003, seconds: 1.4, results: [{ caseId: "hartley", pass: true, cited: "reason stated" }, { caseId: "cole", pass: false, cited: "no review right", note: "Decline email left out the 30-day review right." }, { caseId: "brightwell", pass: true, cited: "asks for income proof" }] },
    {
      model: "Llama, self-hosted",
      costPerCase: 0.001,
      seconds: 3.6,
      note: "Runs in the customer's cloud account; no data leaves it.",
      results: [{ caseId: "hartley", pass: true, cited: "reason stated" }, { caseId: "cole", pass: true, cited: "30-day review right" }, { caseId: "brightwell", pass: true, cited: "asks for income proof" }],
    },
  ],
};

export const CASE_TITLES: Record<string, string> = { hartley: "Hartley Joinery", cole: "Cole Ventures", brightwell: "Brightwell Bakery" };

/** Applications a month the cost estimate assumes; the builder can change it. */
export const DEFAULT_VOLUME = 400;
