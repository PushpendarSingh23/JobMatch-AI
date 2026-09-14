import "@/lib/env-config";
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
 * Works across serverless environments (like Vercel). Checks:
 * 1. Asgardeo SDK direct cookie resolution (client.getAccessToken())
 * 2. Statutory Asgardeo session cookie JWT decoding (__asgardeo__session / asgardeo_session)
 * 3. Fallback discovery across any available session cookie containing an OAuth accessToken
 */
export async function getAuthAccessToken(): Promise<string | undefined> {
  // 1. First attempt: Asgardeo SDK instance method
  try {
    const client = await asgardeo();
    const sessionId = (await client.getSessionId().catch(() => undefined)) || "";
    // In our patched server/asgardeo.js, getAccessToken resolves via getAccessTokenAction() (cookie)
    const token = await client.getAccessToken(sessionId);
    if (token && typeof token === "string" && token.trim().length > 0) {
      return token.trim();
    }
  } catch {
    // SDK invocation failed or session verification encountered mismatch
  }

  // 2. Second attempt: Direct statutory session cookie JWT decoding
  try {
    const cookieStore = await cookies();
    // In @asgardeo/nextjs, CookieConfig.SESSION_COOKIE_NAME is "__asgardeo__session"
    const sessionCookie =
      cookieStore.get("__asgardeo__session")?.value ||
      cookieStore.get("asgardeo_session")?.value;

    if (sessionCookie) {
      const payload = parseJwtPayload(sessionCookie);
      const token = payload?.["accessToken"];
      if (typeof token === "string" && token.trim().length > 0) {
        return token.trim();
      }
    }

    // 3. Third attempt: Resilient scan across all cookies
    for (const c of cookieStore.getAll()) {
      if (c.name.includes("asgardeo") || c.name.includes("session")) {
        const payload = parseJwtPayload(c.value);
        const token = payload?.["accessToken"];
        if (typeof token === "string" && token.trim().length > 0) {
          return token.trim();
        }
      }
    }
  } catch {
    // Cookie store read failed
  }

  return undefined;
}
