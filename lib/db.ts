import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let client: NeonQueryFunction<false, false> | undefined;

// Lazy on purpose: importing this module must never require DATABASE_URL to
// be set, since Next.js evaluates route modules at build time just to read
// their config exports (e.g. `dynamic`), long before any request happens.
export function getDb(): NeonQueryFunction<false, false> {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL is not set");
    }
    client = neon(url);
  }
  return client;
}
