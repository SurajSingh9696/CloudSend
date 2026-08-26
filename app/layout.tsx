import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "CloudSend — Private Document Transfer Register",
  description:
    "Seal a file or text note behind a unique 6-digit ledger code. No accounts, no inboxes — just ephemeral, direct, private file sharing.",
  keywords: ["file sharing", "private", "ephemeral", "code", "document transfer"],
  openGraph: {
    title: "CloudSend — Private Transfer Register",
    description: "Share files privately with a 6-digit code. No accounts required.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${ibmPlexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
