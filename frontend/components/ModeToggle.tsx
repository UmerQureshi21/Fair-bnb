export type Mode = "host" | "looking";

function HomeIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.5 1 12h3v9h6v-6h4v6h6v-9h3L12 2.5z" />
    </svg>
  );
}

function SearchIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className={className}
      aria-hidden="true"
    >
      <circle cx="10.5" cy="10.5" r="6.5" />
      <line x1="15.5" y1="15.5" x2="21" y2="21" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className={className}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
    </svg>
  );
}

const tabs: { mode: Mode; label: string; description: string; Icon: typeof HomeIcon }[] = [
  {
    mode: "host",
    label: "I'm a Host",
    description:
      "Upload a video walkthrough of your room and we'll compare it to real hotels nearby to calculate a fair nightly price.",
    Icon: HomeIcon,
  },
  {
    mode: "looking",
    label: "I'm Looking",
    description:
      "Upload a photo of a listing and what it's charging, and we'll tell you if you're being overcharged compared to identical looking hotels.",
    Icon: SearchIcon,
  },
];

export function ModeToggle({
  value,
  onChange,
}: {
  value: Mode;
  onChange: (mode: Mode) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {tabs.map(({ mode, label, description, Icon }) => {
        const active = value === mode;
        return (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            aria-pressed={active}
            className={`w-full rounded-2xl border p-5 text-left shadow-lg transition ${
              active ? "border-brand bg-brand-tint" : "border-border bg-surface hover:border-brand/50"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                    active ? "bg-brand text-white" : "bg-surface-alt text-muted"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className={`text-lg font-bold ${active ? "text-brand" : "text-fg"}`}>{label}</span>
              </div>
              <ChevronIcon
                className={`h-4 w-4 flex-shrink-0 text-muted transition-transform ${active ? "rotate-180" : ""}`}
              />
            </div>
            {active && <p className="mt-3 text-sm text-muted">{description}</p>}
          </button>
        );
      })}
    </div>
  );
}
