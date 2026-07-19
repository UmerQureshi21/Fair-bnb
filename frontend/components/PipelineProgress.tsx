export type StepId = "embed_input" | "fetch_hotels" | "embed_hotels" | "compare";
export type StepStatus = "pending" | "active" | "done";
export type Steps = Record<StepId, StepStatus>;

export const STEP_ORDER: StepId[] = ["embed_input", "fetch_hotels", "embed_hotels", "compare"];

export const initialSteps: Steps = {
  embed_input: "pending",
  fetch_hotels: "pending",
  embed_hotels: "pending",
  compare: "pending",
};

const GRADIENT = "linear-gradient(to right, var(--color-brand), #7b86f4)";

export function PipelineProgress({
  steps,
  labels,
  embedProgress,
}: {
  steps: Steps;
  labels: Record<StepId, string>;
  embedProgress: { current: number; total: number } | null;
}) {
  const doneCount = STEP_ORDER.filter((id) => steps[id] === "done").length;
  const activeId = STEP_ORDER.find((id) => steps[id] === "active");
  const progressPercent = (doneCount / STEP_ORDER.length) * 100;

  const headline = activeId
    ? labels[activeId]
    : doneCount === STEP_ORDER.length
      ? "Done"
      : "Getting started…";

  return (
    <div className="mt-3 space-y-6 rounded-2xl border-2 border-brand/30 bg-brand-tint p-10">
      <p
        className="text-center text-lg font-semibold"
        style={{ background: GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
      >
        {headline}
      </p>

      <div className="h-4 w-full overflow-hidden rounded-full bg-border-strong">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progressPercent}%`, background: GRADIENT }}
        />
      </div>

      <div className="space-y-2">
        {STEP_ORDER.map((id) => {
          const status = steps[id];
          return (
            <div key={id} className="flex items-center gap-3">
              {status === "done" ? (
                <svg
                  className="h-5 w-5 flex-shrink-0 text-emerald-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : status === "active" ? (
                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
                  <div className="h-3 w-3 animate-pulse rounded-full bg-brand" />
                </div>
              ) : (
                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-border-strong" />
                </div>
              )}
              <span
                className={`text-sm ${
                  status === "done"
                    ? "font-medium text-emerald-500"
                    : status === "active"
                      ? "font-medium text-brand"
                      : "text-muted"
                }`}
              >
                {labels[id]}
                {id === "embed_hotels" && status === "active" && embedProgress && (
                  <span className="ml-2 text-xs font-normal opacity-70">
                    {embedProgress.current}/{embedProgress.total}
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
