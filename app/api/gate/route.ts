import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE_NAME,
  createSessionToken,
  sessionCookieOptions,
  verifyPasscode,
} from "@/lib/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const passcode = typeof body?.passcode === "string" ? body.passcode : "";

  if (!verifyPasscode(passcode)) {
    return NextResponse.json({ error: "Incorrect passcode" }, { status: 401 });
  }

  const token = await createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);

  return NextResponse.json({ ok: true });
}
