# Architect 2.0

**Prototype to production in one project.** A business user or a forward deployed engineer builds an agentic app, hardens it, gets it signed off and runs it in the customer's environment, all in one project and without a rewrite. Builder, developer and approver are roles, not people: a solo founder can hold all three, and a bank can require a separate approver.

Architect 2.0 competes with Lovable and Replit for non-technical builders, and with Claude Code, Cursor and Codex for FDEs. It doesn't try to beat them at a first demo or at writing code; it wins on what comes after: an agent tested on the customer's own cases, signed off, and running where the customer needs it.

This repo is the clickable prototype, the architecture for building it for real, and the discovery work behind both.

| | |
| --- | --- |
| Architecture | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [the diagram](docs/architecture-diagram.png) |
| Prototype | This Next.js app. Run it locally (below) or open the deployed link |
| Discovery | Hands-on run of today's Architect and Lovable on the same loan-triage app; screenshots in [docs/discovery](docs/discovery) |

![Architecture](docs/architecture-diagram.png)

## What the prototype shows

One project moves through five stages. The builder drives them; the developer and approver open the same project in their own view.

| Stage | What happens | Fixes this from discovery |
| --- | --- | --- |
| Plan | Questions one at a time, each with a recommended answer; a one-screen plan; anything not in the prompt is marked Suggested and off; the price range before building | A 190-line plan written for two readers; scope added silently; no price until after the build |
| Connect | Policy file, Gmail (send-only, consent shown) and locale connected before the build; or demo data, which blocks production | Knowledge base requested three times, mid-build; sample data shipped inside the app |
| Build | Plain-language progress, screens appearing in the preview, an agent graph you can edit in place (rules, tools, model, framework) | Agent editing lives in a separate product |
| Test | Golden cases from your own files, checked on outcome *and* reason. One fails for the right answer with the wrong clause; Fix is free | Self-checks covered routes, not the job; Lovable got the right outcome for invented reasons |
| Ship | A checklist built from the plan's rules, with evidence. Self-check when you're the approver; a review request when the organisation requires a separate one. Changes come back as version 2. Receipt against the estimate | No review step anywhere in the category |

Also in the prototype:

- **Developer view**: files, the preview database (tables, rows, schema), traces of what each agent received and returned, a console with error and warning filters, environment with secrets as references, GitHub sync, and an optional MCP setup for Claude Code, Codex or Cursor. The view works on its own; a coding agent is optional.
- **Approver view**: what changed, the checklist with evidence, test results, data access, running cost; approve or request changes.
- **For FDEs**: one workspace per customer, each with its own members, approval rule and deploy target (Architect cloud or the customer's own cloud account). When the app is live, hand it over by inviting the customer's builder and approver (Architect writes HANDOVER.md), and save it as a blueprint to start the next customer from.
- **Agents page**: every agent in the workspace with its model, runs, cost and failures, editable in place. Studio and GitAgent live inside Architect; nobody has to go to either.
- **Workspace settings**: require a separate approver (maker-checker), choose where apps run, invite people by role. With no setup, everyone can do everything.
- **Navigation**: a persistent rail with recent projects, projects named from the prompt with a description, statuses, an Inbox for everything waiting on you, and import from GitHub.
- **Pull requests from your editor**: a developer works in Cursor, Claude Code or Codex and opens a pull request. Architect runs the golden tests, on outcome and reason, and the plan's rules on the branch; merge is blocked while anything fails, and the failures go back to the coding agent as a review comment. A merge becomes a version, reviewed like any other.
- **Compare models on the golden tests**: for any agent, run its cases on several models side by side, with pass or fail per case and why, cost per case and per month at the customer's volume, and speed. A model can be switched in only if it passes every case; the switch is a version you can revert.
- **Blueprints page**: blueprints are versioned. When the original customer's app improves, publish the change as the next version, see every customer project built from it across your workspaces and which are behind, and roll it out. Each roll-out is tested on that customer's own files and goes live through their review.
- **Credits**: the balance sits in the top bar and the rail, as in Architect today. It opens to usage by project, a link to the full Usage page, and a quick top-up (simulated; no payment is taken).

### Nothing from today's Architect is dropped

Architect 2.0 adds to the product for developers and FDEs; every feature in today's project screen has a place in it.

| Today's Architect | In Architect 2.0 |
| --- | --- |
| Plan toggle in chat | Three chat modes: **Plan** proposes and touches nothing (free), **Manual** shows each change as a proposal to apply or discard, **Auto** makes the change, runs the golden tests and keeps it only if they pass |
| Agent steps with "N actions" | Each build step expands to the commands it ran |
| Commit cards, "Revert to this version" | Commit cards in chat; revert to any version and the later ones are kept |
| + menu: add assets, MCP server, custom tool | Same menu; PDFs attached in chat become the policy or sample applications |
| Build options: test in a real browser | Same switch in chat and in the More menu (Feature testing); adds a browser check to each build |
| Credits, Top Up, Manage Billing | Credits pill with usage by project, full Usage page and quick top-up |
| Rename, App ID | Click the name to rename; copy the project ID from the More menu |
| Agents graph with MCP Servers panel | Agent graph you can edit in place, with MCP servers and tools listed and addable |
| App preview, console with All / Error / Warn / Log | Preview, and a Console in the developer view with the same filters |
| Database tab: tables, row counts, rows and schema, search | Developer view, Database: the same, read-only on the preview branch |
| More menu: refresh, share, download code, environment variables, duplicate, file tree, delete | Same menu; download builds a real zip, duplicate makes a real copy (reviews and the live deployment aren't copied), delete asks twice |
| Edit Agents (Studio), GitHub, Deploy | Agents edited in place, GitHub in the developer view, Ship stage with review and receipt |

Not built in the prototype: the dark theme and the support chat.

### What's real and what's scripted

| Real | Scripted, with stand-in data |
| --- | --- |
| Blueprint versions, publishing from the source project, and roll-outs into other workspaces' projects | The two pull requests, their diffs and check results; model comparison figures |
| Sign-in (Google, GitHub, email link) through Supabase | The build, tests, fix and deploy timings and results |
| Projects, workspaces, invitations, blueprints and journey state in Postgres with row-level security | Agent outputs, traces, logs and run figures (from the loan-triage fixtures) |
| Invitations become memberships, with the role's permissions, the first time that email signs in | The customer cloud-account connection and deploys into it |
| A separate approver: with real accounts, whoever requested review can't approve it (checked in the app here; the architecture checks it on the server) | |
| Project naming from the prompt, status, spend, Inbox, rail | Gmail consent and GitHub connection |
| File pickers (only file names are recorded) | The generated app in the preview |

The scripted parts follow the loan-triage example. Any other prompt gets a working project and plan screen, with a note that the rest of the journey is the example's.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000 and choose **Explore without an account**. Demo mode keeps everything in your browser; no keys needed.

### With Supabase (real sign-in)

1. Create a Supabase project and copy `.env.example` to `.env.local` with the project URL and publishable key.
2. In the SQL editor, run [supabase/schema.sql](supabase/schema.sql). It creates the tables and row-level security, gives every new user a workspace, and turns invitations into memberships. It is safe to run again after an update.
3. Under Authentication, enable Email, Google and GitHub, and add your site URL plus `/home` to the redirect URLs.

## Code map

```
src/app/login              Sign-in
src/app/(app)/home         Composer: describe, import, templates
src/app/(app)/p/[id]       The project workspace: stages, chat, three views
src/app/(app)/inbox        Reviews, failing tests, unfinished setup
src/app/(app)/settings     Workspace settings: approval rule, where apps run, members
src/app/(app)/agents       Every agent in the workspace, with runs, cost and failures
src/app/(app)/blueprints   Blueprint versions, customer projects on each, roll-outs
src/app/live/[slug]        The generated app, preview or live
src/components/workspace   One component per stage and view
src/lib/store.ts           One data API, two backends: Supabase or local demo
src/lib/fixtures.ts        The loan-triage script: questions, plan, build steps, golden cases
src/lib/devloop.ts         Pull requests from coding agents, model comparison runs
supabase/schema.sql        Tables, row-level security, new-user trigger
```

## Phasing

**Phase 1 (this prototype):** the builder journey end to end, the developer and approver views, organisation approval setting, real sign-in and persistence.

**Added after Lyzr's 9 Oct reply:** customer workspaces, deploy targets, handover, blueprints and the Agents page, for FDEs.

**Added after that, for developers and FDEs:** pull requests from a coding agent checked by the golden tests, model comparison on the golden tests, and versioned blueprints rolled out across customers.

**Phase 2:** a real golden-test run (the agent on a real PDF, a judge checking outcome and cited clauses), which then also powers real pull-request checks and model comparisons; the GitHub App and the MCP server for real; alerts and saving a failed run as a test.

The architecture doc describes the full system: sandboxes, the durable build harness, the model gateway, the test service, GitHub and MCP integration, and the deploy pipeline.
