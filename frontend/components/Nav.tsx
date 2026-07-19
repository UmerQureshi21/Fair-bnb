"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

function TagIcon({ className }: { className?: string }) {
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
      <path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9-9-9Z" />
      <circle cx="7.5" cy="7.5" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

function HomeIcon({ className }: { className?: string }) {
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
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

function GameIcon({ className }: { className?: string }) {
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
      <rect x="2" y="8" width="20" height="10" rx="5" />
      <path d="M7 11v4M5 13h4" />
      <circle cx="16" cy="11.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="18.5" cy="14" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

const tabs = [
  { href: "/valuate", label: "Valuate", Icon: TagIcon },
  { href: "/dashboard", label: "Dashboard", Icon: HomeIcon },
  { href: "/games", label: "Games", Icon: GameIcon },
];

export function Nav() {
  const pathname = usePathname();
  const { status, user, logout } = useAuth();

  return (
    <header className="border-b border-border">
      <div className="flex items-center gap-4 px-6 py-4 sm:px-10">
        <Link href="/" className="flex flex-shrink-0 items-center gap-2">
          <Image
            src="/fairbnb.png"
            alt="FairBnb"
            width={40}
            height={40}
            className="h-10 w-10 rounded-md object-contain"
            priority
          />
          <span className="text-2xl font-extrabold tracking-tight text-fg">
            Fair<span className="text-brand">Bnb</span>
          </span>
        </Link>

        {status === "authed" && (
          <nav className="flex flex-1 items-center rounded-full bg-black px-1 py-2">
            {tabs.map((tab) => {
              const active = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition ${
                    active ? "text-brand" : "text-white/40 hover:text-white/70"
                  }`}
                >
                  <tab.Icon className="h-4 w-4 flex-shrink-0" />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </nav>
        )}

        <div className="flex flex-shrink-0 items-center gap-4">
          {status === "authed" ? (
            <>
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
      </div>
    </header>
  );
}
