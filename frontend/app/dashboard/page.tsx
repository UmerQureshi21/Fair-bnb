"use client";

import { RequireAuth } from "@/components/RequireAuth";
import { ValuationHistory } from "@/components/ValuationHistory";

export default function DashboardPage() {
  return (
    <RequireAuth>
      <div className="mx-4 mt-8 mb-14 sm:mx-10">
        <h1 className="text-2xl font-extrabold text-fg">Your saved valuations</h1>
        <p className="mt-1 text-sm text-muted">
          Every valuation you&apos;ve saved from the Valuate tab, in one place.
        </p>
        <ValuationHistory refreshKey={0} />
      </div>
    </RequireAuth>
  );
}
