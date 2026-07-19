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
