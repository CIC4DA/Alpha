"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AppPreview } from "@/components/workspace/app-preview";

function Live() {
  const { slug } = useParams<{ slug: string }>();
  const preview = useSearchParams().get("preview") === "1";
  return (
    <main className="min-h-screen bg-[#eef1f0] p-4 sm:p-8">
      <div className="mx-auto max-w-[1100px]">
        {preview && (
          <p className="mb-3 rounded-md bg-amber-wash px-3 py-2 text-[13px] text-amber">
            Preview. This version isn&apos;t live yet; changes here don&apos;t reach real applicants.
          </p>
        )}
        <AppPreview revealed={4} url={preview ? `preview--${slug}.architect.app` : `${slug}.architect.app`} />
        <p className="mt-4 text-center text-[12px] text-[#6b7a7e]">Built with Architect. A prototype: screens and data are illustrative.</p>
      </div>
    </main>
  );
}

export default function LivePage() {
  return (
    <Suspense>
      <Live />
    </Suspense>
  );
}
