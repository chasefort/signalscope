import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const grotesk = Space_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SignalScope — live brand & market monitoring for GTM teams",
  description:
    "Enter a brand, its competitors, and a monitoring objective. SignalScope pulls live signals from news, Hacker News, and global media, triages them with AI, and writes a cited GTM intelligence report.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${grotesk.variable} ${plexMono.variable} antialiased scanlines min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
