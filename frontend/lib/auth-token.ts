import "@/lib/env-config";
import { asgardeo } from "@asgardeo/nextjs/server";
import { cookies } from "next/headers";

export interface AuthDiagnostics {
  hasSessionCookie: boolean;
  hasSessionId: boolean;
  hasAccessToken: boolean;
}

/**
 * Checks safe session diagnostics without exposing any secret, cookie, or token values.
 */
export async function getAuthDiagnostics(): Promise<AuthDiagnostics> {
  let hasSessionCookie = false;
  let hasSessionId = false;
  let hasAccessToken = false;

  try {
    const cookieStore = await cookies();
    hasSessionCookie = Boolean(cookieStore.get("__asgardeo__session")?.value);
  } catch {
    // Cookie store read error
  }

  try {
    const client = await asgardeo();
    const sessionId = (await client.getSessionId().catch(() => undefined)) || "";
    hasSessionId = Boolean(sessionId);

    const token = await client.getAccessToken(sessionId);
    hasAccessToken = Boolean(token && typeof token === "string" && token.trim().length > 0);
  } catch {
    // SDK session resolution error
  }

  return {
    hasSessionCookie,
    hasSessionId,
    hasAccessToken,
  };
}

/**
 * Official Asgardeo SDK access token resolver for Next.js App Router (RSC / Server Actions).
 * Resolves the authenticated access token verified by ASGARDEO_SECRET.
 */
export async function getAuthAccessToken(): Promise<string | undefined> {
  try {
    const client = await asgardeo();
    const sessionId = (await client.getSessionId().catch(() => undefined)) || "";
    const token = await client.getAccessToken(sessionId);

    if (token && typeof token === "string" && token.trim().length > 0) {
      return token.trim();
    }
  } catch {
    // Session token verification failed or session expired
  }

  return undefined;
}

