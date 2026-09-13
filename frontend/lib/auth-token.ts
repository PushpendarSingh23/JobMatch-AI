import { asgardeo } from "@asgardeo/nextjs/server";
import { cookies } from "next/headers";

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2 || !parts[1]) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = Buffer.from(base64, "base64").toString("utf-8");
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Robust stateless access token resolver for Next.js App Router (RSC / Server Actions).
 * 
 * In serverless environments (like Vercel), in-memory SDK stores are empty across
 * disparate lambda invocations. This helper first checks Asgardeo's SDK (which our
 * patch equips with cookie resolution), and if unavailable, reads and parses the
 * signed session JWT from the HTTP-only cookie.
 */
export async function getAuthAccessToken(): Promise<string | undefined> {
  // 1. First attempt: Asgardeo SDK instance (equipped with cookie-aware patch)
  try {
    const client = await asgardeo();
    const sessionId = await client.getSessionId();
    if (sessionId) {
      const token = await client.getAccessToken(sessionId);
      if (token && typeof token === "string" && token.trim().length > 0) {
        return token.trim();
      }
    }
  } catch {
    // SDK instance lookup failed or session expired in memory
  }

  // 2. Second attempt: Direct statutory session cookie JWT decoding
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("asgardeo_session")?.value;
    if (sessionCookie) {
      const payload = parseJwtPayload(sessionCookie);
      const token = payload?.["accessToken"];
      if (typeof token === "string" && token.trim().length > 0) {
        return token.trim();
      }
    }
  } catch {
    // Session token unparseable
  }

  return undefined;
}
