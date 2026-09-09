import "@/lib/env-config";
import {
  asgardeoMiddleware,
  createRouteMatcher,
} from "@asgardeo/nextjs/middleware";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/login",
  "/careers",
  "/careers/*",
  "/assessment/*",
  "/interview/*",
  "/offer/*",
  "/api/public/*",
]);

export default asgardeoMiddleware(
  async (asgardeo, request) => {
    const hasCallbackParams =
      request.nextUrl.searchParams.has("code") &&
      request.nextUrl.searchParams.has("state");

    if (request.nextUrl.pathname === "/login" && asgardeo.isSignedIn()) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Allow OAuth callback requests (containing code and state) to reach page component for code exchange
    if (hasCallbackParams) {
      return;
    }

    if (!isPublicRoute(request)) {
      const protectionResult = await asgardeo.protectRoute();

      if (protectionResult) {
        return protectionResult;
      }
    }
  },
  { signInUrl: "/login" },
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
