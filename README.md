# Family Dashboard

An always-on dashboard for the kitchen: today's calendar, unread email, and a
shared family to-do list, built for a wall-mounted tablet.

## Status

- [x] Static dashboard layout with mock data (Calendar / Email / Family To-Do
      panels, clock)
- [x] Passcode gate
- [x] Google Cloud project + OAuth connection (Calendar, Gmail, Tasks)
- [x] Real calendar data
- [x] Real email data (collated across multiple connected inboxes)
- [x] Nightly Claude-based email triage (replaces Gmail's native "Important"
      label with an LLM-curated "needs attention" list + one-line reason)
- [ ] Real to-do list (Google Tasks-backed, dedicated "Family" list)
- [ ] Kitchen-tablet polish (kiosk mode, resilience, final setup docs)

The full manual setup checklist (Google Cloud Console, Vercel, Neon) will
land in this README as those pieces are built.

Once deployed with the env vars below set, visit `/settings` (behind the
passcode gate) and click "Connect Google Account" to link the family Google
account — this powers Calendar, Tasks, and one Email source. From the same
page, "Connect another Gmail inbox" links additional personal inboxes
(Gmail-only access) into the same collated Email panel.

Unread mail across every connected inbox is triaged once a night by Claude
(Haiku) via a Vercel Cron job (`vercel.json`, `/api/cron/email-digest`,
protected by `CRON_SECRET`) and cached in Postgres. The Email panel only
ever reads that cached digest — genuinely time-sensitive items (school
notices, deliveries, bills, RSVPs) each get a short reason; marketing and
newsletters are filtered out entirely. The dashboard's live poll never
calls Google or Anthropic directly, so it stays fast and cheap regardless
of how often the tablet refreshes.

## Stack

Next.js (App Router) + TypeScript, deployed on Vercel. Calendar, email, and
the family to-do list are all backed by the connected Google account
(Calendar API, Gmail API, Tasks API); Neon Postgres stores just the one
refresh token.

## Local development

Copy `.env.example` to `.env.local` and fill in at least `DASHBOARD_PASSCODE`
and `SESSION_SECRET` (generate the latter with `openssl rand -base64 32`) to
run the dashboard and gate locally. The Google/`DATABASE_URL` variables are
only needed once you want `/settings` and the OAuth flow working locally too
— without them the rest of the app still runs, `/settings` just errors.
`ANTHROPIC_API_KEY` and `CRON_SECRET` are only needed to run the nightly
email digest locally (`curl -H "Authorization: Bearer $CRON_SECRET"
http://localhost:3000/api/cron/email-digest`) — without them the Email panel
still renders, it just shows "No digest yet."

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll land on the
passcode gate first.
