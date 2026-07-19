"use client";

import { useState } from "react";
import type { Mode } from "./ModeToggle";
import { LocationPicker } from "./LocationPicker";
import {
  initialSteps,
  PipelineProgress,
  type StepId,
  type Steps,
} from "./PipelineProgress";
import type { ValuateResult } from "./ResultDisplay";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const copy: Record<
  Mode,
  {
    addressLabel: string;
    uploadLabel: string;
    uploadAccept: string;
    uploadInputId: string;
    uploadName: string;
    cta: string;
    stepLabels: Record<StepId, string>;
  }
> = {
  host: {
    addressLabel: "Where's your room?",
    uploadLabel: "Upload a video walkthrough of your room",
    uploadAccept: "video/*",
    uploadInputId: "room-video",
    uploadName: "roomVideo",
    cta: "Price My Room",
    stepLabels: {
      embed_input: "Embedding video with TwelveLabs",
      fetch_hotels: "Fetching nearby hotels from Stay22",
      embed_hotels: "Embedding hotel images",
      compare: "Running cosine similarity to rank matches",
    },
  },
  looking: {
    addressLabel: "Where's the listing?",
    uploadLabel: "Upload a photo of the listing",
    uploadAccept: "image/*",
    uploadInputId: "listing-photo",
    uploadName: "listingPhoto",
    cta: "Expose It",
    stepLabels: {
      embed_input: "Embedding photo with TwelveLabs",
      fetch_hotels: "Fetching nearby hotels from Stay22",
      embed_hotels: "Embedding hotel images",
      compare: "Running cosine similarity to rank matches",
    },
  },
};

export function ExposeForm({
  mode,
  onResult,
}: {
  mode: Mode;
  onResult: (result: ValuateResult | null) => void;
}) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [hasLocation, setHasLocation] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [steps, setSteps] = useState<Steps>(initialSteps);
  const [embedProgress, setEmbedProgress] = useState<{ current: number; total: number } | null>(null);
  const c = copy[mode];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const raw = new FormData(e.currentTarget);
    const file = raw.get(c.uploadName) as File | null;
    const address = raw.get("address") as string | null;
    const lat = raw.get("lat") as string | null;
    const lng = raw.get("lng") as string | null;
    const listedPrice = raw.get("listedPrice") as string | null;

    if (!file || file.size === 0) {
      setStatus("error");
      setErrorMessage("Choose a file first.");
      return;
    }
    if (!address && !(lat && lng)) {
      setStatus("error");
      setErrorMessage("Set a location first — type an address or drop a pin on the map.");
      return;
    }

    const payload = new FormData();
    payload.append("file", file);
    if (address) payload.append("address", address);
    if (lat && lng) {
      payload.append("lat", lat);
      payload.append("lng", lng);
    }
    if (mode === "looking" && listedPrice) payload.append("listed_price", listedPrice);

    setStatus("loading");
    setErrorMessage(null);
    onResult(null);
    setSteps(initialSteps);
    setEmbedProgress(null);

    try {
      const res = await fetch(`${API_BASE}/api/valuate`, { method: "POST", body: payload });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Something went wrong");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line);

          if (event.step === "error") {
            throw new Error(event.message || "Something went wrong");
          }
          if (event.step === "result") {
            onResult(event.data);
            continue;
          }
          if (event.status === "start") {
            setSteps((s) => ({ ...s, [event.step as StepId]: "active" }));
          } else if (event.status === "done") {
            setSteps((s) => ({ ...s, [event.step as StepId]: "done" }));
          } else if (event.status === "progress" && event.step === "embed_hotels") {
            setEmbedProgress({ current: event.current, total: event.total });
          }
        }
      }

      setStatus("success");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  const canSubmit = status !== "loading" && hasLocation && !!fileName;

  return (
    <form
        id="expose-form"
        className="flex w-full flex-col rounded-3xl border border-border bg-surface p-3 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)] sm:p-4"
        onSubmit={handleSubmit}
      >
        {mode === "looking" && (
          <label className="mb-3 block rounded-2xl border border-border px-4 py-3">
            <span className="block text-[11px] font-bold uppercase tracking-wide text-muted">
              What are they charging? ($/night)
            </span>
            <input
              type="number"
              min={0}
              placeholder="200"
              className="w-full bg-transparent text-sm font-medium text-fg placeholder:text-muted outline-none"
              name="listedPrice"
            />
          </label>
        )}

        {/* Dates and guests are hardcoded server-side for now. */}
        {/* <div className="grid grid-cols-1 divide-y divide-border rounded-2xl border border-border sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          <label className="px-4 py-3">
            <span className={labelClass}>Check in</span>
            <input type="date" className={fieldClass} name="checkin" />
          </label>
          <label className="px-4 py-3">
            <span className={labelClass}>Check out</span>
            <input type="date" className={fieldClass} name="checkout" />
          </label>
          <label className="px-4 py-3">
            <span className={labelClass}>Guests</span>
            <input type="number" min={1} defaultValue={2} className={fieldClass} name="adults" />
          </label>
          {mode === "looking" ? (
            <label className="px-4 py-3">
              <span className={labelClass}>What are they charging? ($/night)</span>
              <input type="number" min={0} placeholder="200" className={fieldClass} name="listedPrice" />
            </label>
          ) : (
            <label className="px-4 py-3">
              <span className={labelClass}>Your target dates</span>
              <input type="text" placeholder="Flexible" className={fieldClass} name="notes" />
            </label>
          )}
        </div> */}

        <div className="flex flex-col gap-3">
          <label
            htmlFor={c.uploadInputId}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border-strong px-4 py-5 text-center text-sm text-muted transition hover:border-brand hover:text-brand"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-6 w-6 flex-shrink-0"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L7 9m5-5l5 5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3" />
            </svg>
            <span className="max-w-xs truncate font-semibold">{fileName ?? c.uploadLabel}</span>
            <input
              key={c.uploadInputId}
              id={c.uploadInputId}
              name={c.uploadName}
              type="file"
              accept={c.uploadAccept}
              className="hidden"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
            />
          </label>

          <LocationPicker label={c.addressLabel} onChange={setHasLocation} />
        </div>

        {status === "loading" && (
          <PipelineProgress steps={steps} labels={c.stepLabels} embedProgress={embedProgress} />
        )}

        {status === "error" && errorMessage && (
          <p className="mt-3 text-sm font-medium text-red-600">{errorMessage}</p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-3 flex items-center justify-center gap-2 self-end rounded-2xl bg-brand px-8 py-3 text-sm font-bold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          {status === "loading" ? "Crunching the numbers…" : c.cta}
          {status !== "loading" && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="h-4 w-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 12h15" />
            </svg>
          )}
        </button>
    </form>
  );
}
