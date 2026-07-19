"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";

function UploadIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 16V4m0 0L7 9m5-5l5 5" />
      <path d="M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3" />
    </svg>
  );
}

function SparklesIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2l1.2 4.6L18 8l-4.8 1.4L12 14l-1.2-4.6L6 8l4.8-1.4L12 2Z" />
      <path d="M18 15l.6 2.3L21 18l-2.4.7L18 21l-.6-2.3L15 18l2.4-.7L18 15Z" />
    </svg>
  );
}

function PinIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 21s-7-6.5-7-11a7 7 0 1 1 14 0c0 4.5-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function CompareIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="9" cy="12" r="6" />
      <circle cx="15" cy="12" r="6" />
    </svg>
  );
}

function TagIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9-9-9Z" />
      <circle cx="7.5" cy="7.5" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export type Step = {
  title: string;
  description: string;
  Icon: (props: { className: string }) => ReactElement;
  align: "top" | "bottom";
  highlight?: boolean;
  logo?: string;
};

export const steps: Step[] = [
  {
    title: "Upload",
    description: "Record a video of the room (or drop in a listing photo) and set the location.",
    Icon: UploadIcon,
    align: "top",
  },
  {
    title: "Embed",
    description: "The video or image gets embedded. One signature for how the space actually looks.",
    Icon: SparklesIcon,
    align: "bottom",
  },
  {
    title: "Fetch hotels",
    description: "Stay22 pulls 20 to 30 hotels nearby, each with a thumbnail and live price.",
    Icon: PinIcon,
    align: "top",
    highlight: true,
    logo: "/stay22-logo.webp",
  },
  {
    title: "Compare",
    description: "Every thumbnail gets embedded into the same space and ranked by similarity.",
    Icon: CompareIcon,
    align: "bottom",
  },
  {
    title: "Valuate",
    description: "Average the closest matches into one number which approximates your fair price, or their overcharge.",
    Icon: TagIcon,
    align: "top",
  },
];

// Line color/opacity shared by the prism's outline strokes and its roof
// icon, so the icon reads as the same "ink" as the box rather than a
// separately-colored accent sitting on top of it.
function prismLineStyle(highlight?: boolean) {
  return {
    stroke: highlight ? "var(--color-brand)" : "currentColor",
    strokeOpacity: highlight ? 1 : 0.35,
  };
}

// Isometric box: a rhombus top face plus two extruded side faces, drawn as
// three SVG polygons so the strokes stay crisp at any size.
export function Prism({ highlight }: { highlight?: boolean }) {
  // Fixed (not theme-reactive) so the illustration reads the same in dark
  // mode instead of the roof flipping to var(--color-surface)'s near-black
  // dark-mode value and swallowing the icon.
  const topFill = "#ffffff";
  const rightFill = highlight ? "#eef0ff" : "#f1f1f2";
  const leftFill = highlight ? "#e1e4fd" : "#e4e4e6";
  const { stroke, strokeOpacity } = prismLineStyle(highlight);
  const strokeWidth = highlight ? 2.5 : 1.5;

  return (
    <svg viewBox="0 0 200 190" className="h-full w-full overflow-visible text-fg" aria-hidden="true">
      <polygon
        points="0,50 100,100 100,190 0,140"
        fill={leftFill}
        stroke={stroke}
        strokeOpacity={strokeOpacity}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <polygon
        points="100,100 200,50 200,140 100,190"
        fill={rightFill}
        stroke={stroke}
        strokeOpacity={strokeOpacity}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <polygon
        points="100,0 200,50 100,100 0,50"
        fill={topFill}
        stroke={stroke}
        strokeOpacity={strokeOpacity}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HowItWorks() {
  const rowRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const node = rowRef.current;
    if (!node || isVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [isVisible]);

  return (
    <section className="px-6 py-14 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <span className="inline-block rounded-full  text-[60px] font-extrabold text-brand">
            How it works
          </span>
        </div>

        {/* Mobile / small screens: simple stacked list */}
        <div className="flex flex-col gap-10 md:hidden">
          {steps.map((step) =>
            step.logo ? (
              <div key={step.title} className="flex flex-col items-center gap-3 text-center">
                <Image src={step.logo} alt={step.title} width={160} height={90} className="h-auto w-32" />
                <h3 className="text-sm font-bold text-fg">{step.title}</h3>
                <p className="max-w-[16rem] text-xs text-muted">{step.description}</p>
              </div>
            ) : (
              <div key={step.title} className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-tint text-brand">
                  <step.Icon className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-fg">{step.title}</h3>
                <p className="max-w-[16rem] text-xs text-muted">{step.description}</p>
              </div>
            ),
          )}
        </div>

        {/* Desktop: isometric prism diagram */}
        <div className="hidden justify-center overflow-visible py-32 md:flex">
          <div ref={rowRef} className="flex items-end">
            {steps.map((step, index) => {
              // Rightmost box leads the sequence, each one to its left
              // follows — the opposite order from the visual left-to-right
              // reading of the row.
              const orderFromRight = steps.length - 1 - index;
              return (
              <div
                key={step.title}
                className="relative w-64 shrink-0 first:ml-0"
                style={{
                  marginLeft: index === 0 ? 0 : "1.75rem",
                  transform: `translateY(${index * 24}px) translateX(${isVisible ? 0 : -56}px)`,
                  opacity: isVisible ? 1 : 0,
                  transition: "transform 700ms cubic-bezier(0.16, 1, 0.3, 1), opacity 700ms ease-out",
                  transitionDelay: `${orderFromRight * 120}ms`,
                  zIndex: index + 1,
                }}
              >
                <div
                  className={`absolute left-1/2 flex w-52 -translate-x-1/2 flex-col items-center gap-1.5 text-center ${
                    step.align === "top" ? "bottom-[calc(100%+1.75rem)]" : "top-[calc(100%+1.75rem)]"
                  }`}
                >
                  {step.align === "bottom" && <span className="h-5 w-px bg-border-strong" aria-hidden="true" />}
                  <h3 className="text-base font-bold text-fg">{step.title}</h3>
                  <p className="text-sm leading-snug text-muted">{step.description}</p>
                  {step.align === "top" && <span className="h-5 w-px bg-border-strong" aria-hidden="true" />}
                </div>

                <div className="relative aspect-[200/190] w-full">
                  <Prism highlight={step.highlight} />
                  {step.logo ? (
                    <div className="absolute left-1/2 top-[26%] flex -translate-x-1/2 -translate-y-1/2 items-center justify-center">
                      <Image src={step.logo} alt={step.title} width={200} height={113} className="h-auto w-24" />
                    </div>
                  ) : (
                    <div
                      className={`absolute left-1/2 top-[26%] flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full ${
                        step.highlight ? "text-brand" : "text-fg"
                      }`}
                      style={{ opacity: prismLineStyle(step.highlight).strokeOpacity }}
                    >
                      <step.Icon className="h-10 w-10" />
                    </div>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
