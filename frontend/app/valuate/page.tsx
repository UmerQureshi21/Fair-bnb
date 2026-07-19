"use client";

import { RequireAuth } from "@/components/RequireAuth";
import { ExposeSection } from "@/components/ExposeSection";

export default function ValuatePage() {
  return (
    <RequireAuth>
      <ExposeSection />
    </RequireAuth>
  );
}
