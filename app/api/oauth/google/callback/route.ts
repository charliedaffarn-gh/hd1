import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  OAUTH_STATE_COOKIE_NAME,
  exchangeCodeForTokens,
  getConnectedEmail,
  type OAuthRole,
} from "@/lib/google/oauth";
import { upsertAccount } from "@/lib/accounts";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const returnedState = searchParams.get("state");
  const oauthError = searchParams.get("error");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(OAUTH_STATE_COOKIE_NAME)?.value;
  cookieStore.delete(OAUTH_STATE_COOKIE_NAME);

  if (oauthError) {
    return NextResponse.redirect(`${origin}/settings?error=${encodeURIComponent(oauthError)}`);
  }

  if (!code || !returnedState || !expectedState || returnedState !== expectedState) {
    return NextResponse.redirect(`${origin}/settings?error=state_mismatch`);
  }

  const [role] = expectedState.split(".") as [OAuthRole];

  try {
    const { client, tokens } = await exchangeCodeForTokens(code);
    const email = await getConnectedEmail(client);
    await upsertAccount({
      email,
      refreshToken: tokens.refresh_token ?? undefined,
      isPrimary: role === "primary",
    });
  } catch (err) {
    console.error("Google OAuth callback failed:", err);
    return NextResponse.redirect(`${origin}/settings?error=exchange_failed`);
  }

  return NextResponse.redirect(`${origin}/settings?connected=1`);
}
