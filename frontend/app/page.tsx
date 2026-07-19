"use client";

import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { status } = useAuth();

  return (
    <div className="flex min-h-full flex-1 flex-col bg-page">
      <Nav />
      <Hero />
      <div className="my-[80px]"></div>
      <HowItWorks />
      <div className="my-[80px]"></div>
      <div className="my-30 flex flex-col items-center gap-6 text-center">
        <span className="inline-block rounded-full text-[60px] font-extrabold text-brand">
          Give it a Try!
        </span>
        {status === "authed" ? (
          <Link
            href="/dashboard"
            className="rounded-2xl bg-brand px-8 py-3 text-sm font-bold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-hover"
          >
            Go to your dashboard
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
      </div>
      <div className="flex-1" />
      <Footer />
    </div>
  );
}
