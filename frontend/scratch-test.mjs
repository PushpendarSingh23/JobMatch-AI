import { asgardeo } from "@asgardeo/nextjs/server";

async function test() {
  process.env.NEXT_PUBLIC_ASGARDEO_BASE_URL = "https://api.asgardeo.io/t/orgsacma";
  process.env.NEXT_PUBLIC_ASGARDEO_CLIENT_ID = "WKFedTcIAdrjVtWCsyYeorGYp6oa";
  process.env.ASGARDEO_CLIENT_ID = "WKFedTcIAdrjVtWCsyYeorGYp6oa";
  process.env.NEXT_PUBLIC_ASGARDEO_SIGN_IN_URL = "https://frontend-nine-omega-72.vercel.app/";

  const client = await asgardeo();
  console.log("Client initialized:", !!client);
  const url = await client.getAuthorizeRequestUrl({}, "test-session");
  console.log("=== Generated Authorize URL ===");
  console.log(url);
  const parsed = new URL(url);
  console.log("-> redirect_uri:", parsed.searchParams.get("redirect_uri"));
}

test().catch(console.error);
