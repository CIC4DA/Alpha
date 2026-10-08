const FILLER = /^(please\s+)?(build|create|make|design|develop|write|generate)\s+(me\s+)?(an?|the)?\s*/i;
const TAIL = /\s+(app|application|tool|platform|system|dashboard|portal|website|site)$/i;
const SMALL = new Set(["a", "an", "the", "for", "of", "and", "to", "in", "on", "with"]);

function titleCase(s: string) {
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((w, i) => (i > 0 && SMALL.has(w.toLowerCase()) ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

/** "Build a loan application triage app for a small lending team." -> "Loan Application Triage" */
export function nameFromPrompt(prompt: string): string {
  const first = prompt.trim().split(/[.\n]/)[0] ?? "";
  let core = first.replace(FILLER, "");
  core = core.split(/\s+(?:for|that|which|to|so|where|with)\s+/i)[0];
  const kind = core.match(TAIL)?.[1];
  core = core.replace(TAIL, "");
  const words = core.split(/\s+/).filter(Boolean).slice(0, 5);
  if (words.length === 0) return "Untitled project";
  const name = titleCase(words.join(" "));
  return kind && !/app|application/i.test(kind) ? `${name} ${titleCase(kind)}` : name;
}

/** First sentence of the prompt, trimmed to a card-length description. */
export function describeFromPrompt(prompt: string): string {
  const first = prompt.trim().split(/(?<=[.!?])\s|\n/)[0] ?? "";
  const clean = first.replace(/^(please\s+)?(build|create|make)\s+(me\s+)?/i, "");
  const s = clean.charAt(0).toUpperCase() + clean.slice(1);
  return s.length > 140 ? `${s.slice(0, 137).trimEnd()}…` : s;
}

export function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40) || "project";
}
