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
| `/view/{token}` | Read-only tabbed view (budget + team) via share link |
| `/api/partners` / `/api/partners/[id]` | Budget partner CRUD |
| `/api/monthly` | PATCH — upsert monthly variable cell |
| `/api/share` | POST create / DELETE revoke share link |
| `/api/team/stages/[id]` | PATCH stage name / sub-label / KPI |
| `/api/team/partners` / `/api/team/partners/[id]` | Team partner CRUD (max 6 per stage) |
| `/api/team/foundation/[id]` | PATCH foundation cell |
| `/api/team/operator` | PATCH operator block |
| `/api/team/capability` | PATCH capability callout |
| `/api/team/culture` | PATCH "what this is / is not" lists |

## Team Architecture page

`/team` is the editorial one-pager (Marketing operating system). All cells
are inline-editable on hover; status (confirmed / recommended / vision) is
set via a small swatch picker that appears on cell hover. The 5 stages and
3 foundation cells are intentionally locked in count — the constraint is
the feature.

Schema: see `db/team_schema.sql`. Run once in Supabase SQL Editor before
visiting `/team`. The seed (20 partners, 3 foundation rows, operator,
capability callout, "what this is / is not" lists) is inserted
automatically by the server on first load if the tables are empty.

## Notes

- The original `budget_tool.jsx` reference component is kept at the repo root.
- Auto-save fires 500ms after the last edit per field. The header shows
  "Saving…" while requests are in flight and "Saved" otherwise.
