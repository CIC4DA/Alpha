"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Plus, Building2 } from "lucide-react";
import { createWorkspace, getOrg, listOrgs, switchOrg, type Org } from "@/lib/store";

/** One workspace per customer: switching changes the projects, members, approval rule and deploy target in view. */
export function WorkspaceSwitcher({ collapsed }: { collapsed: boolean }) {
  const router = useRouter();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [current, setCurrent] = useState<Org | null>(null);
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = () => {
      listOrgs().then(setOrgs).catch(() => {});
      getOrg().then(setCurrent).catch(() => {});
    };
    load();
    window.addEventListener("alpha:org", load);
    return () => window.removeEventListener("alpha:org", load);
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && (setOpen(false), setAdding(false));
    const esc = (e: KeyboardEvent) => e.key === "Escape" && (setOpen(false), setAdding(false));
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  if (!current) return <div className="h-11" />;

  const pick = (id: string) => {
    switchOrg(id);
    setOpen(false);
    router.push("/home");
  };

  const add = async () => {
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await createWorkspace(name.trim(), "customer");
      setName("");
      setAdding(false);
      setOpen(false);
      router.push("/settings");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const initial = current.name.slice(0, 1).toUpperCase();

  return (
    <div ref={box} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        title={collapsed ? `Workspace: ${current.name}` : undefined}
        className={`flex w-full items-center gap-2.5 rounded-lg border border-line px-2 py-1.5 text-left hover:border-line-strong ${collapsed ? "justify-center border-transparent" : ""}`}
      >
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[12px] font-semibold ${current.kind === "customer" ? "bg-amber-wash text-amber" : "bg-blue-wash text-blue-ink"}`}>{initial}</span>
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium">{current.name}</span>
              <span className="block text-[11px] text-ink-3">{current.kind === "customer" ? "Customer workspace" : "Personal"}</span>
            </span>
            <ChevronsUpDown size={14} className="shrink-0 text-ink-3" />
          </>
        )}
      </button>

      {open && (
        <div role="menu" className="absolute left-0 top-full z-40 mt-1 w-[260px] rounded-lg border border-line-strong bg-surface p-1.5 shadow-[0_12px_32px_-12px_rgba(24,32,46,0.35)]">
          <p className="px-2 pb-1 pt-1 text-[12px] text-ink-3">Workspaces</p>
          {orgs.map((o) => (
            <button key={o.id} role="menuitem" onClick={() => pick(o.id)} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-paper">
              <Building2 size={14} className={o.kind === "customer" ? "text-amber" : "text-blue"} />
              <span className="min-w-0 flex-1 truncate">{o.name}</span>
              {o.id === current.id && <Check size={14} className="text-blue" />}
            </button>
          ))}
          <div className="mt-1 border-t border-line pt-1">
            {adding ? (
              <form
                className="p-1.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  add();
                }}
              >
                <label htmlFor="ws-name" className="text-[12px] text-ink-2">
                  Customer name
                </label>
                <input
                  id="ws-name"
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Kestrel Lending"
                  className="mt-1 h-8 w-full rounded-md border border-line-strong px-2 text-[13px] outline-none focus:border-blue"
                />
                <p className="mt-1.5 text-[11px] leading-snug text-ink-3">Its own members, connections, approval rule and deploy target. Nothing is shared with your other workspaces.</p>
                {error && <p className="mt-1 text-[12px] text-red">{error}</p>}
                <button type="submit" disabled={busy || !name.trim()} className="mt-2 h-8 w-full rounded-md bg-blue text-[13px] font-medium text-white disabled:opacity-45">
                  {busy ? "Creating" : "Create workspace"}
                </button>
              </form>
            ) : (
              <button role="menuitem" onClick={() => setAdding(true)} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] text-blue hover:bg-paper">
                <Plus size={14} /> New customer workspace
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
