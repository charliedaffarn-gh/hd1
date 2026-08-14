import { getDb } from "@/lib/db";
import type { CalendarEvent } from "@/types";

export interface HitchinEventsCache {
  computedAt: string;
  items: CalendarEvent[];
}

// The dashboard's live poll only ever reads this cached row — the actual
// scrape runs monthly from the cron route below (see
// app/api/cron/hitchin-events/route.ts).
export async function getCachedHitchinEvents(): Promise<HitchinEventsCache | null> {
  const sql = getDb();
  const rows = await sql`
    select computed_at as "computedAt", items
    from hitchin_events
    where id = 1
  `;
  const row = rows[0] as { computedAt: string; items: CalendarEvent[] } | undefined;
  return row ? { computedAt: row.computedAt, items: row.items } : null;
}

export async function storeHitchinEvents(items: CalendarEvent[]): Promise<HitchinEventsCache> {
  const sql = getDb();
  const rows = await sql`
    insert into hitchin_events (id, computed_at, items)
    values (1, now(), ${JSON.stringify(items)}::jsonb)
    on conflict (id) do update
      set computed_at = excluded.computed_at,
          items = excluded.items
    returning computed_at as "computedAt"
  `;

  const computedAt = rows[0]?.computedAt as string;
  return { computedAt, items };
}
