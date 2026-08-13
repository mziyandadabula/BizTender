# Architecture — SA Business & Tendering SaaS Platform

## 1. Stack decision

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui | SSR/SEO for the tender/funding SEO pages, one deploy target (Vercel), matches your existing workflow |
| Backend | Next.js Route Handlers (`/app/api/**`) + Supabase Edge Functions for long-running/queued work | No separate server to babysit; Edge Functions cover CIPC sync, tender import, PayFast ITN, AI analysis |
| Database | Supabase Postgres | Postgres = the spec's requirement; Supabase adds Auth, RLS, Storage, cron, realtime for free |
| Auth | Supabase Auth (email/password now, Google OAuth ready) | Row-Level Security gives you the multi-company data isolation (section 72) almost for free |
| File storage | Supabase Storage (private buckets, signed URLs) | Matches "never store docs in Postgres, no public files" requirement |
| Background jobs | Supabase Edge Functions + `pg_cron` (replaces BullMQ/Redis) | No Redis ops burden; cron triggers CIPC sync, tender import, expiry reminders, matching |
| Payments | PayFast (sandbox first) via a `PaymentProvider` interface | ITN verified server-side only, never trust client redirect |
| CIPC | `CIPCProvider` interface, `MockCIPCProvider` until credentials exist | Never fakes official data in prod; clearly labelled demo data |
| Tenders | `TenderSource` interface, seeded with eTenders OCDS-shaped mock data | Real OCDS ingestion slots in once we confirm the exact eTenders API endpoint/access |
| AI | `AIProvider` interface, Anthropic adapter (Claude) + mock adapter | Swappable, never hard-coded to one vendor |
| Hosting | Netlify or Vercel (frontend+API), Supabase (DB/Auth/Storage) | Matches your existing FibreZone/Derivflow deployment pattern |

This is deliberately the **same shape** as FibreZone Referral and Derivflow, scaled up: Next.js + Supabase + Netlify/Vercel, browser-manageable, no servers to SSH into.

## 2. Why not the literal 94-point spec as written

A few things in the brief are described as if this is a funded engineering team with CIPC/eTenders enterprise API access, a DevOps function, and months of runway. I'm keeping every *feature* and every *safety rule* (no fake CIPC data, no guaranteed tender eligibility, server-side-only payment confirmation, etc.) but collapsing the *infra* (NestJS+Redis+S3+queues) into Supabase equivalents so one person can actually operate it.

## 3. Provider abstractions (the load-bearing pattern)

Every external/regulated data source is behind an interface with a mock implementation, so the app is fully functional and demo-able before any credentials exist, and swapping in the real thing later touches one file.

```
lib/providers/cipc/CIPCProvider.ts       (interface)
lib/providers/cipc/MockCIPCProvider.ts   (in-memory fixture data, clearly labelled "DEMO DATA")
lib/providers/cipc/CIPCApiverseProvider.ts (real adapter — stubbed, activated by env vars)

lib/providers/payments/PaymentProvider.ts
lib/providers/payments/PayFastProvider.ts (sandbox + live via PAYFAST_MODE)

lib/providers/tenders/TenderSource.ts
lib/providers/tenders/MockTenderSource.ts
lib/providers/tenders/ETendersOCDSSource.ts (stubbed)

lib/providers/ai/AIProvider.ts
lib/providers/ai/AnthropicProvider.ts
lib/providers/ai/MockAIProvider.ts
```

Every provider call that touches regulated/official data is logged to `api_usage_logs` (covers CIPC monitoring, section 12, generically for all providers).

## 4. Build phasing (matches section 76, made concrete)

**This session builds Phase 1 end-to-end and functional:**
- Auth, onboarding, multi-company dashboard
- Company management + CIPC name checker (mock provider)
- Package/pricing catalog (admin-editable, DB-driven — no hard-coded prices)
- Checkout → Orders → PayFast sandbox → server-verified ITN → access grant
- Tender directory, search/filter, detail, save, mock match score
- Funding directory, search/filter, save
- Free tools: VAT calculator, tender pricing calculator, tender checklist generator
- Document vault (Storage + expiry status)
- Compliance dashboard (manual + derived status)
- Admin: users, companies, orders, packages, tenders, funding, CIPC/API usage log
- Notifications (in-app table + email hook)

**Phase 2+ (not built this session, architecture leaves room):**
tender workspace collaboration, AI tender document analysis, business plan/company profile generators, website builder, real eTenders OCDS ingestion, real CIPC APIVerse OAuth, multi-language, PWA.

## 5. Security & compliance baked in from the start
- RLS on every table scoped to `company_users` / `auth.uid()`
- Service-role key only ever used server-side (route handlers / edge functions), never shipped to the client
- PayFast ITN validated server-side (signature, amount, merchant, source IP/domain) before any access grant
- CIPC/funding/tender records always carry `source`, `source_url`, `last_verified_at`
- Every AI output rendered with a visible "review before submission" disclaimer
- POPIA: minimal fields collected at onboarding, consent checkbox stored, privacy/terms pages scaffolded
