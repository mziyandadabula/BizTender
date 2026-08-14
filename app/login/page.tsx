"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const supabase = getBrowserSupabase();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-md px-6 py-20">
      <h1 className="font-display text-2xl font-semibold">Log in</h1>
      <p className="mt-2 text-slate">Welcome back — pick up where you left off.</p>

      <form onSubmit={handleLogin} className="mt-8 space-y-4">
        <label className="block text-sm">
          <span className="text-slate">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="focus-ring mt-1 w-full rounded-card border border-ink/15 bg-white px-3 py-2.5"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="focus-ring mt-1 w-full rounded-card border border-ink/15 bg-white px-3 py-2.5"
          />
        </label>

        {error && <p className="text-sm text-signal-red">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate">
        Don't have an account? <Link href="/signup" className="text-seal-dark">Sign up</Link>
      </p>
    </main>
  );
}
