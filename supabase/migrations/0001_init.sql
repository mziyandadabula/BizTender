-- =========================================================
-- SA Business & Tendering Platform — Phase 1 schema
-- Target: Supabase Postgres
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------- ENUMS ----------
create type business_status as enum ('start_business','own_company','want_tender','want_funding','want_compliance','want_website');
create type company_user_role as enum ('owner','admin','tender_manager','finance','documents','viewer');
create type document_status as enum ('valid','expiring_soon','expired','pending_review');
create type document_category as enum ('cipc','sars','csd','bbbee','bank','coida','uif','cidb','nhbrc','insurance','company_profile','tenders','contracts','other');
create type order_status as enum ('pending_payment','paid','processing','in_progress','completed','cancelled','refunded','failed');
create type subscription_status as enum ('active','paused','cancelled','failed','expired');
create type tender_status as enum ('published','closing_soon','closed','awarded','cancelled','archived');
create type funding_status as enum ('draft','published','closed','archived');
create type notification_channel as enum ('in_app','email','whatsapp','sms');
create type compliance_status as enum ('green','amber','red','unknown');
create type product_type as enum ('once_off','subscription');

-- ---------- IDENTITY ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  province text,
  city text,
  business_status business_status,
  onboarding_complete boolean default false,
  marketing_consent boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

create or replace function public.is_platform_admin(uid uuid)
returns boolean language sql stable as $$
  select exists (select 1 from public.platform_admins where user_id = uid);
$$;

-- ---------- COMPANIES ----------
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  trading_name text,
  registration_number text,
  company_type text,
  registration_date date,
  status text,
  industry text,
  categories text[] default '{}',
  description text,
  province text,
  municipality text,
  address text,
  email text,
  phone text,
  website text,
  annual_turnover_range text,
  employee_count int,
  cipc_verified boolean default false,
  cipc_last_synced_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.company_users (
  company_id uuid references public.companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role company_user_role not null default 'owner',
  created_at timestamptz default now(),
  primary key (company_id, user_id)
);

create table public.company_directors (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  full_name text not null,
  id_or_passport text,
  appointed_date date,
  source text default 'manual', -- 'manual' | 'cipc'
  created_at timestamptz default now()
);

-- ---------- CIPC ----------
create table public.company_name_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  query_name text not null,
  results jsonb not null default '[]',
  overall_signal text, -- 'green' | 'orange' | 'red'
  saved boolean default false,
  source text default 'mock', -- 'mock' | 'cipc_apiverse'
  created_at timestamptz default now()
);

create table public.company_verifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  requested_by uuid references auth.users(id),
  enterprise_number text,
  report jsonb not null,
  source text default 'mock',
  retrieved_at timestamptz default now(),
  is_paid boolean default false,
  order_id uuid,
  created_at timestamptz default now()
);

create table public.api_usage_logs (
  id uuid primary key default gen_random_uuid(),
  provider text not null, -- 'cipc' | 'payfast' | 'ai' | 'etenders'
  operation text not null,
  status_code int,
  success boolean,
  duration_ms int,
  cached boolean default false,
  meta jsonb default '{}',
  created_at timestamptz default now()
);

-- ---------- COMMERCE ----------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  type product_type not null default 'once_off',
  price_cents int not null,
  billing_interval text, -- 'month' | null
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.product_features (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  label text not null,
  sort_order int default 0
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  company_id uuid references public.companies(id),
  product_id uuid references public.products(id),
  amount_cents int not null,
  currency text default 'ZAR',
  status order_status not null default 'pending_payment',
  payfast_payment_id text,
  subscription_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  quantity int default 1,
  unit_price_cents int not null
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id),
  provider text default 'payfast',
  provider_payment_id text,
  amount_cents int not null,
  status text not null, -- COMPLETE | FAILED | PENDING
  raw_itn jsonb,
  verified boolean default false,
  created_at timestamptz default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  company_id uuid references public.companies(id),
  product_id uuid references public.products(id),
  status subscription_status not null default 'active',
  payfast_token text,
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.service_jobs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id),
  company_id uuid references public.companies(id),
  title text not null,
  status text default 'payment_confirmed',
  assigned_to uuid references auth.users(id),
  created_at timestamptz default now()
);

create table public.service_job_tasks (
  id uuid primary key default gen_random_uuid(),
  service_job_id uuid references public.service_jobs(id) on delete cascade,
  label text not null,
  is_complete boolean default false,
  sort_order int default 0
);

-- ---------- TENDERS ----------
create table public.tenders (
  id uuid primary key default gen_random_uuid(),
  tender_number text,
  title text not null,
  description text,
  organisation text,
  province text,
  municipality text,
  category text,
  sector text,
  tender_type text,
  status tender_status not null default 'published',
  advertised_date date,
  closing_date timestamptz,
  briefing_required boolean default false,
  briefing_date timestamptz,
  briefing_location text,
  estimated_value_cents bigint,
  contact_details text,
  submission_method text,
  submission_url text,
  source text not null default 'mock', -- 'mock' | 'etenders_ocds'
  source_url text,
  raw_source_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index tenders_closing_date_idx on public.tenders (closing_date);
create index tenders_province_category_idx on public.tenders (province, category);

create table public.tender_documents (
  id uuid primary key default gen_random_uuid(),
  tender_id uuid references public.tenders(id) on delete cascade,
  label text,
  url text
);

create table public.tender_saved (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  tender_id uuid references public.tenders(id) on delete cascade,
  created_at timestamptz default now(),
  unique (company_id, tender_id)
);

create table public.tender_matches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  tender_id uuid references public.tenders(id) on delete cascade,
  score int not null,
  reasons jsonb default '[]',
  created_at timestamptz default now(),
  unique (company_id, tender_id)
);

create table public.tender_workspaces (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  tender_id uuid references public.tenders(id),
  progress_pct int default 0,
  created_at timestamptz default now()
);

create table public.tender_checklists (
  id uuid primary key default gen_random_uuid(),
  tender_workspace_id uuid references public.tender_workspaces(id) on delete cascade,
  label text not null,
  is_complete boolean default false,
  sort_order int default 0
);

create table public.tender_notes (
  id uuid primary key default gen_random_uuid(),
  tender_workspace_id uuid references public.tender_workspaces(id) on delete cascade,
  author_id uuid references auth.users(id),
  body text not null,
  created_at timestamptz default now()
);

create table public.tender_pricing (
  id uuid primary key default gen_random_uuid(),
  tender_workspace_id uuid references public.tender_workspaces(id) on delete cascade,
  inputs jsonb not null,
  outputs jsonb not null,
  created_at timestamptz default now()
);

-- ---------- FUNDING ----------
create table public.funding_opportunities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  provider text not null,
  description text,
  funding_type text,
  amount_min_cents bigint,
  amount_max_cents bigint,
  eligibility text,
  industry text,
  province text,
  min_company_age_months int,
  min_turnover_cents bigint,
  closing_date date,
  official_website text,
  official_application_url text,
  status funding_status not null default 'draft',
  last_verified_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.funding_saved (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  funding_id uuid references public.funding_opportunities(id) on delete cascade,
  created_at timestamptz default now(),
  unique (company_id, funding_id)
);

create table public.funding_matches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  funding_id uuid references public.funding_opportunities(id) on delete cascade,
  score int not null,
  reasons jsonb default '[]',
  unique (company_id, funding_id)
);

-- ---------- COMPLIANCE & DOCUMENTS ----------
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  category document_category not null,
  filename text not null,
  storage_path text not null,
  issue_date date,
  expiry_date date,
  status document_status default 'pending_review',
  uploaded_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.compliance_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  item_key text not null, -- 'cipc','csd','bbbee','tax','coida','uif','cidb','nhbrc','insurance'
  status compliance_status default 'unknown',
  notes text,
  updated_at timestamptz default now(),
  unique (company_id, item_key)
);

create table public.compliance_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  title text not null,
  event_date timestamptz not null,
  reminder_offsets_days int[] default '{30,14,7,3,1}',
  created_at timestamptz default now()
);

-- ---------- PLATFORM ----------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id),
  type text not null,
  title text not null,
  body text,
  is_read boolean default false,
  created_at timestamptz default now()
);

create table public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  channels notification_channel[] default '{in_app,email}'
);

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  subject text not null,
  category text,
  priority text default 'normal',
  status text default 'open',
  created_at timestamptz default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  action text not null,
  entity_type text,
  entity_id uuid,
  meta jsonb default '{}',
  created_at timestamptz default now()
);

create table public.calculations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  company_id uuid references public.companies(id),
  tool text not null, -- 'vat' | 'tender_pricing' | ...
  inputs jsonb not null,
  outputs jsonb not null,
  created_at timestamptz default now()
);

create table public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- =========================================================
-- RLS
-- =========================================================
alter table public.companies enable row level security;
alter table public.company_users enable row level security;
alter table public.company_directors enable row level security;
alter table public.company_name_searches enable row level security;
alter table public.company_verifications enable row level security;
alter table public.orders enable row level security;
alter table public.subscriptions enable row level security;
alter table public.tender_saved enable row level security;
alter table public.tender_matches enable row level security;
alter table public.tender_workspaces enable row level security;
alter table public.funding_saved enable row level security;
alter table public.documents enable row level security;
alter table public.compliance_items enable row level security;
alter table public.compliance_events enable row level security;
alter table public.notifications enable row level security;
alter table public.profiles enable row level security;

create policy "profiles: self read/write" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy "companies: members can select" on public.companies
  for select using (
    id in (select company_id from public.company_users where user_id = auth.uid())
    or public.is_platform_admin(auth.uid())
  );

create policy "companies: owners/admins can update" on public.companies
  for update using (
    id in (select company_id from public.company_users where user_id = auth.uid() and role in ('owner','admin'))
    or public.is_platform_admin(auth.uid())
  );

create policy "company_users: members can select own memberships" on public.company_users
  for select using (user_id = auth.uid() or public.is_platform_admin(auth.uid()));

-- Generic company-scoped pattern applied to remaining tables:
create policy "documents: company members" on public.documents
  for all using (
    company_id in (select company_id from public.company_users where user_id = auth.uid())
    or public.is_platform_admin(auth.uid())
  );

create policy "tender_saved: company members" on public.tender_saved
  for all using (
    company_id in (select company_id from public.company_users where user_id = auth.uid())
    or public.is_platform_admin(auth.uid())
  );

create policy "tender_matches: company members read" on public.tender_matches
  for select using (
    company_id in (select company_id from public.company_users where user_id = auth.uid())
    or public.is_platform_admin(auth.uid())
  );

create policy "tender_workspaces: company members" on public.tender_workspaces
  for all using (
    company_id in (select company_id from public.company_users where user_id = auth.uid())
    or public.is_platform_admin(auth.uid())
  );

create policy "funding_saved: company members" on public.funding_saved
  for all using (
    company_id in (select company_id from public.company_users where user_id = auth.uid())
    or public.is_platform_admin(auth.uid())
  );

create policy "compliance_items: company members" on public.compliance_items
  for all using (
    company_id in (select company_id from public.company_users where user_id = auth.uid())
    or public.is_platform_admin(auth.uid())
  );

create policy "compliance_events: company members" on public.compliance_events
  for all using (
    company_id in (select company_id from public.company_users where user_id = auth.uid())
    or public.is_platform_admin(auth.uid())
  );

create policy "orders: own orders" on public.orders
  for select using (user_id = auth.uid() or public.is_platform_admin(auth.uid()));

create policy "subscriptions: own subscriptions" on public.subscriptions
  for select using (user_id = auth.uid() or public.is_platform_admin(auth.uid()));

create policy "notifications: own notifications" on public.notifications
  for all using (user_id = auth.uid());

create policy "company_name_searches: own" on public.company_name_searches
  for all using (user_id = auth.uid() or public.is_platform_admin(auth.uid()));

create policy "company_verifications: company members" on public.company_verifications
  for select using (
    company_id in (select company_id from public.company_users where user_id = auth.uid())
    or public.is_platform_admin(auth.uid())
  );

create policy "company_directors: company members" on public.company_directors
  for all using (
    company_id in (select company_id from public.company_users where user_id = auth.uid())
    or public.is_platform_admin(auth.uid())
  );

-- Public read tables (tenders, funding, products) — no RLS needed, but restrict writes:
alter table public.tenders enable row level security;
create policy "tenders: public read" on public.tenders for select using (true);
create policy "tenders: admin write" on public.tenders for insert with check (public.is_platform_admin(auth.uid()));
create policy "tenders: admin update" on public.tenders for update using (public.is_platform_admin(auth.uid()));

alter table public.funding_opportunities enable row level security;
create policy "funding: public read published" on public.funding_opportunities
  for select using (status = 'published' or public.is_platform_admin(auth.uid()));
create policy "funding: admin write" on public.funding_opportunities for insert with check (public.is_platform_admin(auth.uid()));
create policy "funding: admin update" on public.funding_opportunities for update using (public.is_platform_admin(auth.uid()));

alter table public.products enable row level security;
create policy "products: public read active" on public.products
  for select using (is_active = true or public.is_platform_admin(auth.uid()));
create policy "products: admin write" on public.products for insert with check (public.is_platform_admin(auth.uid()));
create policy "products: admin update" on public.products for update using (public.is_platform_admin(auth.uid()));

-- New company row: creator becomes owner (handled in app logic via a Postgres function)
create or replace function public.create_company_with_owner(
  p_name text, p_province text, p_industry text
) returns uuid
language plpgsql security definer as $$
declare
  v_id uuid;
begin
  insert into public.companies (name, province, industry) values (p_name, p_province, p_industry)
  returning id into v_id;
  insert into public.company_users (company_id, user_id, role) values (v_id, auth.uid(), 'owner');
  return v_id;
end;
$$;
