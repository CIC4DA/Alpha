"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isDemo, loadJourney, saveJourney } from "./store";
import type { PrState } from "./devloop";
import type { ApiKey, EnvName, EnvVar } from "./devkit";

export type PlanItem = { name: string; detail: string };
export type PlanEdit = { summary: string; screens: PlanItem[]; agents: PlanItem[]; rules: string[] };

/** Per-project journey state for the scripted stages. The stage and status themselves live in the database. */
export type Journey = {
  answers: Record<string, string[]>;
  suggestedOn: string[];
  connected: Record<string, string>; // item id -> what was connected (file name, account)
  demoData: boolean;
  buildDone: number; // number of build steps finished
  testRun: "none" | "first" | "fixed";
  fixAttempts: number;
  review: "none" | "requested" | "approved" | "changes";
  reviewNote: string;
  version: number; // goes up each time a change is made after review
  fromBlueprint?: string; // "Loan Triage Desk, built for Kestrel Lending"
  handover?: { emails: string[]; at: string };
  blueprintSaved?: boolean;
  planEdit?: PlanEdit; // the builder's own edits to the plan; replaces the generated one
  reviewRequestedBy?: string; // user id; with a separate approver required, this person can't approve
  chat: {
    from: "user" | "architect";
    text: string;
    at: string;
    files?: string[];
    commit?: { sha: string; message: string };
    proposal?: { id: string; title: string; changes: string[]; status: "pending" | "applied" | "discarded" };
  }[];
  mcpServers?: { name: string; url: string }[];
  tools?: { name: string; detail: string }[];
  browserTest?: boolean; // click through every screen in a real browser after each build
  currentSha?: string; // set when the builder reverts to an earlier version
  github?: boolean; // repository connected
  prs?: Record<string, PrState>; // pull requests from a coding agent, by id
  models?: Partial<Record<string, string>>; // agent id -> model it runs on, after a tested switch
  blueprintId?: string; // started from this blueprint
  blueprintVersion?: number; // ...at this blueprint version
  fileEdits?: Record<string, string>; // path -> body, edited in the Developer view, the terminal or over MCP
  envs?: Partial<Record<EnvName, EnvVar[]>>; // settings per environment
  apiKeys?: ApiKey[]; // only a prefix of each key is kept
};

const empty: Journey = {
  answers: {},
  suggestedOn: [],
  connected: { locale: "Pounds sterling, UK English" },
  demoData: false,
  buildDone: 0,
  testRun: "none",
  fixAttempts: 0,
  review: "none",
  reviewNote: "",
  version: 1,
  chat: [],
};

/**
 * Journey state for one project. Saved after every change: to this browser in demo mode, to the project row
 * otherwise, so a builder and an approver on different accounts see the same review state. Re-read when the
 * tab regains focus, so the other person's changes show up without a reload.
 */
export function useJourney(projectId: string) {
  const [j, setJ] = useState<Journey>(empty);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef<Journey>(empty);

  const load = useCallback(async () => {
    try {
      const stored = await loadJourney(projectId);
      const next = stored ? ({ ...empty, ...stored } as Journey) : empty;
      latest.current = next;
      setJ(next);
    } catch {
      setJ(latest.current);
    }
    setLoaded(true);
  }, [projectId]);

  useEffect(() => {
    load();
    const onVisible = () => document.visibilityState === "visible" && !saveTimer.current && load();
    document.addEventListener("visibilitychange", onVisible);
    // With real accounts, changes can also arrive from a coding agent over MCP: check every few seconds.
    const poll = setInterval(async () => {
      if (isDemo() || document.visibilityState !== "visible" || saveTimer.current) return;
      try {
        const stored = await loadJourney(projectId);
        if (!stored || saveTimer.current) return;
        const next = { ...empty, ...stored } as Journey;
        if (JSON.stringify(next) !== JSON.stringify(latest.current)) {
          latest.current = next;
          setJ(next);
        }
      } catch {}
    }, 4000);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(poll);
    };
  }, [load, projectId]);

  const update = useCallback(
    (patch: Partial<Journey> | ((prev: Journey) => Partial<Journey>)) => {
      const prev = latest.current;
      const next = { ...prev, ...(typeof patch === "function" ? patch(prev) : patch) };
      latest.current = next;
      setJ(next);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveTimer.current = null;
        saveJourney(projectId, latest.current).catch(() => {});
      }, 250);
    },
    [projectId],
  );

  return { j, update, loaded };
}
