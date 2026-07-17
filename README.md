# Family Dashboard

An always-on dashboard for the kitchen: today's calendar, unread email, and a
shared family to-do list, built for a wall-mounted tablet.

## Status

- [x] Static dashboard layout with mock data (Calendar / Email / Family To-Do
      panels, clock)
- [x] Passcode gate
- [ ] Google Cloud project + OAuth connection (Calendar, Gmail, Tasks)
- [ ] Real calendar data
- [ ] Real email data
- [ ] Real to-do list (Google Tasks-backed, dedicated "Family" list)
- [ ] Kitchen-tablet polish (kiosk mode, resilience, final setup docs)

The full manual setup checklist (Google Cloud Console, Vercel, Neon) will
land in this README as those pieces are built.

## Stack

Next.js (App Router) + TypeScript, deployed on Vercel. Calendar, email, and
the family to-do list are all backed by the connected Google account
(Calendar API, Gmail API, Tasks API); Neon Postgres stores just the one
refresh token.

## Local development

Copy `.env.example` to `.env.local` and fill in `DASHBOARD_PASSCODE` and
`SESSION_SECRET` (generate the latter with `openssl rand -base64 32`).

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll land on the
passcode gate first.
