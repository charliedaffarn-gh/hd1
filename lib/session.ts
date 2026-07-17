import { timingSafeEqual } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE_NAME = "session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecretKey());
    return true;
  } catch {
    return false;
  }
}

export function verifyPasscode(input: string): boolean {
  const expected = process.env.DASHBOARD_PASSCODE;
  if (!expected) return false;

  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  maxAge: SESSION_MAX_AGE_SECONDS,
  path: "/",
};
