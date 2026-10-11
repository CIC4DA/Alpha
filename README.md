# Architect 2.0

**Prototype to production in one project.** A business user or a forward deployed engineer builds an agentic app, hardens it, gets it signed off and runs it in the customer's environment, all in one project and without a rewrite. Builder, developer and approver are roles, not people: a solo founder can hold all three, and a bank can require a separate approver.

Architect 2.0 competes with Lovable and Replit for non-technical builders, and with Claude Code, Cursor and Codex for FDEs. It doesn't try to beat them at a first demo or at writing code; it wins on what comes after: an agent tested on the customer's own cases, signed off, and running where the customer needs it.

This repo is the clickable prototype, the architecture for building it for real, and the discovery work behind both.

| | |
| --- | --- |
| PRD | [docs/PRD.md](docs/PRD.md): problem, who it's for, how we win, requirements, metrics, release plan |
| Flows and screens | [docs/FLOWS.md](docs/FLOWS.md): information architecture, each role's journey, every screen |
| Architecture | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [the diagram](docs/architecture-diagram.png) |
| Discovery | [docs/DISCOVERY.md](docs/DISCOVERY.md): hands-on run of today's Architect and Lovable on the same loan-triage app, competitor teardown, hypotheses |
| Prototype | [alpha-architect-2.vercel.app](https://alpha-architect-2.vercel.app), or run it locally (below) |

## Try it

Open [alpha-architect-2.vercel.app](https://alpha-architect-2.vercel.app) and sign in with the shared test account:

| | |
| --- | --- |
| Email | `test@test.com` |
| Password | `test12345` |

The account already holds a workspace of its own and two customer workspaces, so every role and stage has something to look at. A suggested route, about ten minutes:

1. **Home.** One view for everyone. The line above the composer is the workspace (which customer, where its apps run, who signs off), each part changeable in place; the composer sets the chat mode, look and checks for the next project.
2. **Loan Triage Desk** (under Recent projects). A live app that went through the whole journey. In the chat, scroll the questions, plan, connect, build, the failed test and its free fix, deploy, and version 2 made from a chat message. Use the stage steps at the top to reopen any stage.
3. **Switch views** at the top right:
   - **Developer:** files you can edit, Debug a failed run, Terminal (try `help`), Environments, API (press **Send request**: a real endpoint answers), and **Your coding agent** (press **Put my access token in**, then **Test the connection**: a real MCP server answers).
   - **Approver:** what changed, the checklist with evidence, test results.
4. **Agents** in the rail. Every agent in the workspace with runs, cost and failures, editable in place. **Open in Loan Triage Desk** takes you to that agent in its project, where **Compare models on the golden tests** runs its cases on several models side by side.
5. **Blueprints** in the rail. Loan Triage Desk is saved as a blueprint at version 2. Kestrel Lending is up to date; Northwind Credit Union is one version behind, so you can press **Roll out version 2**.
6. **Switch workspace** (top of the rail) to **Kestrel Lending**, a customer that requires a separate approver and runs apps in its own AWS account. Kestrel Triage Desk is live and handed over to the customer's people; see **Workspace settings** for the rule, deploy target and members.
7. **Switch to Northwind Credit Union.** Northwind Triage Desk, started from the blueprint, is waiting for approval. The test account requested that review, so it can't approve it: that is the separate-approver rule working.
8. **Start your own.** On Home, pick **Loan application triage** and press **Plan it** to run the journey from the start. Any other prompt gets a real project and plan; the rest of its journey follows the loan-triage example.

Everyone shares this account, so you may see other reviewers' projects. To try it alone, choose **Explore without an account** on the sign-in page: demo mode keeps everything in your browser.

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

- **Developer view**, complete on its own:
  - **Files**: edit any file or add one; saving makes a version, with a diff against the build.
  - **Debug**: step through a failed run agent by agent, change the Policy agent's rules, re-run just that case, compare before and after, and apply the fix.
  - **Terminal**: `ls`, `cat`, `git log`, `architect test`, `architect env`, `architect deploy` against the project's real files, versions and settings.
  - **Environments**: preview, staging and production settings, secrets as vault references, compare and promote.
  - **API**: the project's agents as HTTP endpoints, with keys per environment, curl, Python and TypeScript snippets, a Try it console and an OpenAPI spec.
  - **Database, Console, GitHub**: the preview database, build output with filters, pull requests checked by the golden tests.
  - **Your coding agent**: a real MCP server. Connect Claude Code, Cursor or Codex and it can read and change files, agents, models and settings, run the tests and request review, with your role's access; each change shows up in chat as a version.
- **Approver view**: what changed, the checklist with evidence, test results, data access, running cost; approve or request changes.
- **For FDEs**: one workspace per customer, each with its own members, approval rule and deploy target (Architect cloud or the customer's own cloud account). When the app is live, hand it over by inviting the customer's builder and approver (Architect writes HANDOVER.md), and save it as a blueprint to start the next customer from.
- **Agents page**: every agent in the workspace with its model, runs, cost and failures, editable in place. Studio and GitAgent live inside Architect; nobody has to go to either.
- **Workspace settings**: require a separate approver (maker-checker), choose where apps run, invite people by role. With no setup, everyone can do everything.
- **Home**: one view for everyone. A line above the composer shows the workspace as a sentence (which customer, where its apps run, who signs off), each part changeable in place; the composer sets the chat mode, look and checks for the new project, and the + menu starts from a blueprint, a template or a GitHub repository. Blueprints, ideas and recent projects sit underneath.
- **Navigation**: a persistent rail with recent projects, projects named from the prompt with a description, statuses, an Inbox for everything waiting on you, and import from GitHub.
- **Explore and Help**: ideas by role, a prompt library, a marketplace of community apps to remix, templates, design systems and tutorials in one Explore page; a Help page and a support chat that answers from the help articles. Marketplace listings, status and the support hand-over are sample data.
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
| Get started menu: how it works, prompt library, marketplace, what should I build, resources, docs, design systems, Discord, Lyzr University | One Explore page with tabs: What should I build (pick a role, get ideas with estimated time saved), Prompt library (categories, search), Marketplace (filters, sort, remix), Templates, Design systems (default for new apps, with a preview), Learn (how it works, tutorials and use cases, docs and community links). Every prompt opens on Home, ready to plan |
| Help & Support, support chat bubble | A Help page (search, guides by role, common questions, what's new, status) and a support chat on every page that answers from the help articles and hands over to a person |

Not built in the prototype: the dark theme.

### What's real and what's scripted

| Real | Scripted, with stand-in data |
| --- | --- |
| Blueprint versions, publishing from the source project, and roll-outs into other workspaces' projects | The two pull requests, their diffs and check results; model comparison figures |
| The MCP server (`/api/mcp/<project id>`) and the agents API (`/api/v1/projects/<id>/…`, answering from a rule set that follows the policy) | The terminal's command output and the debugger's re-run, simulated against the project's saved files and settings |
| File edits, environments, API keys (only a prefix is kept) and fixes made in the debugger, saved with the project | |
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

### Connect a coding agent (signed-in accounts)

Open a project, then Developer view, Your coding agent. Pick Claude Code, Cursor or Codex, click "Put my access token in", and copy the line. For Claude Code it looks like:

```
claude mcp add --transport http architect https://<your deployment>/api/mcp/<project id> \
  --header "Authorization: Bearer <token>"
```

The token is your own sign-in and lasts about an hour. Then ask your agent, for example, "list the files in my Architect project and add a CSV export helper".

## Code map

```
src/app/login              Sign-in
src/app/(app)/home         Composer with workspace and project quick settings, recent projects
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
src/lib/devkit.ts          Files with edits, environments, commits, test results: shared by the UI and the MCP server
src/lib/policy-engine.ts   The lending policy as rules, behind the agents API
src/app/api/mcp            The MCP server, one per project
src/app/api/v1             The agents API
supabase/schema.sql        Tables, row-level security, new-user trigger
```

## Phasing

**Phase 1 (this prototype):** the builder journey end to end; the developer view (file editor, run debugger, terminal, environments, agents API, pull requests checked by the golden tests, model comparison, a working MCP server); the approver view and the organisation's approval rule; for FDEs, customer workspaces, deploy targets, handover, versioned blueprints rolled out across customers and the Agents page; real sign-in and persistence.

**Phase 2:** a real golden-test run (the agent on a real PDF, a judge checking outcome and cited clauses), which then also powers real pull-request checks and model comparisons; the GitHub App and the MCP server for real; alerts and saving a failed run as a test.

The architecture doc describes the full system: sandboxes, the durable build harness, the model gateway, the test service, GitHub and MCP integration, and the deploy pipeline.
