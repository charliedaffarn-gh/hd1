import { getDb } from "@/lib/db";

export interface GoogleAccount {
  id: number;
  email: string;
  isPrimary: boolean;
  createdAt: string;
}

export async function listGoogleAccounts(): Promise<GoogleAccount[]> {
  const sql = getDb();
  const rows = await sql`
    select id, email, is_primary as "isPrimary", created_at as "createdAt"
    from google_accounts
    order by is_primary desc, created_at asc
  `;
  return rows as GoogleAccount[];
}

export async function getPrimaryRefreshToken(): Promise<string | null> {
  const sql = getDb();
  const rows = await sql`
    select refresh_token as "refreshToken" from google_accounts where is_primary limit 1
  `;
  return (rows[0]?.refreshToken as string | undefined) ?? null;
}

export async function upsertAccount(params: {
  email: string;
  refreshToken?: string;
  isPrimary: boolean;
}): Promise<void> {
  const { email, refreshToken, isPrimary } = params;
  const sql = getDb();

  // Demote any existing primary first so the partial unique index on
  // is_primary never sees two true rows at once.
  if (isPrimary) {
    await sql`update google_accounts set is_primary = false where is_primary and email <> ${email}`;
  }

  if (refreshToken) {
    await sql`
      insert into google_accounts (email, refresh_token, is_primary)
      values (${email}, ${refreshToken}, ${isPrimary})
      on conflict (email) do update
        set refresh_token = excluded.refresh_token,
            is_primary = excluded.is_primary,
            updated_at = now()
    `;
  } else {
    // Re-consent didn't return a fresh refresh token — Google only sends
    // one on first consent. Keep whatever token is already stored.
    await sql`
      update google_accounts
      set is_primary = ${isPrimary}, updated_at = now()
      where email = ${email}
    `;
  }
}
