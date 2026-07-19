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
- [ ] Real to-do list (Google Tasks-backed, dedicated "Family" list)
- [ ] Kitchen-tablet polish (kiosk mode, resilience, final setup docs)

The full manual setup checklist (Google Cloud Console, Vercel, Neon) will
land in this README as those pieces are built.

Once deployed with the env vars below set, visit `/settings` (behind the
passcode gate) and click "Connect Google Account" to link the family Google
account — this powers Calendar, Tasks, and one Email source. From the same
page, "Connect another Gmail inbox" links additional personal inboxes
(Gmail-only access) into the same collated Email panel, each tagged by
sender inbox, with Gmail's own "Important" flag highlighted.

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

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll land on the
passcode gate first.
