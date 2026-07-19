import { FadeIn } from "./FadeIn";

const modes = [
  {
    label: "For Hosts",
    title: "Price your room with confidence",
    description:
      "Upload a video walkthrough of your room and Fairbnb compares it against real hotels nearby to suggest a fair nightly price.",
    video: "/host-demo.mp4",
  },
  {
    label: "For Travelers",
    title: "Find out if you're being overcharged",
    description:
      "Upload a photo of a listing and what it's charging, and Fairbnb tells you how that price stacks up against visually similar hotels nearby.",
    video: "/looking-demo.mp4",
  },
];

export function Features() {
  return (
    <section className="px-6 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <FadeIn className="mb-10 text-center">
          <span className="inline-block rounded-full text-[60px] font-extrabold text-brand">
            Built for Both Sides
          </span>
        </FadeIn>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {modes.map((mode, i) => (
            <FadeIn key={mode.label} delay={i * 120} className="flex flex-col gap-4">
              <div className="overflow-hidden rounded-[2rem] border border-border bg-surface shadow-lg">
                <video
                  src={mode.video}
                  controls
                  preload="metadata"
                  className="aspect-video w-full bg-black object-contain"
                />
              </div>
              <div>
                <span className="inline-block rounded-full bg-brand-tint px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-tint-fg">
                  {mode.label}
                </span>
                <h3 className="mt-3 text-2xl font-extrabold text-fg">{mode.title}</h3>
                <p className="mt-2 text-muted">{mode.description}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
