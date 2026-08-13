# SA Biz Ready — SA Business & Tendering SaaS Platform

Phase 1 build: company registration flow, CIPC name-checker (mock provider), tender
directory + matching, funding directory, free calculators, document vault, compliance
dashboard, PayFast checkout with server-verified payments, and an admin overview.

See `docs/ARCHITECTURE.md` for the full stack rationale and `docs/DATABASE.md` for the schema.

## Stack
Next.js 14 (App Router) + TypeScript + Tailwind, Supabase (Postgres/Auth/Storage/RLS),
PayFast for payments. No separate backend server, no Redis — deliberately matches the
GitHub + Netlify/Vercel + Supabase workflow you already use for FibreZone and Derivflow.

## Getting it running (browser-first workflow)

1. **Supabase**: create a new project at supabase.com. Open the SQL Editor and paste
   the contents of `supabase/migrations/0001_init.sql`, then run it. This creates every
   table, enum, and RLS policy.
2. **Seed demo data** (optional, for testing): either run `npm run seed` locally with
   `.env` filled in, or just insert a couple of rows into `products` / `tenders` via the
   Supabase Table Editor — the seed script content in `supabase/seed/seed.ts` is a good
   reference for realistic starter rows.
3. **Environment variables**: copy `.env.example` to `.env.local`. At minimum set
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
   Leave CIPC/AI/eTenders blank — the app runs fully on mock providers until you're ready
   to connect real credentials (see below).
4. **PayFast sandbox**: get sandbox merchant credentials from payfast.co.za, set
   `PAYFAST_MERCHANT_ID`, `PAYFAST_MERCHANT_KEY`, leave `PAYFAST_MODE=sandbox`.
5. **Deploy**: push this repo to GitHub, connect it in the Netlify or Vercel dashboard
   (same as FibreZone/Derivflow), paste in the env vars, deploy.
6. **Make yourself platform admin**: after signing up once on the live site, go to the
   Supabase Table Editor → `platform_admins` table → insert a row with your `user_id`
   (from `auth.users`). This unlocks `/admin`.

## Where the "don't fake it" rules live in code
- `lib/providers/cipc/index.ts` — picks `MockCIPCProvider` vs `CIPCApiverseProvider`
  based on whether CIPC env vars are set. Mock responses are always stamped `source: "mock"`
  and the UI shows a "Demo data — CIPC not connected" notice (see `app/tools/company-name-checker`).
- `app/api/payments/payfast-itn/route.ts` — the ONLY code path that marks an order "paid".
  The `/checkout/success` page never grants access itself.
- `supabase/seed/seed.ts` — demo tenders are inserted with `source: "mock"`, demo funding
  opportunities with `status: "draft"` — an admin must actively verify and publish before
  they're shown to real users.

## Tests
```
npm install
npm test
```
Covers the name-similarity engine, tender/funding matching, calculators, and the
tender-readiness score — the parts of the app making judgement calls, so they're the parts
worth unit-testing first.

## What's built vs what's next
Built and functional this session: auth-gated dashboard, company management, CIPC name
checker, tender search/match/save, funding directory, tender pricing + VAT calculators,
document vault schema, compliance dashboard data model, PayFast checkout end-to-end,
admin overview with CIPC API health.

Not yet built (architecture supports all of it — see `docs/ARCHITECTURE.md` §4):
AI tender document analysis, tender workspace collaboration UI, business plan / company
profile generators, website builder, real eTenders OCDS ingestion, real CIPC APIVerse
adapter (stubbed in `CIPCApiverseProvider.ts`, needs confirmed endpoint paths from CIPC's
developer portal), multi-language support, PWA packaging.

Given the size of the original brief, treat this as the first of several iterative
builds — same as how FibreZone Referral got built out module by module.
