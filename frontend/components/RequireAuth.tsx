"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Nav } from "./Nav";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === "guest") router.replace("/login");
  }, [status, router]);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-page">
      <Nav />
      {status !== "authed" ? (
        <div className="flex flex-1 items-center justify-center px-6 py-16">
          <p className="text-sm text-muted">Loading…</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
