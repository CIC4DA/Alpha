"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, Inbox, FolderKanban, Bot, Plug, Compass, Settings, LifeBuoy, LogOut, ChevronsLeft, ChevronsRight, Plus, Wallet } from "lucide-react";
import { listProjects, type Project } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { StatusBadge } from "./ui";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { CreditsPill } from "./credits";

export function Mark({ className = "" }: { className?: string }) {
  // A set square: the drafting tool, not a letter in a box.
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M3 21V3l18 18H3Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M7 17V12.5l4.5 4.5H7Z" fill="currentColor" />
    </svg>
  );
}

const NAV = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/connections", label: "Connections", icon: Plug },
  { href: "/explore", label: "Explore", icon: Compass },
];

export function Rail({ collapsedByDefault = false }: { collapsedByDefault?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut, mode } = useAuth();
  const [recent, setRecent] = useState<Project[]>([]);
  const [collapsed, setCollapsed] = useState(collapsedByDefault);

  // Collapsed inside a project, and always on narrow screens, where the full rail would take half the width.
  useEffect(() => {
    setCollapsed(collapsedByDefault || window.matchMedia("(max-width: 767px)").matches);
  }, [collapsedByDefault]);

  useEffect(() => {
    let alive = true;
    const load = () => listProjects().then((p) => alive && setRecent(p.slice(0, 5))).catch(() => {});
    load();
    window.addEventListener("alpha:projects", load);
    return () => {
      alive = false;
      window.removeEventListener("alpha:projects", load);
    };
  }, []);

  const item = (href: string, label: string, Icon: typeof Home) => {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return (
      <Link
        key={href}
        href={href}
        title={collapsed ? label : undefined}
        className={`flex h-9 items-center gap-3 rounded-md px-2.5 text-sm ${active ? "bg-blue-wash text-blue-ink font-medium" : "text-ink-2 hover:bg-line/50 hover:text-ink"}`}
      >
        <Icon size={17} strokeWidth={1.8} className="shrink-0" />
        {!collapsed && <span className="truncate">{label}</span>}
      </Link>
    );
  };

  return (
    <aside className={`sticky top-0 flex h-screen shrink-0 flex-col border-r border-line bg-surface transition-[width] ${collapsed ? "w-[60px]" : "w-[248px]"}`}>
      <div className="flex h-14 items-center gap-2 px-4">
        <Mark className="h-5 w-5 text-blue" />
        {!collapsed && <span className="font-semibold tracking-tight">Architect</span>}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="ml-auto rounded p-1 text-ink-3 hover:bg-line/50 hover:text-ink"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        </button>
      </div>

      <div className="px-2 pb-2">
        <WorkspaceSwitcher collapsed={collapsed} />
      </div>

      {/* Recents first: returning to yesterday's work is the most common thing people do. */}
      <div className="px-2 pb-2">
        {!collapsed ? (
          <div className="rounded-lg border border-line p-1.5">
            <div className="flex items-center justify-between px-1.5 pb-1 pt-0.5">
              <span className="text-[12px] font-medium text-ink-3">Recent projects</span>
              <button onClick={() => router.push("/home")} className="rounded p-0.5 text-ink-3 hover:text-blue" aria-label="New project">
                <Plus size={14} />
              </button>
            </div>
            {recent.length === 0 && <p className="px-1.5 pb-1.5 text-[13px] text-ink-3">Your projects appear here.</p>}
            {recent.map((p) => {
              const active = pathname === `/p/${p.id}`;
              return (
                <Link
                  key={p.id}
                  href={`/p/${p.id}`}
                  className={`flex items-center justify-between gap-2 rounded-md px-1.5 py-1.5 text-[13px] ${active ? "bg-blue-wash text-blue-ink" : "text-ink hover:bg-line/50"}`}
                >
                  <span className="truncate">{p.name}</span>
                  {p.status !== "draft" && <StatusBadge status={p.status} />}
                </Link>
              );
            })}
          </div>
        ) : (
          <button onClick={() => router.push("/projects")} title="Projects" className="flex h-9 w-full items-center justify-center rounded-md text-ink-2 hover:bg-line/50">
            <FolderKanban size={17} strokeWidth={1.8} />
          </button>
        )}
      </div>

      <nav className="flex flex-col gap-0.5 px-2">{NAV.map((n) => item(n.href, n.label, n.icon))}</nav>

      <div className="mt-auto flex flex-col gap-0.5 border-t border-line px-2 py-2">
        {collapsed ? item("/usage", "Usage and credits", Wallet) : <div className="mb-1"><CreditsPill compact /></div>}
        {item("/settings", "Workspace settings", Settings)}
        {item("/help", "Help", LifeBuoy)}
        <div className={`mt-1 flex items-center gap-2 rounded-md px-2.5 py-2 ${collapsed ? "justify-center" : ""}`}>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-[12px] font-semibold text-white">
            {(user?.name ?? "?").slice(0, 1).toUpperCase()}
          </span>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium">{user?.name}</p>
              <p className="truncate text-[12px] text-ink-3">{mode === "demo" ? "Demo mode, saved in this browser" : user?.email}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={async () => {
                await signOut();
                router.replace("/login");
              }}
              className="rounded p-1 text-ink-3 hover:text-ink"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
