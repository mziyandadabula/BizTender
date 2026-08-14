"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

const PROVINCES = ["Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo", "Mpumalanga", "Northern Cape", "North West", "Western Cape"];

export default function NewCompanyPage() {
  const router = useRouter();
  const supabase = getBrowserSupabase();
  const [name, setName] = useState("");
  const [province, setProvince] = useState("");
  const [industry, setIndustry] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    // Uses the create_company_with_owner() Postgres function from the migration —
    // creates the company row and adds you as 'owner' in company_users in one step.
    const { error: rpcError } = await supabase.rpc("create_company_with_owner", {
      p_name: name,
      p_province: province || null,
      p_industry: industry || null,
    });

    setLoading(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-20">
      <h1 className="font-display text-2xl font-semibold">Add your company</h1>
      <p className="mt-2 text-slate">
        Start with the basics — you can complete the rest of your company profile from your dashboard.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <label className="block text-sm">
          <span className="text-slate">Company name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            placeholder="e.g. ABC Trading (Pty) Ltd"
            className="focus-ring mt-1 w-full rounded-card border border-ink/15 bg-white px-3 py-2.5"
          />
        </label>

        <label className="block text-sm">
          <span className="text-slate">Province</span>
          <select
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            className="focus-ring mt-1 w-full rounded-card border border-ink/15 bg-white px-3 py-2.5"
          >
            <option value="">Select a province</option>
            {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>

        <label className="block text-sm">
          <span className="text-slate">Industry</span>
          <input
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="e.g. Construction, IT Services, Cleaning"
            className="focus-ring mt-1 w-full rounded-card border border-ink/15 bg-white px-3 py-2.5"
          />
        </label>

        {error && <p className="text-sm text-signal-red">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creating company…" : "Create company"}
        </Button>
      </form>
    </main>
  );
}
