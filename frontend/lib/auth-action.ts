"use server";

import "@/lib/env-config";
import { cache } from "react";
import { headers, cookies } from "next/headers";
import { apiFetch } from "./api";
import { getAuthAccessToken } from "./auth-token";

/**
 * Cached auth context — deduplicates the async asgardeo / token / headers
 * calls so that multiple `serverFetch` calls within the same server-render
 * (RSC request or server-action) share a single token lookup.
 */
const getAuthContext = cache(async () => {
  const token = await getAuthAccessToken();

  if (!token) {
    let cookieNames: string[] = [];
    try {
      const cookieStore = await cookies();
      cookieNames = cookieStore.getAll().map((c) => c.name);
    } catch {}
    console.warn("[auth-action:getAuthContext] No access token resolved.", {
      hasToken: false,
      availableCookies: cookieNames,
    });
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
  const { token, forwardedHeaders } = await getAuthContext();

  console.log("[auth-action:serverFetch]", {
    path,
    hasToken: Boolean(token),
    method: options?.method ?? "GET",
  });

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
