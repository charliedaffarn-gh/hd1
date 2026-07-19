import { google, type gmail_v1 } from "googleapis";
import { listAccountsWithTokens } from "@/lib/accounts";
import { buildOAuth2Client } from "./oauth";
import type { EmailMessage } from "@/types";

const MAX_MESSAGES_PER_ACCOUNT = 10;

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

async function getAccountMessages(email: string, refreshToken: string): Promise<EmailMessage[]> {
  const client = buildOAuth2Client();
  client.setCredentials({ refresh_token: refreshToken });
  const gmail = google.gmail({ version: "v1", auth: client });

  const list = await gmail.users.messages.list({
    userId: "me",
    q: "is:unread in:inbox",
    maxResults: MAX_MESSAGES_PER_ACCOUNT,
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
    important: message.labelIds?.includes("IMPORTANT") ?? false,
  }));
}

export async function getInboxSummary(): Promise<EmailMessage[]> {
  const accounts = await listAccountsWithTokens();

  const results = await Promise.allSettled(
    accounts.map((account) => getAccountMessages(account.email, account.refreshToken)),
  );

  const messages: EmailMessage[] = [];
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
