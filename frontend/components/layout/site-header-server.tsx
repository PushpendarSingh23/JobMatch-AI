import { getAuthAccessToken } from "@/lib/auth-token";
import { SiteHeader } from "./site-header";

export async function SiteHeaderServer() {
  const accessToken = await getAuthAccessToken();
  return <SiteHeader accessToken={accessToken} />;
}
