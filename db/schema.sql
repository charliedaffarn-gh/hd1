create table if not exists google_accounts (
  id bigserial primary key,
  email text not null unique,
  refresh_token text not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- At most one connected account may be the primary (Calendar + Tasks) account.
create unique index if not exists google_accounts_primary_unique
  on google_accounts (is_primary)
  where is_primary;

-- Single-row cache: the latest nightly email triage result.
create table if not exists email_digest (
  id integer primary key default 1,
  computed_at timestamptz not null default now(),
  items jsonb not null,
  constraint email_digest_singleton check (id = 1)
);

-- Message ids dismissed from the dashboard's Email panel. Dashboard-side
-- only: does not touch the message or any label in Gmail itself.
create table if not exists dismissed_emails (
  message_id text primary key,
  dismissed_at timestamptz not null default now()
);

-- Single-row cache: the latest local "What's On in Hitchin" scrape.
-- Refreshed monthly (the listing barely changes), not nightly.
create table if not exists hitchin_events (
  id integer primary key default 1,
  computed_at timestamptz not null default now(),
  items jsonb not null,
  constraint hitchin_events_singleton check (id = 1)
);
