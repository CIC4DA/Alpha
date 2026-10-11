import { NextResponse } from "next/server";
import { draftEmail, policyCheck, type Facts } from "@/lib/policy-engine";

/**
 * The project's agents as an API. In the prototype every project answers from the same rule set, which follows the
 * lending policy clause by clause; keys must look like Architect keys but aren't checked yet.
 */
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: cors });

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string; path: string[] }> }) {
  const { id, path } = await params;
  const route = path.join("/");
  const auth = req.headers.get("authorization") ?? "";
  if (!/^Bearer ak_(test|live)_\w+$/.test(auth)) return json({ error: "Send an API key as: Authorization: Bearer ak_test_... Create one in the project's Developer view, API." }, 401);

  let body: Facts & { decision?: string; clauses?: string[] };
  try {
    body = await req.json();
  } catch {
    return json({ error: "The body must be JSON." }, 400);
  }
  const run = { run_id: `run_${crypto.randomUUID().slice(0, 8)}`, project: id, environment: auth.includes("_live_") ? "production" : "preview" };

  if (route === "agents/policy/run") return json({ ...policyCheck(body), ...run });
  if (route === "agents/drafting/run") {
    if (!body.decision) return json({ error: "Send the officer's decision: Approve, Decline or Manual Review." }, 400);
    return json({ email: draftEmail(body.applicant ?? "", body.decision, body.clauses ?? []), sent: false, note: "Never sent: an officer confirms each email in the app (policy 8.2).", ...run });
  }
  if (route === "triage") {
    const p = policyCheck(body);
    return json({ ...p, draft_email: draftEmail(body.applicant ?? "", p.recommendation, p.cited, p.reason), requires_officer_confirmation: true, ...run });
  }
  return json({ error: `No endpoint at /${route}. Try /triage, /agents/policy/run or /agents/drafting/run.` }, 404);
}
