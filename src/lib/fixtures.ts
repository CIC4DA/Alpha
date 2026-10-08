// Scripted content for the prototype's builder journey.
// It walks through the loan-triage example from discovery, using the same test policy and applications.

export const SAMPLE_PROMPT = `Build a loan application triage app for a small lending team.
- A loan officer uploads an application PDF.
- An Extraction agent pulls applicant name, amount, income, and purpose.
- A Policy agent checks it against our lending policy document and cites the clause it relied on.
- A Drafting agent writes an approval or decline email for the officer to review before sending.
- A dashboard lists all applications with status, amount, and the policy decision.
Only loan officers can sign in.`;

export type Question = {
  id: string;
  ask: string;
  why: string;
  multi?: boolean;
  options: { id: string; label: string; detail: string; recommended?: boolean }[];
};

export const QUESTIONS: Question[] = [
  {
    id: "access",
    ask: "Who can sign in?",
    why: "Your prompt says only loan officers. This decides how they get accounts.",
    options: [
      { id: "invite", label: "Admin invites only", detail: "An admin adds each officer. Nobody can sign up alone.", recommended: true },
      { id: "domain", label: "Anyone with the company email domain", detail: "For example, anyone @kestrel-lending.co.uk." },
      { id: "list", label: "A fixed list of emails", detail: "You list the officers now." },
    ],
  },
  {
    id: "send",
    ask: "What happens after an officer approves a draft email?",
    why: "Sending to applicants is an external action, so it needs a clear rule.",
    options: [
      { id: "gmail", label: "Send through Gmail after a second confirmation", detail: "The officer reviews, then confirms the send separately.", recommended: true },
      { id: "draft", label: "Draft only", detail: "Officers copy the email into their own mail client." },
      { id: "outlook", label: "Send through Outlook after a second confirmation", detail: "Same as Gmail, for Microsoft 365 teams." },
    ],
  },
  {
    id: "rules",
    ask: "Which rules should the agents always follow?",
    why: "These become tests before you ship, and the approver's checklist.",
    multi: true,
    options: [
      { id: "cite", label: "Cite a policy clause for every recommendation", detail: "No citation means Manual Review.", recommended: true },
      { id: "conflict", label: "Send missing or conflicting facts to Manual Review", detail: "Never guess between two figures.", recommended: true },
      { id: "confirm", label: "Officer confirms extracted facts before the policy check", detail: "Corrections are logged.", recommended: true },
      { id: "fair", label: "Never use age, marital status or other protected characteristics", detail: "Even when the application contains them.", recommended: true },
    ],
  },
  {
    id: "locale",
    ask: "Which currency and locale?",
    why: "Amounts, dates and wording follow this everywhere.",
    options: [
      { id: "gbp", label: "Pounds sterling, UK English", detail: "£65,000 and 7 October 2026.", recommended: true },
      { id: "usd", label: "US dollars, US English", detail: "$65,000 and October 7, 2026." },
      { id: "inr", label: "Indian rupees, Indian English", detail: "₹65,00,000 and 7 October 2026." },
    ],
  },
];

export const PLAN = {
  summary:
    "A private desk where loan officers upload application PDFs. Three agents extract the facts, check them against your lending policy with clause citations, and draft the applicant email. Officers confirm every fact and every send.",
  screens: [
    { name: "Sign in", detail: "Invitation-only accounts for officers" },
    { name: "Applications", detail: "Every case with status, amount and decision" },
    { name: "Review", detail: "The PDF beside the extracted facts, each with its source" },
    { name: "Decision", detail: "Recommendation with cited clauses, the officer's decision, the email" },
  ],
  agents: [
    { name: "Extraction agent", detail: "Reads the PDF; returns name, amount, income, purpose, with page and quote" },
    { name: "Policy agent", detail: "Checks confirmed facts against the policy; Approve, Decline or Manual Review, with clauses" },
    { name: "Drafting agent", detail: "Writes the approval or decline email for the officer to edit" },
  ],
  suggested: [
    { id: "versions", label: "Policy version history", detail: "Keep old policies and record which one each decision used" },
    { id: "override", label: "Officer override with a required note", detail: "Let officers disagree with the recommendation, on the record" },
    { id: "status", label: "Applicant status page", detail: "Applicants can check progress themselves" },
    { id: "dark", label: "Dark mode", detail: "A theme toggle in the header" },
  ],
  estimate: { low: 3, high: 6, minutesLow: 15, minutesHigh: 25 },
};

export type ConnectItem = { id: string; label: string; detail: string; kind: "file" | "account" | "setting"; required: boolean };

export const CONNECT_ITEMS: ConnectItem[] = [
  { id: "policy", label: "Lending policy", detail: "The PDF the Policy agent checks against and cites.", kind: "file", required: true },
  { id: "gmail", label: "Gmail", detail: "Sends approved emails. Send-only access; the app never reads your inbox.", kind: "account", required: true },
  { id: "samples", label: "Sample applications", detail: "Two or three real or anonymised PDFs. They become your tests before shipping.", kind: "file", required: false },
  { id: "locale", label: "Currency and locale", detail: "Pounds sterling, UK English, from your answers.", kind: "setting", required: true },
];

export type BuildStep = { id: string; label: string; dev: string; reveals?: number; ms: number };

export const BUILD_STEPS: BuildStep[] = [
  { id: "scaffold", label: "Setting up your project", dev: "$ architect scaffold --stack next-agentic\n  created 38 files from template snapshot (resumed in 0.9s)", ms: 1400 },
  { id: "db", label: "Creating the database for applications, corrections and the audit trail", dev: "write db/schema.sql (applications, field_corrections, decisions, audit_events)\n$ db push --branch preview\n  4 tables, row-level security on", ms: 1600 },
  { id: "kb", label: "Indexing your lending policy", dev: "knowledge: kestrel-lending-policy-v1.0.pdf\n  8 sections, 26 clauses, page metadata kept", ms: 1500 },
  { id: "extract", label: "Creating the Extraction agent", dev: "write agents/extraction-agent/agent.yaml, RULES.md\n  model: capability=vision+structured -> routed by gateway", ms: 1300 },
  { id: "policy", label: "Creating the Policy agent", dev: "write agents/policy-agent/agent.yaml, RULES.md\n  knowledge: kestrel-lending-policy@v1.0", ms: 1300 },
  { id: "draft", label: "Creating the Drafting agent", dev: "write agents/drafting-agent/agent.yaml\n  tool: gmail.send (requires officer confirmation)", ms: 1200 },
  { id: "signin", label: "Building the sign-in screen", dev: "write app/(auth)/sign-in/page.tsx\n  invite-only; commit 1a4f2c0 \"Added invite-only sign-in\"", reveals: 0, ms: 1500 },
  { id: "dash", label: "Building the applications dashboard", dev: "write app/applications/page.tsx\n  commit 7c91e3b \"Added applications dashboard\"", reveals: 1, ms: 1700 },
  { id: "review", label: "Building the review screen", dev: "write app/applications/[id]/review/page.tsx\n  type error: Property 'income' does not exist on type 'Extraction'\n  fixer: added income to Extraction type (attempt 1 of 3, free)\n  commit 2be0d91 \"Added fact review with sources\"", reveals: 2, ms: 2200 },
  { id: "decision", label: "Building the decision screen", dev: "write app/applications/[id]/decision/page.tsx\n  commit 9f3a7e2 \"Added decision and email screen\"", reveals: 3, ms: 1700 },
  { id: "verify", label: "Checking each screen works end to end", dev: "verifier: headless browser on 4 screens\n  upload -> extract -> review -> decision: ok\n  console errors: 0", ms: 1800 },
];

export type GoldenCase = {
  id: string;
  title: string;
  file: string;
  expectOutcome: string;
  expectCite: string[];
  firstRun: { outcome: string; cited: string[]; pass: boolean; note: string };
  afterFix?: { outcome: string; cited: string[]; pass: boolean; note: string };
};

export const GOLDEN: GoldenCase[] = [
  {
    id: "hartley",
    title: "Hartley Joinery: equipment loan, strong income",
    file: "app-1-hartley-joinery.pdf",
    expectOutcome: "Approve",
    expectCite: ["2.1", "3.1", "4.1"],
    firstRun: { outcome: "Approve", cited: ["2.1", "3.1", "4.1"], pass: true, note: "£95,000 income is 3.2 times the £30,000 loan; equipment is an eligible purpose." },
  },
  {
    id: "cole",
    title: "Cole Ventures: crypto investment",
    file: "app-2-cole-ventures.pdf",
    expectOutcome: "Decline",
    expectCite: ["4.2"],
    firstRun: { outcome: "Decline", cited: ["4.2"], pass: true, note: "Cryptocurrency investment is a prohibited purpose, whatever the income." },
  },
  {
    id: "brightwell",
    title: "Brightwell Bakery: two different income figures",
    file: "app-3-brightwell-bakery.pdf",
    expectOutcome: "Manual Review",
    expectCite: ["5.2"],
    firstRun: {
      outcome: "Manual Review",
      cited: ["2.1"],
      pass: false,
      note: "Right outcome, wrong reason: it said trading history was unclear (2.1), but the real issue is £180,000 in Section C against £140,000 in Section D.",
    },
    afterFix: { outcome: "Manual Review", cited: ["5.2"], pass: true, note: "Flags the £180,000 and £140,000 conflict and asks the officer to verify income." },
  },
];

export const RULE_CHECKS = [
  { id: "cite", label: "Every recommendation cites a clause", evidence: "3 of 3 cases cite at least one clause" },
  { id: "fair", label: "Never uses age or marital status", evidence: "Date of birth appears in all 3 PDFs; no agent mentions it" },
  { id: "send", label: "No email is sent before the officer confirms", evidence: "Test mode recorded 0 sends before confirmation" },
];

export const FILES: { path: string; body: string }[] = [
  {
    path: "PLAN.md",
    body: `# Loan Triage Desk

A private desk where loan officers upload application PDFs. Three agents extract
the facts, check them against the lending policy with clause citations, and draft
the applicant email. Officers confirm every fact and every send.

## Screens
- Sign in (invite only)
- Applications
- Review: PDF beside extracted facts, each with page and quote
- Decision: recommendation, cited clauses, officer decision, email

## Rules
- Cite a policy clause for every recommendation
- Missing or conflicting facts go to Manual Review
- Officer confirms extracted facts before the policy check
- Never use protected characteristics

## Not in v1 (suggested)
- Policy version history
- Officer override with note
`,
  },
  {
    path: "agents/policy-agent/agent.yaml",
    body: `name: policy-agent
description: Checks officer-confirmed facts against the active lending policy.
model:
  capability: strong-reasoning, structured-output
  # resolved by the Model gateway; switching models runs the golden tests first
knowledge:
  - kestrel-lending-policy@v1.0
tools: []
output:
  schema: schemas/policy-result.json
`,
  },
  {
    path: "agents/policy-agent/RULES.md",
    body: `# Rules

- Use only officer-confirmed facts and the active policy version.
- Every recommendation cites at least one clause by number. No citation: Manual Review.
- Two different figures for the same fact: Manual Review under clause 5.2.
- Ignore age, marital status and any other protected characteristic (clause 7.1).
- Never mention internal scores or the agent itself in applicant-facing text (clause 8.3).
`,
  },
  {
    path: "tests/golden/brightwell-income-conflict.yaml",
    body: `id: brightwell-income-conflict
input:
  files: [app-3-brightwell-bakery.pdf]
  policy: kestrel-lending-policy@v1.0
expect:
  outcome: manual_review
  must_cite: ["5.2"]
  must_not_use: [date_of_birth, marital_status]
  no_email_sent_before: officer_confirmation
critical: true
`,
  },
  {
    path: "app/applications/[id]/review/page.tsx",
    body: `export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const application = await getApplication(id);
  const extraction = await getExtraction(id);

  return (
    <ReviewLayout pdf={application.file}>
      {extraction.fields.map((field) => (
        <FactField
          key={field.name}
          field={field}
          source={field.source} // page and quoted text
          needsCheck={field.confidence < 0.8 || field.conflicts.length > 0}
        />
      ))}
      <ConfirmFacts disabledUntilResolved />
    </ReviewLayout>
  );
}
`,
  },
  {
    path: ".architect/config.yaml",
    body: `project: loan-triage-desk
stack: next-agentic
environments:
  preview: { database: branch, demo_data: false }
  staging: { database: branch }
  production: { approval: organisation-policy }
tests:
  gate_ship: all
  critical_runs: 3
`,
  },
];

export const TRACE = [
  {
    agent: "Extraction agent",
    received: "app-3-brightwell-bakery.pdf (1 page)",
    returned: `{ applicant: "Samira Okoye", amount_gbp: 65000,
  income_gbp: null,
  income_conflict: [ { value: 180000, source: "Section C" },
                     { value: 140000, source: "Section D, accountant" } ],
  purpose: "Refurbish premises and buy a second deck oven" }`,
  },
  {
    agent: "Officer",
    received: "Review screen",
    returned: "Confirmed income £140,000 (accountant's figure); 1 correction logged",
  },
  {
    agent: "Policy agent",
    received: "Confirmed facts + kestrel-lending-policy@v1.0",
    returned: `{ recommendation: "manual_review",
  cited: ["5.2", "3.3"],
  reason: "Income figures conflicted until the officer confirmed £140,000;
           at 2.15x the loan it is below the 2.5x needed under 3.2 but above 1.5x (3.3)." }`,
  },
];

export const RECEIPT = { build: 4.2, tests: 0.3, fixes: 0 };
