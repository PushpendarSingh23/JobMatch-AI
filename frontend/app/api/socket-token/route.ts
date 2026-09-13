import { NextResponse } from "next/server";
import { getAuthAccessToken } from "@/lib/auth-token";

export const dynamic = "force-dynamic";

// Gives the browser a current access token for the socket handshake.
export async function GET() {
  try {
    const token = await getAuthAccessToken();
    if (!token) {
      return NextResponse.json({ token: null }, { status: 401 });
    }

    return NextResponse.json(
      { token },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ token: null }, { status: 401 });
  }
}
