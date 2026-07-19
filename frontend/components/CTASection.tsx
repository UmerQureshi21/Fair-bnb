"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { FadeIn } from "./FadeIn";

export function CTASection() {
  const { status } = useAuth();

  return (
    <section className="my-30 flex flex-col items-center gap-6 px-6 text-center sm:px-10">
      <FadeIn>
        <span className="inline-block rounded-full text-[60px] font-extrabold text-brand">
          Give it a Try!
        </span>
      </FadeIn>
      <FadeIn delay={120}>
        {status === "authed" ? (
          <Link
            href="/valuate"
            className="rounded-2xl bg-brand px-8 py-3 text-sm font-bold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-hover"
          >
            Go to Valuate
          </Link>
        ) : (
          <div className="flex gap-3">
            <Link
              href="/signup"
              className="rounded-2xl bg-brand px-8 py-3 text-sm font-bold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-hover"
            >
              Sign up free
            </Link>
            <Link
              href="/login"
              className="rounded-2xl border border-border-strong px-8 py-3 text-sm font-bold text-fg transition hover:border-brand hover:text-brand"
            >
              Log in
            </Link>
          </div>
        )}
      </FadeIn>
    </section>
  );
}
