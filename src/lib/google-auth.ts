/**
 * Google OAuth and token handling for Calendar API (server-side only).
 * Tokens are stored in an encrypted httpOnly cookie.
 */

import { EncryptJWT, jwtDecrypt } from "jose";

const COOKIE_NAME = "syncprep_google_tokens";
const SCOPE = "https://www.googleapis.com/auth/calendar.events.readonly";

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expires_at: number; // unix ms
}

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set and at least 32 characters");
  }
  return new TextEncoder().encode(secret.slice(0, 32));
}

export function getGoogleAuthUrl(redirectUri: string, state: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("GOOGLE_CLIENT_ID is not set");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent", // force refresh_token on first auth
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<GoogleTokens> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Google OAuth env not set");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${err}`);
  }
  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
  const expiresAt = Date.now() + data.expires_in * 1000;
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: expiresAt,
  };
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<Pick<GoogleTokens, "access_token" | "expires_at">> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Google OAuth env not set");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token refresh failed: ${res.status} ${err}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  return {
    access_token: data.access_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };
}

/** Encrypt and serialize tokens for cookie. */
export async function encryptTokens(tokens: GoogleTokens): Promise<string> {
  const secret = getSecret();
  const jwt = await new EncryptJWT({ ...tokens })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setExpirationTime("30d")
    .encrypt(secret);
  return jwt;
}

/** Decrypt cookie value to tokens. */
export async function decryptTokens(cookieValue: string): Promise<GoogleTokens | null> {
  try {
    const secret = getSecret();
    const { payload } = await jwtDecrypt(cookieValue, secret);
    return payload as unknown as GoogleTokens;
  } catch {
    return null;
  }
}

export function getTokensCookieName(): string {
  return COOKIE_NAME;
}

/** Get a valid access token, refreshing if needed. */
export async function getValidAccessToken(
  tokens: GoogleTokens
): Promise<{ access_token: string; tokens: GoogleTokens }> {
  const bufferMs = 60 * 1000; // refresh 1 min before expiry
  if (tokens.expires_at > Date.now() + bufferMs) {
    return { access_token: tokens.access_token, tokens };
  }
  if (!tokens.refresh_token) {
    throw new Error("Token expired and no refresh token");
  }
  const refreshed = await refreshAccessToken(tokens.refresh_token);
  const newTokens: GoogleTokens = {
    ...tokens,
    access_token: refreshed.access_token,
    expires_at: refreshed.expires_at,
  };
  return { access_token: newTokens.access_token, tokens: newTokens };
}
