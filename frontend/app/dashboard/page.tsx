"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ExposeSection } from "@/components/ExposeSection";
import { Nav } from "@/components/Nav";

export default function DashboardPage() {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === "guest") router.replace("/login");
  }, [status, router]);

  if (status !== "authed") {
    return (
      <div className="flex min-h-full flex-1 flex-col bg-page">
        <Nav />
        <div className="flex flex-1 items-center justify-center px-6 py-16">
          <p className="text-sm text-muted">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-page">
      <Nav />
      <ExposeSection />
    </div>
  );
}
