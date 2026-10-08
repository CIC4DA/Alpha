"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Rail } from "@/components/rail";

function Gate({ children }: { children: React.ReactNode }) {
  const { ready, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [ready, user, router, pathname]);

  if (!ready || !user) {
    return <div className="flex h-screen items-center justify-center text-sm text-ink-3">Loading your workspace</div>;
  }

  const inProject = pathname.startsWith("/p/");
  return (
    <div className="flex min-h-screen">
      <Rail collapsedByDefault={inProject} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}

const loading = <div className="flex h-screen items-center justify-center text-sm text-ink-3">Loading your workspace</div>;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={loading}>
      <Gate>{children}</Gate>
    </Suspense>
  );
}
