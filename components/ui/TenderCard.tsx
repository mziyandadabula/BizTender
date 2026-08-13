"use client";

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function TenderCard({ tender, matchScore }: { tender: any; matchScore?: number }) {
  const days = tender.closing_date ? daysUntil(tender.closing_date) : null;
  const urgent = days !== null && days <= 7;

  return (
    <div className="rounded-card border border-ink/10 bg-white/60 p-5 transition-colors hover:border-seal/40">
      <div className="flex items-start justify-between gap-4">
        <div>
          {matchScore != null && (
            <p className="font-mono text-xs font-medium text-seal-dark">{matchScore}% ESTIMATED MATCH</p>
          )}
          <h3 className="mt-1 font-display text-lg font-semibold leading-snug">{tender.title}</h3>
          <p className="mt-1 text-sm text-slate">{tender.organisation}</p>
        </div>
        <span className="whitespace-nowrap rounded-full border border-ink/10 px-2.5 py-1 font-mono text-xs text-slate">
          {tender.tender_number}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate">
        <span className="rounded-full bg-ink/5 px-2.5 py-1">{tender.province}</span>
        <span className="rounded-full bg-ink/5 px-2.5 py-1">{tender.category}</span>
        {tender.briefing_required && <span className="rounded-full bg-ink/5 px-2.5 py-1">Briefing required</span>}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm">
          <p className="text-slate">Closing</p>
          <p className="font-medium">{tender.closing_date ? new Date(tender.closing_date).toLocaleDateString("en-ZA") : "TBC"}</p>
        </div>
        {days !== null && (
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${urgent ? "bg-signal-redBg text-signal-red" : "bg-signal-greenBg text-signal-green"}`}>
            {days > 0 ? `${days} day${days === 1 ? "" : "s"} remaining` : "Closed"}
          </span>
        )}
      </div>
    </div>
  );
}
