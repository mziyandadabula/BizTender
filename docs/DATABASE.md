# Database — Phase 1 Schema

Full SQL migration lives at `supabase/migrations/0001_init.sql`. Summary of tables and why each exists:

## Identity & access
- `profiles` — mirrors `auth.users`, extra fields (full_name, phone, province, city, business_status, onboarding_complete)
- `companies` — the core business entity
- `company_users` — join table, `role` enum (owner, admin, tender_manager, finance, documents, viewer) → this is what RLS keys off
- `company_directors` — CIPC-sourced or manually entered, `source` column distinguishes them

## Company verification
- `company_name_searches` — every CIPC name-check run, cached result JSON, similarity score, saved flag
- `company_verifications` — paid/free verification report snapshots, `source`, `retrieved_at`
- `api_usage_logs` — generic log for every external provider call (CIPC, PayFast, AI, tender source) — powers the admin "API health" screen

## Commerce
- `products` — packages/subscriptions, **admin-editable, no hard-coded prices**
- `product_features` — bullet list per product
- `orders`, `order_items`
- `payments` — one row per PayFast ITN received (append-only, source of truth for "is this paid")
- `subscriptions` — status enum: active, paused, cancelled, failed, expired
- `service_jobs`, `service_job_tasks` — fulfilment checklist after a package purchase

## Tenders
- `tenders` — normalized tender record, `source`/`source_url`/`raw_source_id` always populated
- `tender_documents`
- `tender_saved`
- `tender_matches` — company_id × tender_id × score × reasons (jsonb), always "estimated/potential match"
- `tender_workspaces`, `tender_checklists`, `tender_notes`, `tender_pricing`

## Funding
- `funding_opportunities` — admin-curated only, never AI-invented; `last_verified_at` required before `status='published'`
- `funding_saved`
- `funding_matches`

## Compliance & documents
- `documents` — Storage object metadata, category enum, expiry tracking, status derived (valid/expiring_soon/expired)
- `compliance_items` — per-company checklist (CIPC, CSD, B-BBEE, tax, COIDA, UIF, CIDB, NHBRC, insurance)
- `compliance_events` — calendar entries + reminder offsets

## Platform
- `notifications`, `notification_preferences`
- `support_tickets`
- `audit_logs` — every sensitive action (login, company change, document access, payment, admin change)
- `calculations` — saved calculator outputs (tender pricing, VAT, etc.)
- `settings` — key/value admin-editable config (replaces hard-coded business rules)

## RLS pattern (applied to every company-scoped table)
```sql
create policy "company members can select"
  on public.tender_saved for select
  using (
    company_id in (
      select company_id from public.company_users where user_id = auth.uid()
    )
  );
```
Admin/service-role bypasses via `auth.jwt() ->> 'role' = 'service_role'` or a `is_platform_admin(auth.uid())` helper function checked against a `platform_admins` table.
