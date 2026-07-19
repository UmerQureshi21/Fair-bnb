"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AuthLayout } from "@/components/AuthLayout";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signup(email, password);
      router.push("/valuate");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <h1 className="text-3xl font-extrabold text-white">Sign up</h1>

        <label className="block rounded-2xl border border-white/20 bg-white/5 px-4 py-3">
          <span className="block text-[11px] font-bold uppercase tracking-wide text-white/50">
            Email
          </span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-on-dark w-full bg-transparent text-sm font-medium text-white outline-none"
          />
        </label>

        <label className="block rounded-2xl border border-white/20 bg-white/5 px-4 py-3">
          <span className="block text-[11px] font-bold uppercase tracking-wide text-white/50">
            Password
          </span>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-on-dark w-full bg-transparent text-sm font-medium text-white outline-none"
          />
          <span className="mt-1 block text-[11px] text-white/40">At least 8 characters.</span>
        </label>

        {error && <p className="text-sm font-medium text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 rounded-2xl bg-brand px-8 py-3 text-sm font-bold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Signing up…" : "Sign up"}
        </button>

        <p className="text-center text-sm text-white/50">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand">
            Log in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
