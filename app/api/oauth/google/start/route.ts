import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { OAUTH_STATE_COOKIE_NAME, getAuthUrl, type OAuthRole } from "@/lib/google/oauth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role: OAuthRole = searchParams.get("role") === "gmail" ? "gmail" : "primary";
  const state = `${role}.${randomUUID()}`;

  const cookieStore = await cookies();
  cookieStore.set(OAUTH_STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 10,
    path: "/",
  });

  return NextResponse.redirect(getAuthUrl(role, state));
}
