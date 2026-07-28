# Family Dashboard

An always-on dashboard for the kitchen: today's calendar, email that needs
attention, and a shared family to-do list, built for a wall-mounted tablet.

## Status

- [x] Static dashboard layout with mock data (Calendar / Email / Family To-Do
      panels, clock)
- [x] Passcode gate
- [x] Google Cloud project + OAuth connection (Calendar, Gmail, Tasks)
- [x] Real calendar data
- [x] Real email data (collated across multiple connected inboxes)
- [x] Nightly Claude-based email triage (replaces Gmail's native "Important"
      label with an LLM-curated "needs attention" list + one-line reason)
- [x] Real to-do list (Google Tasks-backed, dedicated "Family" list)
- [ ] Kitchen-tablet polish (kiosk mode, resilience, final setup docs)

The full manual setup checklist (Google Cloud Console, Vercel, Neon) will
land in this README as those pieces are built.

Once deployed with the env vars below set, visit `/settings` (behind the
passcode gate) and click "Connect Google Account" to link the family Google
account — this powers Calendar, Tasks, and one Email source. From the same
page, "Connect another Gmail inbox" links additional personal inboxes
(Gmail-only access) into the same collated Email panel.

The Family To-Do panel reads and writes a dedicated Google Tasks list (name
set by `GOOGLE_TASKLIST_NAME`, default "Family") on the primary account,
created automatically the first time the app looks for it. Checking a task
off on the tablet updates Google Tasks directly, so it stays in sync with
the Google Tasks app on everyone's phone too.

Recent inbox mail across every connected account — read or unread, within
the last `GMAIL_TRIAGE_MAX_AGE_DAYS` (default 30) — is triaged once a
night and cached in Postgres; the Email panel just reads that cached
digest on every poll. Genuinely time-sensitive items (school notices,
deliveries, bills, RSVPs) each get a short reason, marketing and
newsletters are filtered out entirely, and unread status plays no part in
the judgment — a read-but-unactioned notice is exactly what this should
still catch. Archiving a message in Gmail is what keeps it out of future
runs. There are two independent ways this digest gets computed, and either
(or both) can be running at once — whichever last wrote the `email_digest`
row is what the panel shows:

1. **Vercel Cron + Anthropic API** (`vercel.json`, `GET /api/cron/email-digest`,
   `CRON_SECRET`-protected): the original path, fires nightly, calls Claude
   Haiku directly via `ANTHROPIC_API_KEY`. Small ongoing API cost.
2. **A Claude Code Routine, no API key needed**: a scheduled Routine reads
   `GET /api/cron/raw-inbox` (same inbox fan-out as above, just exposed
   read-only), does the same triage judgment itself as part of an agent
   turn instead of a metered API call, then writes the result via
   `POST /api/cron/email-digest`. Both new routes share one
   `DIGEST_IMPORT_SECRET` bearer secret. Costs nothing beyond your existing
   Claude usage; the tradeoff is it depends on that Routine continuing to
   fire reliably, rather than Vercel's fully self-contained cron.

Alongside the nightly triage, any message manually labeled
**`NeedsAttention`** (name configurable via `GMAIL_ATTENTION_LABEL`) in any
connected Gmail account is checked live on every poll and shown
immediately — no need to wait for the next overnight run. This is a plain
Gmail label, so create it once in each connected account's Gmail (Settings
→ Labels, or just "Create new" from the label list while viewing an email)
and apply it to anything that should show up on the dashboard right away.
Removing the label drops it off the dashboard on the next refresh. This
path needs no Anthropic API key — it works even before `ANTHROPIC_API_KEY`
is set up.

Each item in the Email panel has a checkbox to dismiss it once you've
dealt with it. This is dashboard-side only — it hides the message from
future polls (even if the triage or a label would otherwise keep
resurfacing it) but never modifies Gmail itself, since the app only ever
has read-only Gmail access by design. If you want it gone from Gmail too,
archive or unlabel it there separately.

To permanently exclude something from the nightly triage — a repeat
false-positive that keeps getting flagged — add a rule to
[`config/email-blocklist.json`](config/email-blocklist.json). It's a JSON
array where each entry is one rule with exactly one of these fields set:

| Field | Blocks when... | Example |
|---|---|---|
| `sender` | the message's exact email address matches | `{ "sender": "noreply@example.com" }` |
| `subjectContains` | the subject line contains this text | `{ "subjectContains": "unsubscribe" }` |
| `other` | this text appears anywhere — sender, subject, or snippet | `{ "other": "black friday" }` |

Matching is case-insensitive. The file ships with one placeholder example
of each kind (obviously-fake values like `EXAMPLE_KEYWORD_DELETE_ME`) so
the syntax is easy to copy — replace or remove them and add real rules the
same way, one object per rule. Edit the file directly in GitHub's web UI
(or locally) and push/merge — the next Vercel deploy picks it up
automatically, no other setup needed. This only filters the automated
triage's candidate pool; it does *not* apply to `NeedsAttention`-labeled
mail, since a manual label is a deliberate override that should still win
even for a generally-blocked sender.

Each item in the Email panel also has a checkbox to dismiss it once you've
dealt with it. This is dashboard-side only — it hides the message from
future polls (even if the triage or a label would otherwise keep
resurfacing it) but never modifies Gmail itself, since the app only ever
has read-only Gmail access by design. If you want it gone from Gmail too,
archive or unlabel it there separately.

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
`ANTHROPIC_API_KEY` and `CRON_SECRET` are only needed to run the
Anthropic-API digest path locally (`curl -H "Authorization: Bearer
$CRON_SECRET" http://localhost:3000/api/cron/email-digest`); `DIGEST_IMPORT_SECRET`
is only needed for the Routine-based path's two routes. Without any of
them the Email panel still renders, it just shows "No digest yet."

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll land on the
passcode gate first.
