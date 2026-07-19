"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Fades + slides children in once, either as soon as they mount (for
 * above-the-fold content like the Hero) or the first time they scroll into
 * view (for everything below the fold) - same IntersectionObserver approach
 * HowItWorks already used for its prism row, generalized into one place.
 * Respects prefers-reduced-motion by skipping straight to the visible state.
 */
export function FadeIn({
  children,
  className = "",
  delay = 0,
  trigger = "scroll",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  trigger?: "scroll" | "mount";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    if (isVisible) return;

    if (trigger === "mount") {
      const id = requestAnimationFrame(() => setIsVisible(true));
      return () => cancelAnimationFrame(id);
    }

    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [isVisible, trigger]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(14px)",
        transition: `opacity 700ms ease-out ${delay}ms, transform 700ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
