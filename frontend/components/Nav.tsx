"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export function Nav() {
  const { status, user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between px-6 py-5 sm:px-10">
      <Link href="/" className="flex items-center gap-2">
        <Image
          src="/fairbnb.png"
          alt="FairBnb"
          width={32}
          height={32}
          className="h-8 w-8 rounded-md object-contain"
          priority
        />
        <span className="text-xl font-extrabold tracking-tight text-fg">
          Fair<span className="text-brand">Bnb</span>
        </span>
      </Link>

      <div className="flex items-center gap-4">
        {status === "authed" ? (
          <>
            <Link href="/dashboard" className="text-sm font-semibold text-fg hover:text-brand">
              Dashboard
            </Link>
            <span className="hidden text-sm text-muted sm:inline">{user?.email}</span>
            <button
              type="button"
              onClick={() => logout()}
              className="rounded-full border border-border-strong px-4 py-1.5 text-sm font-semibold text-fg transition hover:border-brand hover:text-brand"
            >
              Log out
            </button>
          </>
        ) : status === "guest" ? (
          <>
            <Link href="/login" className="text-sm font-semibold text-fg hover:text-brand">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-brand px-4 py-1.5 text-sm font-bold text-white transition hover:bg-brand-hover"
            >
              Sign up
            </Link>
          </>
        ) : null}
      </div>
    </header>
  );
}
