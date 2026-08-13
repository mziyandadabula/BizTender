import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ReadinessSeal } from "@/components/ui/ReadinessSeal";

const QUICK_ACTIONS = [
  { label: "Register a company", href: "/companies/new" },
  { label: "Check a company name", href: "/tools/company-name-checker" },
  { label: "Find tenders", href: "/tenders" },
  { label: "Find funding", href: "/funding" },
  { label: "Calculate a tender price", href: "/tools/tender-calculator" },
];

const PILLARS = [
  { tag: "START", title: "Register your company", body: "Company name search, CIPC registration and your first company profile." },
  { tag: "READY", title: "Become tender-ready", body: "CSD, B-BBEE, industry registrations, document vault and a readiness score." },
  { tag: "WIN", title: "Find and win tenders", body: "Tender search, matching, checklists, pricing and a workspace per bid." },
  { tag: "GROW", title: "Grow your business", body: "Funding directory, business tools, company profile and — later — your website." },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="border-b border-ink/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <span className="font-display text-lg font-semibold tracking-tight">SA Biz Ready</span>
          <nav className="hidden gap-8 text-sm text-slate md:flex">
            <Link href="/tenders">Tenders</Link>
            <Link href="/funding">Funding</Link>
            <Link href="/tools/tender-calculator">Tools</Link>
            <Link href="/pricing">Pricing</Link>
          </nav>
          <div className="flex gap-3">
            <Button variant="ghost" href="/login">Log in</Button>
            <Button href="/signup">Get started</Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-[1.2fr_0.8fr] md:items-center">
        <div>
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-seal">Start · Get Compliant · Find Opportunities · Win Business</p>
          <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
            Everything your business needs to start, tender & grow.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-slate">
            Register your company, check your business, become tender-ready, find tenders, discover funding
            and manage your business — all in one platform built for South African SMEs.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/tools/tender-readiness">Get Tender Ready</Button>
            <Button variant="secondary" href="/companies/new">Register My Company</Button>
          </div>

          <div className="mt-10 rounded-card border border-ink/10 bg-white/60 p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate">What do you need help with?</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="focus-ring rounded-full border border-ink/15 bg-paper px-3.5 py-1.5 text-sm text-ink hover:border-seal hover:text-seal-dark"
                >
                  {a.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 rounded-card border border-ink/10 bg-white/70 p-8">
          <p className="font-mono text-xs uppercase tracking-widest text-slate">Tender Readiness</p>
          <ReadinessSeal pct={78} size={140} />
          <p className="text-center text-sm text-slate">
            One score across CIPC, CSD, B-BBEE, your company profile and document vault — so you know
            exactly what to fix before you bid.
          </p>
        </div>
      </section>

      {/* Pillars */}
      <section className="border-t border-ink/10 bg-white/50 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-2xl font-semibold">Four pillars, one dashboard.</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-4">
            {PILLARS.map((p) => (
              <div key={p.tag} className="rounded-card border border-ink/10 bg-paper p-6">
                <p className="font-mono text-xs font-medium tracking-widest text-seal">{p.tag}</p>
                <h3 className="mt-3 font-display text-lg font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm text-slate">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer strip — required by brief across the whole platform */}
      <section className="border-t border-ink/10 py-8">
        <div className="mx-auto max-w-6xl px-6 text-xs text-slate">
          Company information is retrieved through available CIPC services where connected, and is provided
          for informational/verification purposes — always confirm official status with CIPC. Tender and
          funding information is aggregated to help you discover opportunities; always verify requirements,
          deadlines and eligibility against the official source before submitting.
        </div>
      </section>

      <footer className="border-t border-ink/10 py-10">
        <div className="mx-auto max-w-6xl px-6 text-sm text-slate">© {new Date().getFullYear()} SA Biz Ready.</div>
      </footer>
    </main>
  );
}
