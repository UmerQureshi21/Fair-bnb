"use client";

import { useState } from "react";
import { ModeToggle, type Mode } from "./ModeToggle";
import { ExposeForm } from "./ExposeForm";
import { ResultDisplay, type ValuateResult } from "./ResultDisplay";
import { ValuationHistory } from "./ValuationHistory";

export function ExposeSection() {
  const [mode, setMode] = useState<Mode>("looking");
  const [result, setResult] = useState<ValuateResult | null>(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  return (
    <div className="mx-4 mt-8 mb-14 sm:mx-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <div className="md:w-[30%]">
          <ModeToggle value={mode} onChange={setMode} />
        </div>
        <div className="md:w-[70%]">
          <ExposeForm mode={mode} onResult={setResult} />
        </div>
      </div>

      {result && (
        <div className="mt-6 w-full">
          <ResultDisplay
            mode={mode}
            result={result}
            onSaved={() => setHistoryRefreshKey((k) => k + 1)}
          />
        </div>
      )}

      <ValuationHistory refreshKey={historyRefreshKey} />
    </div>
  );
}
