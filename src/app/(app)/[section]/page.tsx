import { notFound } from "next/navigation";

const SECTIONS: Record<string, { title: string; lead: string; points: string[] }> = {
  connections: {
    title: "Connections",
    lead: "Accounts and services your apps use, connected once for the whole organisation.",
    points: [
      "Gmail, Outlook, Slack, Google Drive, Salesforce and more, each showing exactly what it allows (for example, send-only).",
      "Tokens are kept in a vault and added on the way out by the egress proxy; app code never sees them.",
      "See which projects use each connection, and revoke it in one place.",
    ],
  },
};

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const s = SECTIONS[section];
  if (!s) notFound();
  return (
    <div className="mx-auto max-w-[760px] px-4 py-8 sm:px-8 sm:py-12">
      <h1 className="text-2xl font-semibold tracking-tight">{s.title}</h1>
      <p className="mt-1 text-ink-2">{s.lead}</p>
      <div className="mt-8 rounded-lg border border-line bg-surface p-5">
        <p className="text-sm font-semibold">What this page will hold</p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-2">
          {s.points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <p className="mt-4 text-[12px] text-ink-3">Described, not built, in this prototype. See the flows and screen map in the repo for the full design.</p>
      </div>
    </div>
  );
}
