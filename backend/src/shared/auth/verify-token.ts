import { createRemoteJWKSet, jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { users } from "../../db/schema/users";
import type { User } from "../../db/schema/users";

/**
 * Shared Asgardeo access-token verification, used by both the HTTP auth
 * middleware and the Socket.IO handshake. Keeping one implementation means
 * the two transports can never drift apart on who counts as authenticated.
 */

let jwksInstance: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJWKS() {
  if (!jwksInstance) {
    const urlStr =
      process.env.ASGARDEO_JWKS_URL && process.env.ASGARDEO_JWKS_URL.trim()
        ? process.env.ASGARDEO_JWKS_URL.trim()
        : "https://localhost/oauth2/jwks";
    jwksInstance = createRemoteJWKSet(new URL(urlStr));
  }
  return jwksInstance;
}

export type AppRole = "super_admin" | "hiring_manager" | "interviewer";

export type AuthenticatedUser = User & { role: AppRole };

/** An authentication failure with the HTTP status it maps to. */
export class AuthError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export function collectRolesFromPayload(
  payload: Record<string, unknown>,
): string[] {
  const out: string[] = [];

  const rolesClaim = payload["roles"];
  if (Array.isArray(rolesClaim)) {
    for (const x of rolesClaim) {
      if (typeof x === "string" && x.trim()) out.push(x.trim());
    }
  } else if (typeof rolesClaim === "string" && rolesClaim.trim()) {
    out.push(rolesClaim.trim());
  }

  const wso2 = payload["http://wso2.org/claims/role"];
  if (Array.isArray(wso2)) {
    for (const x of wso2) {
      if (typeof x === "string" && x.trim()) out.push(x.trim());
    }
  } else if (typeof wso2 === "string" && wso2.trim()) {
    for (const part of wso2.split(",")) {
      const s = part.trim();
      if (s) out.push(s);
    }
  }

  return out;
}

export function mapToAppRole(names: string[]): AppRole | null {
  const normalized = names.map((s) =>
    s.trim().toLowerCase().replace(/_/g, " ").replace(/\s+/g, " "),
  );
  const has = (pred: (n: string) => boolean) => normalized.some(pred);

  // Exact name or group path only. A substring match would grant full
  // privileges to any role merely containing the words, e.g.
  // "super_admin_readonly" or "ex super admin".
  if (has((n) => n === "super admin" || n.endsWith("/super admin")))
    return "super_admin";
  if (has((n) => n === "hiring manager" || n.endsWith("/hiring manager")))
    return "hiring_manager";
  if (has((n) => n === "interviewer" || n.endsWith("/interviewer")))
    return "interviewer";

  return null;
}

/**
 * Verifies an Asgardeo JWT and resolves it to a local user.
 *
 * Throws `AuthError` for anything the caller should reject (bad claims, no
 * role, deactivated account) and lets `jose` errors and database errors
 * propagate unchanged so callers can tell a bad token from a broken server.
 */
export async function verifyAccessToken(
  token: string,
): Promise<AuthenticatedUser> {
  const jwks = getJWKS();
  const verifyOptions = process.env.ASGARDEO_ISSUER
    ? { issuer: process.env.ASGARDEO_ISSUER }
    : undefined;
  const { payload } = await jwtVerify(token, jwks, verifyOptions);

  const sub = payload.sub;
  if (!sub) {
    throw new AuthError(401, "Invalid token: missing sub claim");
  }

  const email = payload["email"] as string | undefined;
  const firstName = (payload["given_name"] as string | undefined) ?? "Unknown";
  const lastName = (payload["family_name"] as string | undefined) ?? "User";

  if (!email) {
    throw new AuthError(403, "Token missing required email claim");
  }

  // 1. Check if token contains explicit role claims from Asgardeo IdP
  const tokenRole = mapToAppRole(
    collectRolesFromPayload(payload as Record<string, unknown>),
  );

  // 2. Find user in database by stable Asgardeo user ID
  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.asgardeoUserId, sub))
    .limit(1);

  // 3. If not found by asgardeoUserId, safely reconcile onto existing pre-seeded record by email
  if (!user) {
    [user] = await db
      .update(users)
      .set({ asgardeoUserId: sub, updatedAt: new Date() })
      .where(eq(users.email, email))
      .returning();
  }

  // 4. If genuinely new user (not in DB), provision a new record
  if (!user) {
    const initialRole = tokenRole ?? "interviewer";
    [user] = await db
      .insert(users)
      .values({
        asgardeoUserId: sub,
        firstName,
        lastName,
        email,
        role: initialRole,
      })
      .returning();

    if (!user) {
      throw new AuthError(500, "Failed to provision user");
    }
  }

  if (!user.isActive) {
    throw new AuthError(403, "User account is deactivated");
  }

  // 5. If Asgardeo token explicitly provided a role, synchronize it to DB if changed
  if (tokenRole && user.role !== tokenRole) {
    const [updatedUser] = await db
      .update(users)
      .set({ role: tokenRole, updatedAt: new Date() })
      .where(eq(users.id, user.id))
      .returning();
    if (updatedUser) user = updatedUser;
  }

  // 6. Enforce database role for authorization
  const effectiveRole = (user.role || tokenRole) as AppRole;
  if (!effectiveRole) {
    throw new AuthError(403, "No role assigned in database or token. Contact your administrator.");
  }

  return { ...user, role: effectiveRole };
}
