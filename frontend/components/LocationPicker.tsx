"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { Coords } from "./MapPicker";

const MapPicker = dynamic(() => import("./MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-xs text-muted">
      Loading map…
    </div>
  ),
});

type LocationMode = "address" | "map";

export function LocationPicker({
  label,
  onChange,
}: {
  label: string;
  onChange?: (hasLocation: boolean) => void;
}) {
  const [mode, setMode] = useState<LocationMode>("address");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<Coords | null>(null);

  useEffect(() => {
    onChange?.(mode === "address" ? address.trim().length > 0 : coords !== null);
  }, [mode, address, coords, onChange]);

  return (
    <div className="flex w-full flex-col rounded-2xl border-2 border-border-strong p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wide text-muted">{label}</span>
        <div className="flex gap-0.5 rounded-full bg-surface-alt p-0.5 text-[10px] font-bold">
          <button
            type="button"
            onClick={() => setMode("address")}
            className={`rounded-full px-2 py-1 transition ${
              mode === "address" ? "bg-brand text-white" : "text-muted hover:text-fg"
            }`}
          >
            Address
          </button>
          <button
            type="button"
            onClick={() => setMode("map")}
            className={`rounded-full px-2 py-1 transition ${
              mode === "map" ? "bg-brand text-white" : "text-muted hover:text-fg"
            }`}
          >
            Map
          </button>
        </div>
      </div>

      {mode === "address" ? (
        <input
          type="text"
          name="address"
          placeholder="Address or city"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full bg-transparent text-sm font-medium text-fg placeholder:text-muted outline-none"
        />
      ) : (
        <div className="flex flex-col gap-2">
          <div className="h-64 w-full overflow-hidden rounded-xl">
            <MapPicker value={coords} onChange={setCoords} />
          </div>
          <p className="text-[11px] text-muted">
            {coords ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : "Click the map to drop a pin"}
          </p>
          <input type="hidden" name="lat" value={coords?.lat ?? ""} />
          <input type="hidden" name="lng" value={coords?.lng ?? ""} />
        </div>
      )}
    </div>
  );
}
