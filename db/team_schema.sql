-- Team Architecture schema. Run once in Supabase SQL Editor.
-- Single-tenant: rows are global, scoped by API auth (service-role bypasses RLS).

create table if not exists team_stages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sub_label text not null default '',
  kpi text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists team_partners (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references team_stages(id) on delete cascade,
  name text not null default '',
  vendor text not null default '',
  status text not null check (status in ('confirmed','recommended','vision')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists team_partners_stage_idx on team_partners (stage_id, sort_order);

create table if not exists team_foundation (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  vendor text not null default '',
  status text not null check (status in ('confirmed','recommended','vision')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists team_operator (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  tagline text not null default '',
  body text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists team_capability (
  id uuid primary key default gen_random_uuid(),
  section_title text not null default '',
  callout_title text not null default '',
  callout_body text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists team_culture (
  id uuid primary key default gen_random_uuid(),
  is_list jsonb not null default '[]'::jsonb,
  is_not_list jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- Enable RLS. Service-role API routes bypass RLS so they always work;
-- direct anon/authenticated reads are blocked unless you add policies.
alter table team_stages     enable row level security;
alter table team_partners   enable row level security;
alter table team_foundation enable row level security;
alter table team_operator   enable row level security;
alter table team_capability enable row level security;
alter table team_culture    enable row level security;
