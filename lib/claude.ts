import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { RawEmailMessage } from "@/types";

let cachedClient: Anthropic | undefined;

// Lazy on purpose — see lib/db.ts for why: importing this module must never
// require ANTHROPIC_API_KEY to be set, since Next.js evaluates route modules
// at build time just to read their config exports.
function getClient(): Anthropic {
  if (!cachedClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    cachedClient = new Anthropic({ apiKey });
  }
  return cachedClient;
}

const TriageResultSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      reason: z.string(),
    }),
  ),
});

const SYSTEM_PROMPT = `You are triaging recent inbox email for a family's kitchen dashboard. You will receive a JSON array of messages (read or unread), each with an id, sender, subject, and a short snippet.

Return only the messages that genuinely need the family's attention soon: school notices and reminders, deliveries arriving today or very soon, appointment or event reminders, bills or payments due, RSVPs, and personal messages from real people they know.

Exclude marketing, sales, newsletters, and other automated promotional email, even from a retailer or service the family actually uses. When in doubt, leave it out — an empty list is a completely fine result if nothing needs attention.

For each message you keep, write a short, factual one-sentence reason it matters.`;

export interface TriageItem {
  id: string;
  reason: string;
}

export async function triageEmails(messages: RawEmailMessage[]): Promise<TriageItem[]> {
  if (messages.length === 0) return [];

  const client = getClient();
  const response = await client.messages.parse({
    model: "claude-haiku-4-5",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: JSON.stringify(
          messages.map((message) => ({
            id: message.id,
            from: message.from,
            subject: message.subject,
            snippet: message.snippet,
          })),
        ),
      },
    ],
    output_config: { format: zodOutputFormat(TriageResultSchema) },
  });

  return response.parsed_output?.items ?? [];
}
