# KADYLUXE × COAST · 2026 Marketing Budget

Internal Next.js app for the KADYLUXE fractional CMO engagement. Models three
2026 marketing budget scenarios (10% / 15% / 20% of $3M DTC goal) with editable
partners and monthly variable spend, persisted to Supabase Postgres.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Supabase (Postgres + email/password auth) via `@supabase/ssr`

## Features

- Email + password authentication (`signInWithPassword` / `signUp`). The login
  page has a sign-up toggle; new accounts are signed in immediately, with no
  email confirmation step.
- Three scenarios with full partner CRUD, monthly variable spend, and a
  side-by-side comparison table.
- Auto-save with 500ms debounce. Optimistic UI updates.
- View-only share links: `/view/{token}` loads the owner's scenarios with all
  inputs disabled and no login required. Tokens can be revoked.
- All edits recorded to a `change_log` audit table.
- JSON export of the full scenario bundle.

## Required environment variables

Copy `.env.local.example` to `.env.local` and fill in:

| Variable | Where it's used |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + server |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only — used by API routes for writes and seeding |
| `NEXT_PUBLIC_SITE_URL` | Reserved for future absolute-URL needs (currently unused by auth) |

In Vercel, set `NEXT_PUBLIC_SITE_URL` to the production URL (e.g.
`https://budget.kadyluxe.com`).

### Supabase auth settings

Under **Authentication → Providers → Email**, disable **Confirm email** so
that `signUp` returns a session immediately. With that off, new accounts can
log in right after creating their password without round-tripping through an
email link.

## Database schema

The app expects the following tables (RLS enabled). Service-role API routes
bypass RLS and scope every query by `user_id`.

```sql
-- one row per (user, scenario_key)
create table scenarios (
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null check (key in ('option1','option2','option3')),
  name text not null,
  pct numeric not null,
  primary key (user_id, key)
);

create table partners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scenario_key text not null check (scenario_key in ('option1','option2','option3')),
  name text not null,
  category text,
  cost numeric not null default 0,
  type text not null check (type in ('annual','monthly')),
  months integer,
  included boolean not null default true,
  notes text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index on partners (user_id, scenario_key, position);

create table monthly_variable (
  user_id uuid not null references auth.users(id) on delete cascade,
  scenario_key text not null check (scenario_key in ('option1','option2','option3')),
  month text not null,
  amount numeric not null default 0,
  primary key (user_id, scenario_key, month)
);

create table share_links (
  token text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);
create index on share_links (user_id);

create table change_log (
  id bigserial primary key,
  user_id uuid not null,
  table_name text not null,
  record_id text not null,
  action text not null check (action in ('create','update','delete')),
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);
create index on change_log (user_id, created_at desc);
```

### Seed data

Default partners and monthly variable amounts are seeded automatically the
first time an authenticated user loads `/budget`. See
`lib/data.ts → ensureUserSeed`.

## Development

```bash
npm install
cp .env.local.example .env.local   # fill in values
npm run dev
```

`npm run build` must succeed before merging.

## Routes

| Path | Description |
| --- | --- |
| `/` | Redirects to `/budget` (authed) or `/login` |
| `/login` | Email + password form (with sign-up toggle) |
| `/auth/sign-out` | POST endpoint that clears the session |
| `/budget` | 2026 budget tool (auth required) |
| `/team` | Team architecture / marketing operating system (auth required) |
| `/cashflow` | Monthly cash flow projection — outflows from a budget scenario + modeled inflows (auth required) |
| `/view/{token}` | Read-only tabbed view (budget + team) via share link |
| `/api/partners` / `/api/partners/[id]` | Budget partner CRUD |
| `/api/monthly` | PATCH — upsert monthly variable cell |
| `/api/share` | POST create / DELETE revoke share link |
| `/api/team/stages/[id]` | PATCH stage name / KPI |
| `/api/team/partners` / `/api/team/partners/[id]` | Team partner CRUD (max 6 per stage) |
| `/api/team/foundation/[id]` | PATCH foundation cell |
| `/api/team/operator` | PATCH operator name / description (writes to `team_settings`) |
| `/api/team/capability` | PATCH lever title / description (writes to `team_settings`) |
| `/api/team/culture` | PATCH "what this is / is not" lists (writes to `team_settings`) |
| `/api/cashflow/assumptions` | PATCH cash flow assumptions (per-user row in `cashflow_assumptions`) |

## Team Architecture page

`/team` is the editorial one-pager (Marketing operating system). All cells
are inline-editable on hover; status (confirmed / recommended / vision) is
set via a small swatch picker that appears on cell hover. The 5 stages and
3 foundation cells are intentionally locked in count — the constraint is
the feature.

The team tables (`team_stages`, `team_partners`, `team_foundation`,
`team_settings`) already exist in the production Supabase project; no
migration is required. On first load `/team` auto-seeds 5 stages, 20
partners, 3 foundation rows, and a single `team_settings` row (operator
name + description, lever title + description, and the "what this is /
is not" JSONB lists) if those tables are empty.

## Cash flow page

`/cashflow` projects monthly cash needs across May–Dec. Outflows pull from a
selected budget scenario (fixed retainers spread evenly over 12 months,
variable working spend per month, Scott's fee, optional Broncos line).
Inflows are modeled per-month from baseline organic + paid (3-week lag) +
email (% of gross) + influencer (6-week lag) × contribution margin.

The math:

- `paid_revenue[N] = paid_spend[N−1] × paid_ROAS[N]` — first month is $0 because April spend is not modeled.
- `influencer_revenue[N] = influencer_spend[N−2] × influencer_ROAS`.
- `email_revenue[N] = pct[N] × gross[N]`, solved as `gross = (baseline + paid + influencer) / (1 − pct)`.
- `net_cash_inflow = gross × contribution_margin`.
- `monthly_net = net_cash_inflow − total_outflows`; cumulative is the running total.
- Influencer spend is auto-detected from partners whose category contains "Influencer". Broncos is excluded from the fixed retainer sum so the cashflow toggle is the single source of truth.

Run this SQL in Supabase once before visiting `/cashflow`:

```sql
create table cashflow_assumptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  baseline_dtc_monthly numeric default 40000,
  seasonality jsonb default '{"May":0.5,"Jun":0.6,"Jul":0.8,"Aug":1.4,"Sep":1.6,"Oct":1.4,"Nov":1.8,"Dec":1.5}'::jsonb,
  paid_roas_by_month jsonb default '{"May":2.0,"Jun":2.2,"Jul":2.5,"Aug":3.0,"Sep":3.5,"Oct":3.5,"Nov":3.5,"Dec":3.0}'::jsonb,
  influencer_roas numeric default 2.5,
  email_pct_by_month jsonb default '{"May":0.05,"Jun":0.07,"Jul":0.10,"Aug":0.12,"Sep":0.15,"Oct":0.18,"Nov":0.20,"Dec":0.20}'::jsonb,
  aov numeric default 155,
  site_cvr numeric default 0.013,
  contribution_margin numeric default 0.35,
  paid_lag_weeks numeric default 3,
  influencer_lag_weeks numeric default 6,
  scott_fee_monthly numeric default 12000,
  broncos_included boolean default false,
  broncos_amount numeric default 150000,
  selected_scenario_slug text default 'option3',
  updated_at timestamptz default now()
);

alter table cashflow_assumptions enable row level security;
create policy "users own cashflow_assumptions" on cashflow_assumptions for all using (auth.uid() = user_id);
create policy "anon read cashflow_assumptions" on cashflow_assumptions for select using (true);
```

A row is auto-inserted for the user on first visit if missing.

## Notes

- The original `budget_tool.jsx` reference component is kept at the repo root.
- Auto-save fires 500ms after the last edit per field. The header shows
  "Saving…" while requests are in flight and "Saved" otherwise.
