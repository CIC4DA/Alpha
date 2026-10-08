"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadJourney, saveJourney } from "./store";

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
  chat: { from: "user" | "architect"; text: string; at: string }[];
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
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [load]);

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
