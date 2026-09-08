if (typeof process !== "undefined" && process.env) {
  if (!process.env.NEXT_PUBLIC_ASGARDEO_BASE_URL) {
    process.env.NEXT_PUBLIC_ASGARDEO_BASE_URL = "https://api.asgardeo.io/t/orgsacma";
  }
  if (!process.env.NEXT_PUBLIC_ASGARDEO_CLIENT_ID) {
    process.env.NEXT_PUBLIC_ASGARDEO_CLIENT_ID = "WKFedTcIAdrjVtWCsyYeorGYp6oa";
  }
  if (!process.env.ASGARDEO_CLIENT_ID) {
    process.env.ASGARDEO_CLIENT_ID = "WKFedTcIAdrjVtWCsyYeorGYp6oa";
  }
  if (!process.env.ASGARDEO_CLIENT_SECRET) {
    process.env.ASGARDEO_CLIENT_SECRET = "dummy_asgardeo_client_secret";
  }
  if (!process.env.ASGARDEO_SECRET) {
    process.env.ASGARDEO_SECRET = "dummy_asgardeo_secret_32_chars_long_key_string!!";
  }
  if (!process.env.NEXT_PUBLIC_ASGARDEO_SIGN_IN_URL) {
    process.env.NEXT_PUBLIC_ASGARDEO_SIGN_IN_URL = "https://frontend-nine-omega-72.vercel.app/login";
  }
  if (!process.env.NEXT_PUBLIC_ASGARDEO_AFTER_SIGN_IN_URL) {
    process.env.NEXT_PUBLIC_ASGARDEO_AFTER_SIGN_IN_URL = "https://frontend-nine-omega-72.vercel.app/";
  }
  if (!process.env.NEXT_PUBLIC_ASGARDEO_AFTER_SIGN_OUT_URL) {
    process.env.NEXT_PUBLIC_ASGARDEO_AFTER_SIGN_OUT_URL = "https://frontend-nine-omega-72.vercel.app/login";
  }
  if (!process.env.NEXT_PUBLIC_ASGARDEO_ENABLE_PKCE) {
    process.env.NEXT_PUBLIC_ASGARDEO_ENABLE_PKCE = "true";
  }
}

