"use client";

import { useRouter } from "next/navigation";

const KEY = "alpha.prefill";

/** Hand a prompt to Home's composer: the person reads it there and chooses to plan it. */
export function usePrefill() {
  const router = useRouter();
  return (text: string) => {
    try {
      sessionStorage.setItem(KEY, text);
    } catch {}
    router.push("/home");
  };
}

/** Read, once, a prompt handed over from Explore or Help. */
export function takePrefill(): string | null {
  try {
    const v = sessionStorage.getItem(KEY);
    if (v) sessionStorage.removeItem(KEY);
    return v;
  } catch {
    return null;
  }
}
