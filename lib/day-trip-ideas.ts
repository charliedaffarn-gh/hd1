import { getDb } from "@/lib/db";
import type { DayTripIdea } from "@/types";

export interface DayTripIdeasCache {
  computedAt: string;
  items: DayTripIdea[];
}

// The popup only ever reads this cached row — the actual generation runs
// weekly from the cron route below (see app/api/cron/day-trip-ideas/route.ts).
export async function getCachedDayTripIdeas(): Promise<DayTripIdeasCache | null> {
  const sql = getDb();
  const rows = await sql`
    select computed_at as "computedAt", items
    from day_trip_ideas
    where id = 1
  `;
  const row = rows[0] as { computedAt: string; items: DayTripIdea[] } | undefined;
  return row ? { computedAt: row.computedAt, items: row.items } : null;
}

export async function storeDayTripIdeas(items: DayTripIdea[]): Promise<DayTripIdeasCache> {
  const sql = getDb();
  const rows = await sql`
    insert into day_trip_ideas (id, computed_at, items)
    values (1, now(), ${JSON.stringify(items)}::jsonb)
    on conflict (id) do update
      set computed_at = excluded.computed_at,
          items = excluded.items
    returning computed_at as "computedAt"
  `;

  const computedAt = rows[0]?.computedAt as string;
  return { computedAt, items };
}
