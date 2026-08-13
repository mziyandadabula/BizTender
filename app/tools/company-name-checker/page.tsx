"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";

interface Result {
  query: string;
  results: { name: string; enterpriseNumber?: string; status?: string; similarity: string }[];
  overallSignal: "green" | "orange" | "red";
  source: "mock" | "cipc_apiverse";
}

export default function CompanyNameCheckerPage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cipc/name-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Search failed");
      }
      setResult(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const signalCopy = {
    green: "No obvious matching company name was found.",
    orange: "Similar company names were found — review before proceeding.",
    red: "A potential name conflict was found.",
  };

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-3xl font-semibold">Company name checker</h1>
      <p className="mt-3 text-slate">
        Check a proposed company name against records we have available. This is a screening tool, not an
        official reservation — final approval is always determined by CIPC.
      </p>

      <form onSubmit={handleSearch} className="mt-8 flex gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Fibrezone Networks"
          className="focus-ring flex-1 rounded-card border border-ink/15 bg-white px-4 py-2.5 text-sm"
          minLength={3}
          required
        />
        <Button type="submit" disabled={loading}>{loading ? "Checking…" : "Check name"}</Button>
      </form>

      {error && <p className="mt-4 text-sm text-signal-red">{error}</p>}

      {result && (
        <div className="mt-8 space-y-4">
          <div
            className={`rounded-card border p-4 text-sm ${
              result.overallSignal === "green"
                ? "border-signal-green/30 bg-signal-greenBg text-signal-green"
                : result.overallSignal === "orange"
                ? "border-signal-amber/30 bg-signal-amberBg text-signal-amber"
                : "border-signal-red/30 bg-signal-redBg text-signal-red"
            }`}
          >
            {signalCopy[result.overallSignal]}
          </div>

          {result.source === "mock" && (
            <p className="rounded-card border border-ink/10 bg-white/60 p-3 text-xs text-slate">
              Demo data — CIPC is not yet connected for this deployment. Once CIPC credentials are configured,
              this check runs against live CIPC data.
            </p>
          )}

          {result.results.length > 0 ? (
            <ul className="space-y-2">
              {result.results.map((r, i) => (
                <li key={i} className="flex items-center justify-between rounded-card border border-ink/10 bg-white/60 p-4">
                  <div>
                    <p className="font-medium">{r.name}</p>
                    {r.enterpriseNumber && <p className="font-mono text-xs text-slate">{r.enterpriseNumber} · {r.status}</p>}
                  </div>
                  <StatusBadge
                    status={r.similarity === "exact" || r.similarity === "high" ? "red" : r.similarity === "medium" ? "amber" : "green"}
                    label={`${r.similarity} similarity`}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate">No similar names found in available records.</p>
          )}
        </div>
      )}
    </main>
  );
}
