"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Check, ChevronDown, Lightbulb, Palette, Search, Sparkles, Star, Store, LayoutTemplate, GraduationCap, MessagesSquare, FileText } from "lucide-react";
import { DESIGN_SYSTEMS, GUIDES, LISTINGS, PROMPTS, PROMPT_CATEGORIES, ROLES, type Guide } from "@/lib/explore-content";
import { SAMPLE_PROMPT } from "@/lib/fixtures";
import { Button } from "@/components/ui";
import { usePrefill } from "@/lib/prefill";

type Tab = "ideas" | "prompts" | "marketplace" | "templates" | "design" | "learn";
const TABS: { id: Tab; label: string; icon: typeof Lightbulb }[] = [
  { id: "ideas", label: "What should I build", icon: Lightbulb },
  { id: "prompts", label: "Prompt library", icon: Sparkles },
  { id: "marketplace", label: "Marketplace", icon: Store },
  { id: "templates", label: "Templates", icon: LayoutTemplate },
  { id: "design", label: "Design systems", icon: Palette },
  { id: "learn", label: "Learn", icon: GraduationCap },
];

function Ideas() {
  const use = usePrefill();
  const [role, setRole] = useState<string | null>(null);
  const [pain, setPain] = useState("");
  const [asked, setAsked] = useState(false);
  const r = ROLES.find((x) => x.id === role);
  return (
    <div className="max-w-3xl">
      <p className="text-sm text-ink-2">Tell Architect what you do and what slows you down. It suggests apps worth building first, with the time each could save.</p>
      <h2 className="mt-6 text-sm font-semibold">What&apos;s your role?</h2>
      <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Role">
        {ROLES.map((x) => (
          <button
            key={x.id}
            role="radio"
            aria-checked={role === x.id}
            onClick={() => {
              setRole(x.id);
              setAsked(false);
            }}
            className={`h-9 rounded-md border px-3 text-sm ${role === x.id ? "border-blue bg-blue-wash text-blue-ink" : "border-line-strong bg-surface hover:border-ink-3"}`}
          >
            {x.label}
          </button>
        ))}
      </div>
      {role && (
        <form
          className="mt-6"
          onSubmit={(e) => {
            e.preventDefault();
            setAsked(true);
          }}
        >
          <label htmlFor="pain" className="text-sm font-semibold">
            What takes up your week? <span className="font-normal text-ink-3">(optional)</span>
          </label>
          <textarea id="pain" value={pain} onChange={(e) => setPain(e.target.value)} rows={2} placeholder="For example: re-keying figures from PDFs, chasing missing documents" className="mt-2 w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-sm outline-none focus:border-blue" />
          <Button type="submit" variant="primary" size="sm" className="mt-2">
            Suggest apps
          </Button>
        </form>
      )}
      {asked && r && (
        <ul className="mt-6 space-y-3">
          {r.ideas.map((i) => (
            <li key={i.title} className="rounded-lg border border-line bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{i.title}</p>
                  <p className="mt-0.5 text-sm text-ink-2">{i.why}</p>
                  <p className="mt-1.5 text-[13px] text-green">Estimated: {i.saves}</p>
                </div>
                <Button size="sm" onClick={() => use(i.prompt)}>
                  Start with this
                </Button>
              </div>
            </li>
          ))}
          {pain.trim() && (
            <li className="rounded-lg border border-dashed border-line-strong p-4">
              <p className="font-medium">Your own: &ldquo;{pain.trim()}&rdquo;</p>
              <p className="mt-0.5 text-sm text-ink-2">Start from what you wrote. Architect will ask about anything it leaves open before it plans.</p>
              <Button size="sm" className="mt-2" onClick={() => use(`Build an app that helps with this: ${pain.trim()}`)}>
                Start with this
              </Button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

function Prompts() {
  const use = usePrefill();
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const shown = PROMPTS.filter((p) => (cat === "All" || p.category === cat) && (!q || `${p.title} ${p.text}`.toLowerCase().includes(q.toLowerCase())));
  return (
    <div>
      <p className="text-sm text-ink-2">Prompts that already answer what Architect would ask: who uses the app, what the agents check, and where a person confirms.</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <label className="flex h-9 w-full max-w-xs items-center gap-2 rounded-md border border-line-strong bg-surface px-2.5">
          <Search size={14} className="text-ink-3" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search prompts" aria-label="Search prompts" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
        </label>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Category">
          {["All", ...PROMPT_CATEGORIES].map((c) => (
            <button key={c} onClick={() => setCat(c)} aria-pressed={cat === c} className={`h-8 rounded-md px-2.5 text-[13px] ${cat === c ? "bg-ink text-white" : "text-ink-2 hover:bg-surface"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>
      {shown.length === 0 ? (
        <p className="mt-6 text-sm text-ink-2">No prompts match. Try another word, or write your own on Home.</p>
      ) : (
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {shown.map((p) => (
            <li key={p.title} className="flex flex-col rounded-lg border border-line bg-surface p-4">
              <p className="text-[12px] text-ink-3">{p.category}</p>
              <p className="font-medium">{p.title}</p>
              <p className="mt-1 line-clamp-4 flex-1 text-[13px] leading-relaxed text-ink-2">{p.text}</p>
              <div className="mt-3">
                <Button size="sm" onClick={() => use(p.text)}>
                  Use this prompt
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Marketplace() {
  const use = usePrefill();
  const [sort, setSort] = useState<"popular" | "recent" | "rated">("popular");
  const [cats, setCats] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const all = Array.from(new Set(LISTINGS.map((l) => l.category))).sort();
  const shown = LISTINGS.filter((l) => (!cats.length || cats.includes(l.category)) && (!q || `${l.name} ${l.summary} ${l.by}`.toLowerCase().includes(q.toLowerCase()))).sort((a, b) =>
    sort === "popular" ? b.uses - a.uses : sort === "recent" ? b.added.localeCompare(a.added) : b.rating - a.rating,
  );
  return (
    <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
      <aside aria-label="Filters">
        <p className="text-[13px] font-semibold">Categories</p>
        <ul className="mt-2 space-y-1">
          {all.map((c) => (
            <li key={c}>
              <label className="flex items-center gap-2 text-[13px]">
                <input type="checkbox" checked={cats.includes(c)} onChange={(e) => setCats((x) => (e.target.checked ? [...x, c] : x.filter((y) => y !== c)))} />
                {c}
              </label>
            </li>
          ))}
        </ul>
        {cats.length > 0 && (
          <button onClick={() => setCats([])} className="mt-2 text-[12px] text-blue hover:underline">
            Clear
          </button>
        )}
      </aside>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md border border-line-strong bg-surface px-2.5">
            <Search size={14} className="text-ink-3" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search apps by name, purpose or author" aria-label="Search the marketplace" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
          </label>
          <div className="flex rounded-md border border-line-strong p-0.5" role="group" aria-label="Sort">
            {(
              [
                ["popular", "Most used"],
                ["recent", "Newest"],
                ["rated", "Top rated"],
              ] as const
            ).map(([id, label]) => (
              <button key={id} onClick={() => setSort(id)} aria-pressed={sort === id} className={`rounded px-2.5 py-1 text-[12px] ${sort === id ? "bg-ink text-white" : "text-ink-2"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-3 text-[13px] text-ink-3">{shown.length} apps shared by the community. Remixing copies the idea, never the author&apos;s data or accounts.</p>
        <ul className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((l) => (
            <li key={l.name} className="flex flex-col rounded-lg border border-line bg-surface p-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-wash font-semibold text-blue-ink">{l.name[0]}</span>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{l.name}</span>
                  <span className="block text-[12px] text-ink-3">by {l.by}</span>
                </span>
              </div>
              <p className="mt-2 flex-1 text-[13px] leading-relaxed text-ink-2">{l.summary}</p>
              <div className="mt-3 flex items-center justify-between gap-2 text-[12px] text-ink-3">
                <span className="tabular-nums">
                  {l.uses.toLocaleString("en-GB")} uses, <Star size={11} className="-mt-0.5 inline text-amber" aria-label="rated" /> {l.rating.toFixed(1)}
                </span>
                <Button size="sm" onClick={() => use(l.prompt)}>
                  Remix
                </Button>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[12px] text-ink-3">Sample listings in this prototype.</p>
      </div>
    </div>
  );
}

const TEMPLATE_LIST = [
  { name: "Loan application triage", detail: "Extract facts from PDFs, check a lending policy with citations, draft replies for an officer to confirm.", prompt: SAMPLE_PROMPT, ready: true },
  { name: "Meeting brief assistant", detail: "Reads tomorrow's calendar and prepares a one-page brief per external meeting.", prompt: "", ready: false },
  { name: "Support ticket triage", detail: "Classify tickets, draft replies from the help centre, route urgent ones.", prompt: "", ready: false },
  { name: "Invoice checker", detail: "Match supplier invoices to purchase orders and flag mismatches before payment.", prompt: "", ready: false },
];

function Templates() {
  const use = usePrefill();
  return (
    <div className="max-w-3xl">
      <p className="text-sm text-ink-2">Templates come with their questions answered, sample files and golden tests, so the whole journey runs end to end. Your own saved apps are under Blueprints.</p>
      <ul className="mt-4 divide-y divide-line rounded-lg border border-line bg-surface">
        {TEMPLATE_LIST.map((t) => (
          <li key={t.name} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <LayoutTemplate size={16} className="text-ink-3" />
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{t.name}</span>
              <span className="block text-[13px] text-ink-2">{t.detail}</span>
            </span>
            {t.ready ? (
              <Button size="sm" variant="primary" onClick={() => use(t.prompt)}>
                Use template
              </Button>
            ) : (
              <span className="text-[12px] text-ink-3">Coming soon</span>
            )}
          </li>
        ))}
      </ul>
      <Link href="/blueprints" className="mt-3 inline-block text-[13px] font-medium text-blue hover:underline">
        Your blueprints
      </Link>
    </div>
  );
}

function DesignSystems() {
  const [pick, setPick] = useState("ledger");
  useEffect(() => {
    try {
      setPick(localStorage.getItem("alpha.design-system") ?? "ledger");
    } catch {}
  }, []);
  return (
    <div>
      <p className="max-w-2xl text-sm text-ink-2">The look new apps are built with: colours, type and corner style. Pick one before you build; you can change an app&apos;s look later in chat.</p>
      <ul className="mt-4 grid gap-3 md:grid-cols-2">
        {DESIGN_SYSTEMS.map((d) => (
          <li key={d.id} className={`rounded-lg border bg-surface p-4 ${pick === d.id ? "border-blue" : "border-line"}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{d.name}</p>
                <p className="text-[13px] text-ink-2">{d.summary}</p>
              </div>
              {pick === d.id ? (
                <span className="flex items-center gap-1 text-[12px] font-medium text-blue">
                  <Check size={13} /> Default
                </span>
              ) : (
                <Button
                  size="sm"
                  onClick={() => {
                    setPick(d.id);
                    try {
                      localStorage.setItem("alpha.design-system", d.id);
                    } catch {}
                  }}
                >
                  Use for new apps
                </Button>
              )}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex">
                {d.colors.map((c) => (
                  <span key={c} className="h-7 w-7 border border-black/10 first:rounded-l-md last:rounded-r-md" style={{ background: c }} title={c} />
                ))}
              </div>
              <span className="text-[12px] text-ink-3">
                {d.font}, corners {d.radius}
              </span>
            </div>
            <div className="mt-3 rounded-md border border-line p-3" style={{ background: d.colors[2], borderRadius: d.radius }}>
              <p className="text-[13px] font-semibold" style={{ color: d.colors[0] }}>
                Application KCL-0103
              </p>
              <p className="text-[12px]" style={{ color: d.colors[0], opacity: 0.7 }}>
                Manual Review, cites 5.2
              </p>
              <span className="mt-2 inline-block px-2.5 py-1 text-[12px] font-medium text-white" style={{ background: d.colors[1], borderRadius: d.radius }}>
                Confirm facts
              </span>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[12px] text-ink-3">Your choice is remembered in this browser in the prototype.</p>
    </div>
  );
}

const STAGES = [
  { name: "Plan", text: "Describe the work. Architect asks only what your prompt leaves open, then shows a one-screen plan and its price." },
  { name: "Connect", text: "Add your real files, accounts and locale before anything is built, so the first preview runs on your data." },
  { name: "Build", text: "Screens appear in the preview as they're built; the agents are a graph you can edit in place." },
  { name: "Test", text: "Your own cases, checked on the outcome and on the reason. Fixes for our mistakes are free." },
  { name: "Ship", text: "A checklist from your plan's rules, a review when your workspace needs one, then deploy where the customer needs it." },
];

function GuideCard({ g }: { g: Guide }) {
  const use = usePrefill();
  const [open, setOpen] = useState(false);
  return (
    <li className="rounded-lg border border-line bg-surface">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-start gap-3 p-4 text-left">
        {g.kind === "Tutorial" ? <BookOpen size={16} className="mt-0.5 shrink-0 text-blue" /> : <FileText size={16} className="mt-0.5 shrink-0 text-green" />}
        <span className="min-w-0 flex-1">
          <span className="block text-[12px] text-ink-3">
            {g.kind}, {g.area}, {g.minutes} min
          </span>
          <span className="block font-medium">{g.title}</span>
          <span className="block text-[13px] text-ink-2">{g.summary}</span>
        </span>
        <ChevronDown size={15} className={`mt-1 shrink-0 text-ink-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-line px-4 pb-4 pt-3">
          {g.steps && (
            <ol className="list-decimal space-y-1 pl-5 text-[13px] text-ink-2">
              {g.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          )}
          {g.prompt && (
            <Button size="sm" className="mt-1" onClick={() => use(g.prompt!)}>
              Start from this use case
            </Button>
          )}
        </div>
      )}
    </li>
  );
}

function Learn() {
  const [kind, setKind] = useState<"All" | "Tutorial" | "Use case">("All");
  const shown = GUIDES.filter((g) => kind === "All" || g.kind === kind);
  return (
    <div>
      <section aria-label="How it works">
        <h2 className="text-sm font-semibold">How it works</h2>
        <ol className="mt-3 grid gap-3 md:grid-cols-5">
          {STAGES.map((s, i) => (
            <li key={s.name} className="rounded-lg border border-line bg-surface p-3">
              <p className="text-[12px] text-ink-3">Stage {i + 1}</p>
              <p className="font-medium">{s.name}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-8" aria-label="Guides">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Tutorials and use cases</h2>
          <div className="flex rounded-md border border-line-strong p-0.5" role="group" aria-label="Kind">
            {(["All", "Tutorial", "Use case"] as const).map((k) => (
              <button key={k} onClick={() => setKind(k)} aria-pressed={kind === k} className={`rounded px-2.5 py-1 text-[12px] ${kind === k ? "bg-ink text-white" : "text-ink-2"}`}>
                {k === "All" ? "All" : `${k}s`}
              </button>
            ))}
          </div>
        </div>
        <ul className="mt-3 grid gap-3 md:grid-cols-2">
          {shown.map((g) => (
            <GuideCard key={g.title} g={g} />
          ))}
        </ul>
      </section>

      <section className="mt-8" aria-label="More">
        <h2 className="text-sm font-semibold">More</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            { href: "https://docs.architect.new/", label: "Docs", detail: "Reference for every feature", icon: BookOpen },
            { href: "https://university.lyzr.ai/", label: "Lyzr University", detail: "Courses on building agents", icon: GraduationCap },
            { href: "https://discord.gg/Y2hjUEyGBP", label: "Community on Discord", detail: "Ask other builders", icon: MessagesSquare },
          ].map((l) => (
            <li key={l.label}>
              <a href={l.href} target="_blank" rel="noreferrer" className="flex items-start gap-3 rounded-lg border border-line bg-surface p-4 hover:border-ink-3">
                <l.icon size={16} className="mt-0.5 text-ink-3" />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{l.label}</span>
                  <span className="block text-[13px] text-ink-2">{l.detail}</span>
                </span>
                <ArrowUpRight size={14} className="text-ink-3" />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default function ExplorePage() {
  const [tab, setTab] = useState<Tab>("ideas");
  useEffect(() => {
    const h = window.location.hash.slice(1) as Tab;
    if (TABS.some((t) => t.id === h)) setTab(h);
  }, []);
  const go = (t: Tab) => {
    setTab(t);
    history.replaceState(null, "", `#${t}`);
  };
  return (
    <div className="mx-auto max-w-[1120px] px-4 py-8 sm:px-8 sm:py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Explore</h1>
      <p className="mt-1 text-sm text-ink-2">Ideas, prompts, apps others built, and how to get the most out of Architect.</p>
      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-line" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => go(t.id)}
            className={`-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm ${tab === t.id ? "border-blue font-medium" : "border-transparent text-ink-3 hover:text-ink"}`}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>
      <div className="mt-6">
        {tab === "ideas" && <Ideas />}
        {tab === "prompts" && <Prompts />}
        {tab === "marketplace" && <Marketplace />}
        {tab === "templates" && <Templates />}
        {tab === "design" && <DesignSystems />}
        {tab === "learn" && <Learn />}
      </div>
    </div>
  );
}
