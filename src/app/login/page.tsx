"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Mark } from "@/components/rail";
import { Button } from "@/components/ui";

const STAGES = [
  { name: "Plan", who: "Builder" },
  { name: "Connect", who: "Builder" },
  { name: "Build", who: "Builder, developer" },
  { name: "Test", who: "Everyone sees results" },
  { name: "Ship", who: "Approver signs off" },
];

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8Z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7H2.1a11 11 0 0 0 0 9.9l3.7-2.7Z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3 .6 4.2 1.6l3.1-3.1A11 11 0 0 0 2.1 7l3.7 2.9C6.7 7.3 9.1 5.4 12 5.4Z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="currentColor" d="M12 .5a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.3.8-.6v-2.1c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.9 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

export default function LoginPage() {
  const { ready, user, configured, signInWithProvider, signInWithEmail, startDemo } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && user) {
      const next = new URLSearchParams(window.location.search).get("next");
      router.replace(next && next.startsWith("/") ? next : "/home");
    }
  }, [ready, user, router]);

  const provider = async (p: "google" | "github") => {
    setBusy(true);
    setError(await signInWithProvider(p));
    setBusy(false);
  };

  const emailLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return setError("Enter your work email address.");
    setBusy(true);
    const err = await signInWithEmail(email);
    setBusy(false);
    if (err) setError(err);
    else setSent(true);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.15fr_1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden border-r border-line bg-surface px-14 py-12 lg:flex">
        <div className="flex items-center gap-2">
          <Mark className="h-6 w-6 text-blue" />
          <span className="text-lg font-semibold tracking-tight">Architect</span>
        </div>

        <div className="max-w-[34rem]">
          <h1 className="font-serif text-[38px] leading-[1.05] sm:text-[52px] tracking-[-0.01em] text-ink">
            Prototype to production in one project.
          </h1>
          <p className="mt-5 max-w-[30rem] text-[17px] leading-relaxed text-ink-2">
            Describe the agentic app you need. Architect builds it, tests it on your own files, hands it to your developers without a rewrite, and ships it once it&apos;s approved.
          </p>
        </div>

        {/* The journey as a drafting scale: five stages, one project, three roles. */}
        <div className="max-w-[36rem]">
          <div className="relative">
            <div className="absolute left-0 right-0 top-[7px] h-px bg-line-strong" />
            <ol className="relative grid grid-cols-5">
              {STAGES.map((s, i) => (
                <li key={s.name} className="pr-3">
                  <span className={`block h-[15px] w-[15px] rounded-full border-2 ${i === 3 ? "border-green bg-green" : "border-ink-3 bg-surface"}`} />
                  <p className="mt-3 text-sm font-semibold">{s.name}</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-ink-3">{s.who}</p>
                </li>
              ))}
            </ol>
          </div>
          <p className="mt-6 text-[13px] text-ink-3">Nothing reaches production until its tests pass on outcome and on reasons.</p>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[380px]">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <Mark className="h-6 w-6 text-blue" />
            <span className="text-lg font-semibold">Architect</span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
          <p className="mt-1.5 text-sm text-ink-2">Use your work account. Your organisation is set up on first sign-in.</p>

          {configured ? (
            <div className="mt-7 flex flex-col gap-2.5">
              <Button onClick={() => provider("google")} disabled={busy} className="w-full">
                <GoogleIcon /> Continue with Google
              </Button>
              <Button onClick={() => provider("github")} disabled={busy} className="w-full">
                <GitHubIcon /> Continue with GitHub
              </Button>

              <div className="my-3 flex items-center gap-3 text-[12px] text-ink-3">
                <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
              </div>

              {sent ? (
                <div className="rounded-md border border-green/30 bg-green-wash p-3 text-sm text-green">
                  Check {email} for a sign-in link. It works once and expires in an hour.
                </div>
              ) : (
                <form onSubmit={emailLink} className="flex flex-col gap-2.5">
                  <label htmlFor="email" className="text-[13px] font-medium text-ink-2">
                    Work email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="h-10 rounded-md border border-line-strong bg-surface px-3 text-sm outline-none focus:border-blue"
                  />
                  <Button type="submit" variant="primary" disabled={busy} className="w-full">
                    <Mail size={16} /> Email me a sign-in link
                  </Button>
                </form>
              )}
            </div>
          ) : (
            <p className="mt-7 rounded-md border border-amber/30 bg-amber-wash p-3 text-sm text-amber">
              Sign-in isn&apos;t configured on this deployment. You can still explore everything in demo mode.
            </p>
          )}

          {error && <p className="mt-3 text-sm text-red">{error}</p>}

          <div className="mt-8 border-t border-line pt-6">
            <Button variant="ghost" onClick={startDemo} className="w-full">
              Explore without an account
            </Button>
            <p className="mt-2 text-center text-[12px] text-ink-3">Demo mode keeps your projects in this browser only.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
