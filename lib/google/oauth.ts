import { google } from "googleapis";

export type OAuthRole = "primary" | "gmail";

type OAuth2Client = InstanceType<typeof google.auth.OAuth2>;

export const OAUTH_STATE_COOKIE_NAME = "oauth_state";

const PRIMARY_SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/tasks",
  "https://www.googleapis.com/auth/userinfo.email",
];

const GMAIL_ONLY_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
];

export function buildOAuth2Client(): OAuth2Client {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );
}

export function getAuthUrl(role: OAuthRole, state: string): string {
  return buildOAuth2Client().generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: role === "primary" ? PRIMARY_SCOPES : GMAIL_ONLY_SCOPES,
    state,
  });
}

export async function exchangeCodeForTokens(code: string) {
  const client = buildOAuth2Client();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);
  return { client, tokens };
}

export async function getConnectedEmail(client: OAuth2Client): Promise<string> {
  const oauth2 = google.oauth2({ version: "v2", auth: client });
  const { data } = await oauth2.userinfo.get();
  if (!data.email) {
    throw new Error("Google account did not return an email address");
  }
  return data.email;
}
