import { createRemoteJWKSet, jwtVerify } from "jose";
import { eq, ilike } from "drizzle-orm";
import { db } from "../../db";
import { users } from "../../db/schema/users";
import type { User } from "../../db/schema/users";

export function normalizeIdentityEmail(raw: string | undefined | null): string | null {
  if (!raw || typeof raw !== "string") return null;
  let cleaned = raw.trim();
  // Strip userstore domain prefix (e.g. "DEFAULT/user@domain.com" or "PRIMARY/user@domain.com" -> "user@domain.com")
  if (cleaned.includes("/")) {
    cleaned = cleaned.split("/").pop()!.trim();
  }
  return cleaned ? cleaned.toLowerCase() : null;
}

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
  const configuredIssuer = process.env.ASGARDEO_ISSUER?.trim();
  const allowedIssuers = configuredIssuer
    ? [
        configuredIssuer,
        configuredIssuer.replace(/\/oauth2\/token$/, ""),
        configuredIssuer.replace(/\/$/, "") + "/oauth2/token",
      ].filter((v, i, a) => a.indexOf(v) === i)
    : undefined;

  const { payload } = await jwtVerify(token, jwks, {
    ...(allowedIssuers ? { issuer: allowedIssuers } : {}),
    clockTolerance: 60,
  });

  const sub = payload.sub;
  if (!sub) {
    throw new AuthError(401, "Invalid token: missing sub claim");
  }

  const rawEmail =
    (payload["email"] as string | undefined) ??
    (payload["username"] as string | undefined) ??
    (payload["preferred_username"] as string | undefined) ??
    (payload["http://wso2.org/claims/emailaddress"] as string | undefined);

  const normalizedEmail = normalizeIdentityEmail(rawEmail);
  const firstName = (payload["given_name"] as string | undefined) ?? "Unknown";
  const lastName = (payload["family_name"] as string | undefined) ?? "User";

  if (!normalizedEmail) {
    throw new AuthError(403, "Token missing required email or username claim");
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

  // 3. If not found by asgardeoUserId, safely reconcile onto existing DB record by normalized email
  if (!user && normalizedEmail) {
    const existingMatches = await db
      .select()
      .from(users)
      .where(ilike(users.email, normalizedEmail))
      .limit(1);

    if (existingMatches.length > 0) {
      const existingUser = existingMatches[0]!;
      // Link the Asgardeo subject to this existing user and preserve their existing DB role
      const [updatedUser] = await db
        .update(users)
        .set({ asgardeoUserId: sub, updatedAt: new Date() })
        .where(eq(users.id, existingUser.id))
        .returning();
      user = updatedUser ?? existingUser;
    }
  }

  // 4. Deterministic role resolution:
  // - First use an explicitly trusted role claim if configured in the token
  // - Otherwise, if user exists in DB, preserve that DB role (super_admin, hiring_manager, etc.)
  // - Do NOT downgrade an existing privileged DB user merely because the token has no role claim
  // - Only default to interviewer for a genuinely new user with no prior record
  let effectiveRole: AppRole;
  if (tokenRole) {
    effectiveRole = tokenRole;
    if (user && user.role !== tokenRole) {
      const [updatedUser] = await db
        .update(users)
        .set({ role: tokenRole, updatedAt: new Date() })
        .where(eq(users.id, user.id))
        .returning();
      if (updatedUser) user = updatedUser;
    }
  } else if (user) {
    effectiveRole = (user.role as AppRole) ?? "interviewer";
  } else {
    effectiveRole = "interviewer";
  }

  // 5. If genuinely new user (not in DB), provision a new record with resolved role
  if (!user) {
    const [insertedUser] = await db
      .insert(users)
      .values({
        asgardeoUserId: sub,
        firstName,
        lastName,
        email: normalizedEmail,
        role: effectiveRole,
      })
      .returning();

    if (!insertedUser) {
      throw new AuthError(500, "Failed to provision user");
    }
    user = insertedUser;
  }

  if (!user.isActive) {
    throw new AuthError(403, "User account is deactivated");
  }

  return { ...user, role: effectiveRole };
}
