import "@/lib/env-config";
import type { Metadata } from "next";
import { Changa_One, Geist, Geist_Mono, Public_Sans } from "next/font/google";
import { AsgardeoProvider } from "@asgardeo/nextjs/server";
import "./globals.css";

const publicSans = Public_Sans({ subsets: ["latin"], variable: "--font-sans" });
const changaOne = Changa_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-changa-one",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JobMatch AI",
  description: "Open Source Applicant Tracking System",
};

export const dynamic = "force-dynamic";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { ThemeInitializer } from "@/components/theme/theme-initializer";

import { headers } from "next/headers";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}/`;

  return (
    <html
      lang="en"
      className={`${publicSans.variable} ${changaOne.variable}`}
      suppressHydrationWarning
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ThemeInitializer />
          <AsgardeoProvider
            baseUrl={process.env.NEXT_PUBLIC_ASGARDEO_BASE_URL || "https://api.asgardeo.io/t/orgsacma"}
            clientId={process.env.NEXT_PUBLIC_ASGARDEO_CLIENT_ID || "WKFedTcIAdrjVtWCsyYeorGYp6oa"}
            organizationHandle="orgsacma"
            afterSignInUrl={origin}
            afterSignOutUrl={`${origin}login`}
          >
            {children}
          </AsgardeoProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

