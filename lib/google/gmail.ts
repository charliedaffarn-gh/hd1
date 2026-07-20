import { google, type gmail_v1 } from "googleapis";
import { listAccountsWithTokens } from "@/lib/accounts";
import { buildOAuth2Client } from "./oauth";
import type { RawEmailMessage } from "@/types";

const MAX_UNREAD_PER_ACCOUNT = 10;
const MAX_FLAGGED_PER_ACCOUNT = 20;
const DEFAULT_ATTENTION_LABEL = "NeedsAttention";

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

function getAttentionLabel(): string {
  return process.env.GMAIL_ATTENTION_LABEL?.trim() || DEFAULT_ATTENTION_LABEL;
}

async function fetchAccountMessages(
  email: string,
  refreshToken: string,
  query: string,
  maxResults: number,
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

  return messages.map((message) => ({
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
): Promise<RawEmailMessage[]> {
  const accounts = await listAccountsWithTokens();

  const results = await Promise.allSettled(
    accounts.map((account) =>
      fetchAccountMessages(account.email, account.refreshToken, query, maxResultsPerAccount),
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

export async function getInboxSummary(): Promise<RawEmailMessage[]> {
  return fetchAcrossAccounts("is:unread in:inbox", MAX_UNREAD_PER_ACCOUNT);
}

// Mail any family member has manually labeled as needing attention, across
// every connected account, regardless of read state or whether it's still
// in the inbox. Checked live on every dashboard poll (cheap, no LLM call)
// rather than waiting on the nightly triage, since a manual flag is by
// definition something that matters right now.
export async function getFlaggedMessages(): Promise<RawEmailMessage[]> {
  return fetchAcrossAccounts(`label:"${getAttentionLabel()}"`, MAX_FLAGGED_PER_ACCOUNT);
}
