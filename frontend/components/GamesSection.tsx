import { FadeIn } from "./FadeIn";

function HigherLowerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 3v18M7 8l5-5 5 5M7 16l5 5 5-5" />
    </svg>
  );
}

function OddOneOutIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect
        x="14"
        y="14"
        width="7"
        height="7"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="2.5"
      />
    </svg>
  );
}

const games = [
  {
    Icon: HigherLowerIcon,
    title: "Higher or Lower",
    description:
      "See a hotel's price, then guess whether the next one is priced higher or lower. Keep guessing right and your streak climbs - one wrong guess and it's over.",
  },
  {
    Icon: OddOneOutIcon,
    title: "Odd One Out",
    description:
      "Four hotels, three priced close together and one way off from the rest. Pick the outlier before the prices are revealed to keep your streak alive.",
  },
];

export function GamesSection() {
  return (
    <section className="px-6 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <FadeIn className="mb-10 text-center">
          <span className="inline-block rounded-full text-[60px] font-extrabold text-brand">
            Games You Can Play
          </span>
          <p className="mx-auto mt-2 max-w-lg text-muted">
            Every game is built from real hotel comparisons and prices.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {games.map((game, i) => (
            <FadeIn
              key={game.title}
              delay={i * 120}
              className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-8 shadow-lg"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-tint text-brand">
                <game.Icon className="h-6 w-6" />
              </span>
              <h3 className="text-xl font-extrabold text-fg">{game.title}</h3>
              <p className="text-muted">{game.description}</p>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
