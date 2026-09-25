import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AppProvider } from "@/lib/context";
import { AuthSessionProvider } from "@/components/AuthSessionProvider";
import { AppShell } from "@/components/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "ResearchOS — Research Intelligence",
  description: "A serious workspace for scientific research storage and intelligence.",
  icons: {
    icon: "/logo-mark.png",
    apple: "/logo-mark.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('researchos-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark'){document.documentElement.classList.add('dark');}document.documentElement.style.colorScheme=t;}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} antialiased`}
      >
        <AuthSessionProvider>
          <AppProvider>
            <AppShell>{children}</AppShell>
            <Toaster />
          </AppProvider>
        </AuthSessionProvider>
        <Script
          src="https://widget.swiftagents.org/dist/widget-ui.js"
          data-company-id="fa3cef2a-74a4-46cc-b5f9-97db2f377775"
          data-api-key="swa_live_0c8e4e9285c7b030de51508db21d6dc8768c906c38271af189051306c5c6acb5"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
