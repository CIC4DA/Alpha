/**
 * A fixed rule set that follows Kestrel's lending policy v1.0 clause by clause. The prototype's API answers from
 * it, so the endpoints are real and deterministic; in production the Policy agent answers, and these same cases
 * are its golden tests.
 */

export type Facts = {
  applicant?: string;
  amount_gbp?: number;
  purpose?: string;
  income_figures?: { value: number; source?: string }[];
  income_gbp?: number;
  trading_years?: number;
  [other: string]: unknown;
};

export type PolicyResult = { recommendation: "Approve" | "Decline" | "Manual Review"; cited: string[]; reason: string; ignored_fields?: string[] };

const PROTECTED = ["age", "date_of_birth", "gender", "sex", "marital_status", "religion", "race", "ethnicity", "disability", "pregnancy", "sexual_orientation"];
const PROHIBITED = /crypto|bitcoin|shares|securities|speculat|gambl|betting|personal debt/i;
const ELIGIBLE = /equipment|machin|router|oven|vehicle|tools?\b|working capital|refurb|premises|fit-?out|inventory|stock/i;

const gbp = (n: number) => `£${Math.round(n).toLocaleString("en-GB")}`;

export function policyCheck(f: Facts): PolicyResult {
  const ignored = Object.keys(f).filter((k) => PROTECTED.includes(k));
  const out = (recommendation: PolicyResult["recommendation"], cited: string[], reason: string): PolicyResult => ({ recommendation, cited, reason, ...(ignored.length ? { ignored_fields: ignored } : {}) });
  const figures = f.income_figures ?? (typeof f.income_gbp === "number" ? [{ value: f.income_gbp }] : []);
  const distinct = Array.from(new Set(figures.map((x) => x.value)));

  const missing = [!f.applicant && "applicant", typeof f.amount_gbp !== "number" && "amount_gbp", !figures.length && "income", !f.purpose && "purpose"].filter(Boolean);
  if (missing.length) return out("Manual Review", ["5.1"], `Missing required facts: ${missing.join(", ")}.`);
  if (distinct.length > 1)
    return out("Manual Review", ["5.2"], `Two different income figures (${figures.map((x) => `${gbp(x.value)}${x.source ? ` in ${x.source}` : ""}`).join(" and ")}). The officer must verify income before a recommendation.`);
  const amount = f.amount_gbp!;
  const income = distinct[0];
  const purpose = f.purpose!;
  if (amount < 5000) return out("Decline", ["2.2"], `${gbp(amount)} is below the £5,000 minimum.`);
  if (amount > 150000) return out("Manual Review", ["2.3"], `${gbp(amount)} is above £150,000, so the credit committee decides.`);
  if (PROHIBITED.test(purpose)) return out("Decline", ["4.2"], `"${purpose}" is a prohibited purpose.`);
  if (typeof f.trading_years === "number" && f.trading_years < 1) return out("Manual Review", ["2.1"], "Trading for less than 12 months.");
  const multiple = income / amount;
  const need = amount <= 50000 ? 2 : 2.5;
  const clause = amount <= 50000 ? "3.1" : "3.2";
  if (multiple < 1.5) return out("Decline", ["3.4"], `Income of ${gbp(income)} is ${multiple.toFixed(2)} times the loan, below 1.5.`);
  if (multiple < need) return out("Manual Review", [clause, "3.3"], `Income is ${multiple.toFixed(2)} times the loan: below the ${need} required, but at least 1.5.`);
  if (!ELIGIBLE.test(purpose)) return out("Manual Review", ["4.3"], `The purpose "${purpose}" isn't clearly eligible.`);
  return out("Approve", ["2.1", clause, "4.1"], `Income of ${gbp(income)} is ${multiple.toFixed(2)} times the ${gbp(amount)} loan (at least ${need} needed), and the purpose is eligible.`);
}

export function draftEmail(applicant: string, decision: string, clauses: string[], reason?: string) {
  const name = applicant || "Applicant";
  if (decision === "Approve")
    return `Dear ${name},\n\nWe're pleased to offer the loan you applied for. The offer is subject to completing the loan documentation and is not binding until it is signed.\n\nKind regards,\nKestrel Community Lending`;
  if (decision === "Decline")
    return `Dear ${name},\n\nThank you for your application. We're unable to offer a loan this time${reason ? `: ${reason.replace(/\.$/, "")}` : ""}${clauses.length ? ` (policy ${clauses.join(", ")})` : ""}. You may ask us to review this decision within 30 days.\n\nKind regards,\nKestrel Community Lending`;
  return `Dear ${name},\n\nThank you for your application. Before we can decide, we need to check some details with you; a loan officer will be in touch shortly.\n\nKind regards,\nKestrel Community Lending`;
}
