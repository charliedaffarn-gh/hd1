# Family Dashboard

An always-on dashboard for the kitchen: today's calendar, unread email, and a
shared family to-do list, built for a wall-mounted tablet.

## Status

- [x] Static dashboard layout with mock data (Calendar / Email / Family To-Do
      panels, clock)
- [ ] Passcode gate
- [ ] Real to-do list (Postgres-backed, shared across devices)
- [ ] Google OAuth connection
- [ ] Real calendar data
- [ ] Real email data
- [ ] Kitchen-tablet polish (kiosk mode, resilience, final setup docs)

The full manual setup checklist (Google Cloud Console, Vercel, Neon) will
land in this README as those pieces are built.

## Stack

Next.js (App Router) + TypeScript, deployed on Vercel, with Neon Postgres for
the to-do list and a single stored Google refresh token.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
