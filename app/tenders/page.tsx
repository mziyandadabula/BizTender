"use client";

import { useEffect, useState } from "react";
import { TenderCard } from "@/components/ui/TenderCard";

const PROVINCES = ["Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo", "Mpumalanga", "Northern Cape", "North West", "Western Cape"];

export default function TendersPage() {
  const [tenders, setTenders] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [province, setProvince] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (province) params.set("province", province);
    setLoading(true);
    fetch(`/api/tenders?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setTenders(d.tenders ?? []))
      .finally(() => setLoading(false));
  }, [q, province]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold">Find tenders</h1>
      <p className="mt-2 text-slate">
        Always verify requirements, deadlines and submission instructions against the official tender
        documentation before submitting.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by keyword or tender number"
          className="focus-ring w-72 rounded-card border border-ink/15 bg-white px-4 py-2.5 text-sm"
        />
        <select
          value={province}
          onChange={(e) => setProvince(e.target.value)}
          className="focus-ring rounded-card border border-ink/15 bg-white px-4 py-2.5 text-sm"
        >
          <option value="">All provinces</option>
          {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {loading && <p className="text-sm text-slate">Loading tenders…</p>}
        {!loading && tenders.length === 0 && <p className="text-sm text-slate">No tenders match your filters.</p>}
        {tenders.map((t) => <TenderCard key={t.id} tender={t} />)}
      </div>
    </main>
  );
}
