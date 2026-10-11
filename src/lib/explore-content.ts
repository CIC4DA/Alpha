/** Content for Explore and Help. Sample data in the prototype; written for Architect 2.0's audience. */

export type Prompt = { title: string; category: string; text: string };

export const PROMPT_CATEGORIES = ["Operations", "Finance", "Lending", "Sales", "Support", "HR", "Legal and compliance", "Analysts", "Developers"];

export const PROMPTS: Prompt[] = [
  { category: "Lending", title: "Loan application triage", text: "Build an app where loan officers upload application PDFs. An agent extracts the applicant, amount, income and purpose, another checks them against our lending policy and cites the clause, and a third drafts the reply. Officers confirm every fact and every email." },
  { category: "Lending", title: "Covenant monitor", text: "Build an app that reads each borrower's quarterly accounts, checks them against the covenants in their facility agreement, and flags any breach or near-breach with the clause and the figures, for a relationship manager to review." },
  { category: "Lending", title: "Affordability pack checker", text: "Build a checker that reads a mortgage affordability pack (payslips, bank statements, credit report), finds income and committed spending, and flags gaps or inconsistencies before underwriting." },
  { category: "Finance", title: "Invoice to purchase order matcher", text: "Build an app that matches each supplier invoice PDF to its purchase order and goods receipt, flags price or quantity mismatches with the line it found, and holds payment until finance approves." },
  { category: "Finance", title: "Expense policy reviewer", text: "Build a reviewer that reads expense claims and receipts, checks each line against our travel and expense policy, and sends anything over the limits to the employee's manager with the policy section." },
  { category: "Finance", title: "Month-end variance explainer", text: "Build an app that compares this month's ledger to budget and last month, finds the five biggest variances, and drafts a plain-language explanation for each from the journal entries behind it." },
  { category: "Operations", title: "Supplier onboarding", text: "Build a supplier onboarding desk: collect company details and documents, check sanctions lists and insurance certificates, and route complete files to procurement for approval." },
  { category: "Operations", title: "Field report summariser", text: "Build an app where engineers upload site visit reports and photos. An agent pulls out defects, severity and the asset ID, and creates a work order for anything rated high." },
  { category: "Sales", title: "Account brief before every call", text: "Build an assistant that, an hour before each external meeting on my calendar, prepares a one-page brief from the CRM, recent emails and the company's latest news." },
  { category: "Sales", title: "RFP first draft", text: "Build an app that reads an RFP, matches each question to answers in our past proposals and product docs, drafts responses with the source for each, and marks what a person must write." },
  { category: "Support", title: "Ticket triage with cited answers", text: "Build a support triage app that classifies new tickets by topic and urgency, drafts a reply that cites our help-centre articles, and routes urgent ones to the on-call lead." },
  { category: "Support", title: "Complaint handling under FCA rules", text: "Build a complaints desk that logs each complaint, works out the deadline under our regulator's rules, drafts the final response letter, and warns the team a week before any deadline." },
  { category: "HR", title: "Policy question desk", text: "Build an internal assistant that answers employees' questions about leave, benefits and travel from our HR policies, quotes the section it relied on, and hands anything unclear to HR." },
  { category: "HR", title: "Interview pack builder", text: "Build an app that reads a job description and a candidate's CV, drafts structured interview questions for each competency, and gives interviewers a shared scoring sheet." },
  { category: "Legal and compliance", title: "Contract clause checker", text: "Build a checker that reads incoming supplier contracts, compares liability, termination and data clauses with our playbook, and marks each one as acceptable, needs negotiation or unacceptable, with the reason." },
  { category: "Legal and compliance", title: "KYC file review", text: "Build an app that reviews customer due-diligence files, checks identity documents and ownership structures against our KYC procedure, and lists what is missing before the file can be approved." },
  { category: "Analysts", title: "Earnings call digest", text: "Build an app that reads earnings call transcripts for the companies I cover, pulls out guidance changes and notable management quotes, and compares them with last quarter." },
  { category: "Analysts", title: "Vendor comparison scorecard", text: "Build a scorecard where I set evaluation criteria and weights, enter scores per vendor, and get a ranked comparison that updates when I change a weight." },
  { category: "Developers", title: "Release notes from pull requests", text: "Build an app that reads merged pull requests each week, groups them by area, and drafts customer-facing release notes plus an internal changelog, for an engineer to approve." },
  { category: "Developers", title: "Incident timeline writer", text: "Build an app that pulls an incident's Slack channel, alerts and deploy log, builds a timeline, and drafts the post-incident review with open questions marked." },
];

/** `saves` is an estimate, and the page says so. */
export type Idea = { title: string; why: string; saves: string; prompt: string };

export const ROLES: { id: string; label: string; ideas: Idea[] }[] = [
  {
    id: "lending",
    label: "Lending or credit",
    ideas: [
      { title: "Loan application triage", why: "Officers re-key the same facts from every PDF before they can apply the policy.", saves: "About 6 hours a week per officer", prompt: PROMPTS[0].text },
      { title: "Covenant monitor", why: "Quarterly covenant checks are manual and breaches are found late.", saves: "About 2 days a quarter", prompt: PROMPTS[1].text },
      { title: "Affordability pack checker", why: "Underwriters find missing documents only after the case is queued.", saves: "About 30 minutes per case", prompt: PROMPTS[2].text },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    ideas: [
      { title: "Invoice to purchase order matcher", why: "Three-way matching is done by hand and mismatches are paid by mistake.", saves: "About 8 hours a week", prompt: PROMPTS[3].text },
      { title: "Expense policy reviewer", why: "Managers approve claims without checking them against policy.", saves: "About 3 hours a week", prompt: PROMPTS[4].text },
      { title: "Month-end variance explainer", why: "Variance commentary is written from scratch every month.", saves: "About a day at month end", prompt: PROMPTS[5].text },
    ],
  },
  {
    id: "ops",
    label: "Operations",
    ideas: [
      { title: "Supplier onboarding", why: "Files bounce between teams because documents are missing.", saves: "About 4 hours per supplier", prompt: PROMPTS[6].text },
      { title: "Field report summariser", why: "Defects in site reports wait days before anyone raises a work order.", saves: "About 5 hours a week", prompt: PROMPTS[7].text },
    ],
  },
  {
    id: "support",
    label: "Customer support",
    ideas: [
      { title: "Ticket triage with cited answers", why: "Agents search the help centre for every ticket.", saves: "About 2 minutes per ticket", prompt: PROMPTS[10].text },
      { title: "Complaint handling", why: "Regulatory deadlines are tracked in spreadsheets.", saves: "Fewer missed deadlines", prompt: PROMPTS[11].text },
    ],
  },
  {
    id: "fde",
    label: "Forward deployed engineer",
    ideas: [
      { title: "Start from a blueprint", why: "The customer's process looks like one you've already delivered.", saves: "Days of setup per customer", prompt: PROMPTS[0].text },
      { title: "KYC file review", why: "A common first project at banks: clear rules, real documents, measurable time saved.", saves: "About 40 minutes per file", prompt: PROMPTS[15].text },
      { title: "Contract clause checker", why: "Legal teams have a written playbook, which makes golden tests easy to write.", saves: "About an hour per contract", prompt: PROMPTS[14].text },
    ],
  },
  {
    id: "dev",
    label: "Developer",
    ideas: [
      { title: "Release notes from pull requests", why: "Release notes are written late and from memory.", saves: "About 2 hours a week", prompt: PROMPTS[18].text },
      { title: "Incident timeline writer", why: "Post-incident reviews start from a blank page.", saves: "About half a day per incident", prompt: PROMPTS[19].text },
    ],
  },
];

export type Listing = { name: string; by: string; category: string; summary: string; uses: number; rating: number; added: string; prompt: string };

export const LISTINGS: Listing[] = [
  { name: "Claim Guard", by: "priya.s", category: "Finance", summary: "Checks insurance claims against policy wording and flags exclusions with the clause.", uses: 1840, rating: 4.7, added: "2026-09-28", prompt: "Build an app that checks insurance claims against the policy wording, flags any exclusion that applies with the clause, and drafts the decision letter for a handler to approve." },
  { name: "Lease Abstractor", by: "realty-ops", category: "Legal and compliance", summary: "Pulls rent, break dates and repair obligations from commercial leases into one table.", uses: 1220, rating: 4.6, added: "2026-09-12", prompt: "Build an app that reads commercial leases and extracts rent, review dates, break clauses and repair obligations into a table, with the page each came from." },
  { name: "Grant Reviewer", by: "foundation-lab", category: "Operations", summary: "Scores grant applications against published criteria and drafts feedback.", uses: 960, rating: 4.5, added: "2026-10-02", prompt: "Build an app that scores grant applications against our published criteria, explains each score with a quote from the application, and drafts feedback for unsuccessful applicants." },
  { name: "Churn Signals", by: "saas-cs", category: "Support", summary: "Reads tickets and usage notes and flags accounts at risk, with the evidence.", uses: 2310, rating: 4.4, added: "2026-08-30", prompt: "Build an app that reads support tickets and account notes each week, flags customers showing churn signals with the evidence, and suggests a next step for the account manager." },
  { name: "Board Pack Builder", by: "cosec", category: "Operations", summary: "Assembles board papers from team submissions and drafts the cover summary.", uses: 640, rating: 4.3, added: "2026-09-20", prompt: "Build an app that collects board paper submissions from each team, checks they follow the template, and drafts a one-page cover summary for the company secretary." },
  { name: "SAR Responder", by: "dpo-tools", category: "Legal and compliance", summary: "Finds a person's data across systems for subject access requests, with redaction.", uses: 780, rating: 4.6, added: "2026-09-05", prompt: "Build an app that helps answer subject access requests: search our systems for a person's data, suggest redactions of other people's details, and track the one-month deadline." },
  { name: "Quote Desk", by: "trade-co", category: "Sales", summary: "Turns customer emails into priced quotes from the price list and stock levels.", uses: 1530, rating: 4.5, added: "2026-09-25", prompt: "Build an app that reads customer quote requests from email, prices them from our price list and stock levels, and drafts the quote for a salesperson to send." },
  { name: "Rota Fixer", by: "care-ops", category: "HR", summary: "Fills shift gaps from staff availability and working-time rules.", uses: 410, rating: 4.2, added: "2026-10-06", prompt: "Build an app that finds gaps in next week's shift rota, suggests staff to fill them from availability and working-time rules, and asks the manager to confirm." },
  { name: "Audit Evidence Collector", by: "grc-team", category: "Legal and compliance", summary: "Requests, collects and checks control evidence for each audit period.", uses: 870, rating: 4.4, added: "2026-09-18", prompt: "Build an app that requests audit evidence from control owners each quarter, checks each file covers the period and the control, and reports what is missing." },
  { name: "Cash Forecast", by: "fp-and-a", category: "Finance", summary: "Builds a 13-week cash forecast from the ledger, payables and receivables.", uses: 1190, rating: 4.6, added: "2026-08-22", prompt: "Build a 13-week cash forecast app from our ledger, open payables and receivables, with scenarios a finance manager can adjust." },
  { name: "Lead Fit Scorer", by: "growth-desk", category: "Sales", summary: "Scores new leads against the ideal customer profile and explains the score.", uses: 2640, rating: 4.3, added: "2026-09-01", prompt: "Build an app that scores each new lead against our ideal customer profile, explains the score, and alerts the right salesperson for the top ones." },
  { name: "Onboarding Buddy", by: "people-team", category: "HR", summary: "Answers new joiners' questions from the handbook and books their first-week tasks.", uses: 990, rating: 4.5, added: "2026-09-30", prompt: "Build an assistant for new joiners that answers questions from our handbook with the section quoted, and lists their first-week tasks with owners." },
];

export type Guide = { title: string; kind: "Use case" | "Tutorial"; area: string; summary: string; minutes: number; steps?: string[]; prompt?: string };

export const GUIDES: Guide[] = [
  { kind: "Tutorial", area: "Getting started", title: "Your first agentic app in ten minutes", summary: "From a prompt to a tested preview.", minutes: 10, steps: ["On Home, describe the work, or fill in the loan-triage example.", "Answer the questions one at a time; each has a recommended answer.", "Read the one-screen plan. Anything not in your prompt is marked Suggested and off.", "Approve the plan to see the price, then connect your files and accounts.", "Start building and watch the screens appear in the preview."] },
  { kind: "Tutorial", area: "Testing", title: "Golden tests that check the reason, not just the answer", summary: "Turn your own documents into test cases.", minutes: 8, steps: ["In Test, add sample files you already know the answer for.", "For each, set the expected outcome and the clauses it must cite.", "Run the tests. A case fails if the outcome is right but the reason is wrong.", "Use Fix it, or debug it yourself in the Developer view.", "Every later change runs these cases before it can ship."] },
  { kind: "Tutorial", area: "Shipping", title: "Ship with a separate approver", summary: "Maker-checker for teams that need it.", minutes: 6, steps: ["Workspace settings: turn on Require a separate approver.", "Invite someone with the approver role.", "In Ship, request review. They get it in their Inbox.", "They read the checklist with evidence and approve, or request changes.", "Once approved, deploy. Whoever requested review can't approve it."] },
  { kind: "Tutorial", area: "Developers", title: "Connect Claude Code, Cursor or Codex over MCP", summary: "Work on a project from the tools you already use.", minutes: 5, steps: ["Open a project, then Developer view, Your coding agent.", "Pick your coding agent and click Put my access token in.", "Copy the line into your terminal or config file.", "Ask your agent to list the project's files, then make a change.", "The change appears in chat as a version, tested like any other."] },
  { kind: "Tutorial", area: "Developers", title: "Debug a failed run", summary: "Find out why an agent gave the wrong reason.", minutes: 7, steps: ["Run the golden tests, then open Developer view, Debug.", "Pick the failing case and step through each agent.", "Compare what the Policy agent received with what it returned.", "Change its rules and re-run just that case.", "When it passes, apply it as a fix."] },
  { kind: "Tutorial", area: "Developers", title: "Call your agents from your own systems", summary: "Use the agents behind any app as an API.", minutes: 6, steps: ["Developer view, API.", "Create a key for preview; production keys work only in production.", "Send the sample request with Try it.", "Copy the curl, Python or TypeScript snippet.", "Download openapi.json for the customer's developers."] },
  { kind: "Tutorial", area: "FDEs", title: "Run apps in your customer's cloud account", summary: "Deploy where the customer's data lives.", minutes: 9, steps: ["From the workspace switcher, create a customer workspace.", "Workspace settings, Where apps run: the customer's cloud account.", "Connect it with a deploy role scoped to one VPC.", "Build and ship as usual; deploys go to their account."] },
  { kind: "Tutorial", area: "FDEs", title: "Blueprints: deliver the same app to your next customer", summary: "Reuse what you built, without the customer's data.", minutes: 8, steps: ["When the app is live, Save as blueprint from Ship.", "In the next customer's workspace, start from it on Home.", "Connect that customer's own files; their golden tests run on them.", "When the original improves, publish the change from Blueprints.", "Roll it out to every customer that's behind."] },
  { kind: "Tutorial", area: "Models", title: "Pick a model per agent on your own cases", summary: "Accuracy, cost and speed, side by side.", minutes: 5, steps: ["Build, then open the Agents tab and click an agent.", "Click Compare models on the golden tests.", "Choose the models and your monthly volume, and run.", "Switch only to a model that passes every case."] },
  { kind: "Use case", area: "Lending", title: "Loan application triage", summary: "Facts extracted with their source, a policy clause cited for every recommendation, and an officer confirming every decision and email.", minutes: 4, prompt: PROMPTS[0].text },
  { kind: "Use case", area: "Insurance", title: "Claims checked against policy wording", summary: "Exclusions found at intake, with the wording quoted for the claims handler.", minutes: 4, prompt: LISTINGS[0].prompt },
  { kind: "Use case", area: "Finance", title: "Invoice matching before payment", summary: "Price and quantity mismatches held for review instead of paid and recovered later.", minutes: 3, prompt: PROMPTS[3].text },
  { kind: "Use case", area: "Support", title: "Ticket triage with cited answers", summary: "Replies drafted from the help centre with links; urgent tickets routed to the on-call lead.", minutes: 3, prompt: PROMPTS[10].text },
  { kind: "Use case", area: "Legal", title: "Contract review against a playbook", summary: "Every clause marked acceptable, negotiate or unacceptable, with the playbook rule beside it.", minutes: 4, prompt: PROMPTS[14].text },
];

export type DesignSystem = { id: string; name: string; summary: string; colors: string[]; font: string; radius: string };

export const DESIGN_SYSTEMS: DesignSystem[] = [
  { id: "ledger", name: "Ledger", summary: "Quiet and dense, for back-office tools people use all day.", colors: ["#18202e", "#2350d8", "#f5f6f8", "#1c7c54"], font: "Hanken Grotesk", radius: "6px" },
  { id: "harbour", name: "Harbour", summary: "Calm blues and generous spacing, for customer-facing portals.", colors: ["#0f3b57", "#2a8fbd", "#f2f7fa", "#e3a33b"], font: "Source Sans 3", radius: "10px" },
  { id: "civic", name: "Civic", summary: "High contrast and large type, built to meet accessibility rules.", colors: ["#0b0c0c", "#1d70b8", "#ffffff", "#00703c"], font: "Atkinson Hyperlegible", radius: "0px" },
  { id: "orchard", name: "Orchard", summary: "Warm and friendly, for internal apps a whole company uses.", colors: ["#2d2a26", "#c4572d", "#faf6f0", "#6a8f3c"], font: "Nunito Sans", radius: "12px" },
];

// ---------- Help ----------

export type Faq = { q: string; a: string; topic: string };

export const FAQS: Faq[] = [
  { topic: "Getting started", q: "Do I need to write code?", a: "No. You describe the work, answer a few questions and approve a plan. The code is there for developers who want it, in the Developer view or in your own editor." },
  { topic: "Getting started", q: "What's the difference between Plan, Manual and Auto in chat?", a: "Plan proposes changes and touches nothing, and it's free. Manual shows each change as a proposal you apply or discard. Auto makes the change, runs the golden tests and keeps it only if they pass." },
  { topic: "Credits", q: "What costs credits?", a: "Building a version, running the golden tests and changes after review. Planning, questions, editing the plan, Plan mode and fixes for our own mistakes are free. You see a price before anything starts." },
  { topic: "Credits", q: "What happens when I run out?", a: "Nothing stops mid-build: the build you started finishes. You can top up from the credits button in the top bar, or wait for next month's allowance." },
  { topic: "Testing", q: "What is a golden test?", a: "A real case from your own files, with the outcome you expect and the reason it must give, such as the policy clause. A test fails if the answer is right for the wrong reason." },
  { topic: "Approvals", q: "Can I approve my own changes?", a: "Yes, unless your workspace requires a separate approver. Then whoever requested the review can't approve it; someone with the approver role must." },
  { topic: "Data and security", q: "Where do my files and data go?", a: "They stay in your workspace. Secrets are kept in a vault and never enter the code or the sandbox. A workspace can run its apps in the customer's own cloud account." },
  { topic: "Data and security", q: "Do blueprints include my customer's data?", a: "No. A blueprint carries the plan, agents and golden-test definitions. Files, accounts, connections and data never go into it." },
  { topic: "Developers", q: "Can I use my own editor or coding agent?", a: "Yes. Connect GitHub and work in any editor, or connect Claude Code, Cursor or Codex over MCP from the Developer view. Pull requests are checked by the golden tests before they can merge." },
  { topic: "Developers", q: "How do I call my agents from another system?", a: "Developer view, API: create a key for an environment, copy the snippet, and download the OpenAPI spec." },
  { topic: "Workspaces", q: "How do I keep customers separate?", a: "Create one workspace per customer from the workspace switcher. Each has its own members, connections, approval rule and deploy target, and nothing is shared between them." },
];

export const WHATS_NEW: { date: string; title: string; detail: string }[] = [
  { date: "2026-10-11", title: "Developer tools", detail: "Edit any file, debug a failed run, a terminal, settings per environment, your agents as an API, and a working MCP server." },
  { date: "2026-10-11", title: "Pull requests, model comparison and blueprint roll-outs", detail: "Pull requests from your coding agent are checked by the golden tests; compare models on your own cases; roll blueprint improvements out to every customer." },
  { date: "2026-10-10", title: "Chat modes and the project menu", detail: "Plan, Manual and Auto modes; rename, duplicate, download code and more from the project menu; a database view and a filtered console." },
  { date: "2026-10-09", title: "Workspaces for FDEs", detail: "One workspace per customer, deploy to the customer's cloud, hand over with HANDOVER.md, and blueprints." },
  { date: "2026-10-08", title: "Architect 2.0 preview", detail: "Plan, Connect, Build, Test and Ship in one project, with builder, developer and approver views." },
];

export const STATUS = [
  { name: "Builds", state: "Operational" },
  { name: "Golden tests", state: "Operational" },
  { name: "Preview apps", state: "Operational" },
  { name: "Live apps", state: "Operational" },
  { name: "Model gateway", state: "Operational" },
];
