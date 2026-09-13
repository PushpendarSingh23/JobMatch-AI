import { NextResponse } from "next/server";
import { asgardeo } from "@asgardeo/nextjs/server";

const API_BASE_URL =
  process.env.JOBMATCH_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://jobmatch-ai-nljp.onrender.com";

async function getAccessToken() {
  const client = await asgardeo();
  const sessionId = await client.getSessionId();
  if (!sessionId) throw new Error("Unauthorized");
  return client.getAccessToken(sessionId);
}

export async function POST(req: Request) {
  try {
    const token = await getAccessToken();
    const formData = await req.formData();

    const res = await fetch(`${API_BASE_URL}/api/upload/logo`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const json = await res.json().catch(() => ({ error: "Request failed" }));
    return NextResponse.json(json, { status: res.status });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
