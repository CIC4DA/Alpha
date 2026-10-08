"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { listProjects, type Project, type Status } from "@/lib/store";
import { ProjectCard } from "@/components/project-card";
import { ButtonLink } from "@/components/ui";

const FILTERS: { id: "all" | Status; label: string }[] = [
  { id: "all", label: "All" },
  { id: "draft", label: "Draft" },
  { id: "preview", label: "Preview" },
  { id: "in_review", label: "In review" },
  { id: "live", label: "Live" },
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    listProjects().then(setProjects).catch((e) => setError(e.message));
  }, []);

  const shown = useMemo(
    () =>
      (projects ?? []).filter(
        (p) => (filter === "all" || p.status === filter) && `${p.name} ${p.description}`.toLowerCase().includes(q.toLowerCase()),
      ),
    [projects, filter, q],
  );

  return (
    <div className="mx-auto max-w-[1040px] px-8 py-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-ink-2">Every app your organisation is building or running.</p>
        </div>
        <ButtonLink href="/home" variant="primary">New project</ButtonLink>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search projects"
            aria-label="Search projects"
            className="h-9 w-64 rounded-md border border-line-strong bg-surface pl-9 pr-3 text-sm outline-none focus:border-blue"
          />
        </div>
        <div className="flex gap-1" role="group" aria-label="Filter by status">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={`h-9 rounded-md px-3 text-sm ${filter === f.id ? "bg-ink text-white" : "text-ink-2 hover:bg-line/50"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mt-6 text-sm text-red">{error}</p>}
      {projects === null && !error && <p className="mt-6 text-sm text-ink-3">Loading projects</p>}
      {projects && shown.length === 0 && (
        <p className="mt-10 text-center text-sm text-ink-2">{projects.length === 0 ? "No projects yet. Start one from Home." : "No projects match this filter."}</p>
      )}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((p) => (
          <ProjectCard key={p.id} p={p} />
        ))}
      </div>
    </div>
  );
}
