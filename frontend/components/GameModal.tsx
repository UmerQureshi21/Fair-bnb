"use client";

import { useEffect } from "react";

export function GameModal({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border-2 border-brand/30 bg-surface p-6 shadow-2xl sm:p-8">
        {children}
      </div>
    </div>
  );
}
