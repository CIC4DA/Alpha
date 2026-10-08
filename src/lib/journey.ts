"use client";

import { useCallback, useEffect, useState } from "react";

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

const key = (id: string) => `alpha.journey.${id}`;

export function useJourney(projectId: string) {
  const [j, setJ] = useState<Journey>(empty);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key(projectId));
      setJ(raw ? { ...empty, ...(JSON.parse(raw) as Journey) } : empty);
    } catch {
      setJ(empty);
    }
    setLoaded(true);
  }, [projectId]);

  const update = useCallback(
    (patch: Partial<Journey> | ((prev: Journey) => Partial<Journey>)) => {
      setJ((prev) => {
        const next = { ...prev, ...(typeof patch === "function" ? patch(prev) : patch) };
        try {
          localStorage.setItem(key(projectId), JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    [projectId],
  );

  return { j, update, loaded };
}
