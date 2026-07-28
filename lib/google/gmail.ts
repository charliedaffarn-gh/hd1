import { google, type gmail_v1 } from "googleapis";
import { listAccountsWithTokens } from "@/lib/accounts";
import { buildOAuth2Client } from "./oauth";
import type { RawEmailMessage } from "@/types";
// Imported (not read via fs at request time) so Vercel's build always
// bundles it correctly — a runtime fs.readFileSync on a repo file is not
// reliably included in the serverless function's deployment.
import blockRulesList from "@/config/email-blocklist.json";

const MAX_TRIAGE_CANDIDATES_PER_ACCOUNT = 40;
const MAX_FLAGGED_PER_ACCOUNT = 20;
const DEFAULT_ATTENTION_LABEL = "NeedsAttention";
const DEFAULT_TRIAGE_MAX_AGE_DAYS = 30;

interface BlockLists {
  sender?: string[];
  subjectContains?: string[];
  other?: string[];
}

// Cast for safety regardless of the file's exact contents at any given
// time (an empty array literal, in particular, infers as never[]).
const blockLists = blockRulesList as BlockLists;

function cleanList(values: string[] | undefined): string[] {
  return (values ?? []).map((value) => value.trim().toLowerCase()).filter(Boolean);
}

const BLOCKED_SENDERS = new Set(cleanList(blockLists.sender));
const BLOCKED_SUBJECT_WORDS = cleanList(blockLists.subjectContains);
const BLOCKED_OTHER_WORDS = cleanList(blockLists.other);

function getHeader(message: gmail_v1.Schema$Message, name: string): string {
  const header = message.payload?.headers?.find(
    (candidate) => candidate.name?.toLowerCase() === name.toLowerCase(),
  );
  return header?.value ?? "";
}

function parseFromName(from: string): string {
  const match = from.match(/^"?([^"<]+)"?\s*<.*>$/);
  return (match ? match[1] : from).trim();
}

function parseFromEmail(from: string): string {
  const match = from.match(/<([^<>]+)>/);
  return (match ? match[1] : from).trim().toLowerCase();
}

// A message is blocked if it matches an entry in any of the three lists.
// "sender" is an exact address match; "subjectContains" and "other" are
// case-insensitive substring matches — "other" checks sender, subject, and
// snippet together, a broader catch-all for anything the first two don't
// neatly cover.
function matchesBlockRule(from: string, subject: string, snippet: string): boolean {
  const fromEmail = parseFromEmail(from);
  if (BLOCKED_SENDERS.has(fromEmail)) return true;

  const subjectLower = subject.toLowerCase();
  if (BLOCKED_SUBJECT_WORDS.some((needle) => subjectLower.includes(needle))) return true;

  const fromLower = from.toLowerCase();
  const snippetLower = snippet.toLowerCase();
  return BLOCKED_OTHER_WORDS.some(
    (needle) =>
      fromLower.includes(needle) || subjectLower.includes(needle) || snippetLower.includes(needle),
  );
}

function getAttentionLabel(): string {
  return process.env.GMAIL_ATTENTION_LABEL?.trim() || DEFAULT_ATTENTION_LABEL;
}

function getTriageMaxAgeDays(): number {
  const parsed = Number(process.env.GMAIL_TRIAGE_MAX_AGE_DAYS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TRIAGE_MAX_AGE_DAYS;
}

async function fetchAccountMessages(
  email: string,
  refreshToken: string,
  query: string,
  maxResults: number,
  applyBlocklist: boolean,
): Promise<RawEmailMessage[]> {
  const client = buildOAuth2Client();
  client.setCredentials({ refresh_token: refreshToken });
  const gmail = google.gmail({ version: "v1", auth: client });

  const list = await gmail.users.messages.list({
    userId: "me",
    q: query,
    maxResults,
  });

  const messageIds = list.data.messages ?? [];

  const messages = await Promise.all(
    messageIds.map(async ({ id }) => {
      const { data } = await gmail.users.messages.get({
        userId: "me",
        id: id!,
        format: "metadata",
        metadataHeaders: ["From", "Subject"],
      });
      return data;
    }),
  );

  const kept = applyBlocklist
    ? messages.filter(
        (message) =>
          !matchesBlockRule(
            getHeader(message, "From"),
            getHeader(message, "Subject"),
            message.snippet ?? "",
          ),
      )
    : messages;

  return kept.map((message) => ({
    id: `${email}:${message.id}`,
    from: parseFromName(getHeader(message, "From")),
    subject: getHeader(message, "Subject") || "(no subject)",
    snippet: message.snippet ?? "",
    receivedAt: message.internalDate
      ? new Date(Number(message.internalDate)).toISOString()
      : new Date().toISOString(),
    sourceEmail: email,
  }));
}

async function fetchAcrossAccounts(
  query: string,
  maxResultsPerAccount: number,
  applyBlocklist: boolean,
): Promise<RawEmailMessage[]> {
  const accounts = await listAccountsWithTokens();

  const results = await Promise.allSettled(
    accounts.map((account) =>
      fetchAccountMessages(
        account.email,
        account.refreshToken,
        query,
        maxResultsPerAccount,
        applyBlocklist,
      ),
    ),
  );

  const messages: RawEmailMessage[] = [];
  results.forEach((result, index) => {
    if (result.status !== "fulfilled") {
      console.error(`Failed to fetch Gmail for "${accounts[index].email}":`, result.reason);
      return;
    }
    messages.push(...result.value);
  });

  messages.sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
  return messages;
}

// Not filtered to unread — a read-but-unactioned school notice or bill is
// exactly what the triage should still catch, unread was never a reliable
// signal of importance. Bounded by recency instead: some inboxes carry
// years of backlog that was never going to get triaged, so cap how far
// back the digest looks. Archiving a message (removing it from the inbox)
// is the practical way to keep something out of future runs.
export async function getInboxSummary(): Promise<RawEmailMessage[]> {
  const maxAgeDays = getTriageMaxAgeDays();
  return fetchAcrossAccounts(
    `in:inbox newer_than:${maxAgeDays}d`,
    MAX_TRIAGE_CANDIDATES_PER_ACCOUNT,
    true,
  );
}

// Mail any family member has manually labeled as needing attention, across
// every connected account, regardless of read state or whether it's still
// in the inbox. Checked live on every dashboard poll (cheap, no LLM call)
// rather than waiting on the nightly triage, since a manual flag is by
// definition something that matters right now. The sender blocklist does
// NOT apply here — a manual label is a deliberate, specific override that
// should win even for a generally-blocked sender.
export async function getFlaggedMessages(): Promise<RawEmailMessage[]> {
  return fetchAcrossAccounts(`label:"${getAttentionLabel()}"`, MAX_FLAGGED_PER_ACCOUNT, false);
}
