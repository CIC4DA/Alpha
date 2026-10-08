"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function Index() {
  const { ready, user } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (ready) router.replace(user ? "/home" : "/login");
  }, [ready, user, router]);
  return null;
}
