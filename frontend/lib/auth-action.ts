"use server";

import "@/lib/env-config";
import { cache } from "react";
import { headers } from "next/headers";
import { apiFetch } from "./api";
import { getAuthAccessToken, getAuthDiagnostics } from "./auth-token";

/**
 * Cached auth context — deduplicates the async asgardeo / token / headers
 * calls so that multiple `serverFetch` calls within the same server-render
 * (RSC request or server-action) share a single token lookup.
 */
const getAuthContext = cache(async (path: string) => {
  const diag = await getAuthDiagnostics();

  console.log("[auth-action:safe-diag]", {
    hasSessionCookie: diag.hasSessionCookie,
    hasSessionId: diag.hasSessionId,
    hasAccessToken: diag.hasAccessToken,
    path,
  });

  const token = await getAuthAccessToken();

  if (!token) {
    throw new Error("Not authenticated");
  }

  const incomingHeaders = await headers();
  const forwardedHeaders: Record<string, string> = {};

  const copyHeader = (name: string) => {
    const value = incomingHeaders.get(name);
    if (value) forwardedHeaders[name] = value;
  };

  copyHeader("user-agent");
  copyHeader("x-forwarded-for");
  copyHeader("x-real-ip");
  copyHeader("cf-connecting-ip");
  copyHeader("x-forwarded-proto");
  copyHeader("x-forwarded-host");

  return { token, forwardedHeaders };
});

export async function serverFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const { token, forwardedHeaders } = await getAuthContext(path);

  try {
    return await apiFetch<T>(path, token, {
      ...options,
      headers: {
        ...forwardedHeaders,
        ...(options?.headers ?? {}),
      },
    });
  } catch (err: unknown) {
    console.error("[auth-action:serverFetch] Upstream API call failed:", {
      path,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}
