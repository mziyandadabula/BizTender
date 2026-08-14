"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export default function SignupPage() {
  const router = useRouter();
  const supabase = getBrowserSupabase();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.from("profiles").upsert({ id: data.user.id, full_name: fullName });
    }

    setLoading(false);

    if (data.session) {
      router.push("/dashboard");
    } else {
      setCheckEmail(true);
    }
  }

  if (checkEmail) {
    return (
      <main className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="font-display text-2xl font-semibold">Check your email</h1>
        <p className="mt-3 text-slate">We've sent a confirmation link to {email}. Click it to activate your account, then log in.</p>
        <Link href="/login" className="focus-ring mt-6 inline-block text-sm text-seal-dark">Go to login →</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-6 py-20">
      <h1 className="font-display text-2xl font-semibold">Create your account</h1>
      <p className="mt-2 text-slate">Register your company, check your business, and get tender-ready.</p>

      <form onSubmit={handleSignup} className="mt-8 space-y-4">
        <label className="block text-sm">
          <span className="text-slate">Full name</span>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="focus-ring mt-1 w-full rounded-card border border-ink/15 bg-white px-3 py-2.5"
          />
        </label>
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
            minLength={8}
            className="focus-ring mt-1 w-full rounded-card border border-ink/15 bg-white px-3 py-2.5"
          />
        </label>

        {error && <p className="text-sm text-signal-red">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate">
        Already have an account? <Link href="/login" className="text-seal-dark">Log in</Link>
      </p>
    </main>
  );
}
