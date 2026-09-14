import type { Metadata } from "next";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { Providers } from "./providers";


export const metadata: Metadata = {
  title: {
    default: "Soundboard — Track, rate and discuss the music you love",
    template: "%s · Soundboard",
  },
  description:
    "A social platform for music discovery: rate albums and tracks, write reviews , log your listening, build lists, and follow  other listeners.",
  openGraph: {
    type: "website",
    siteName: "Soundboard",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Default theme is dark, per the design system. A theme toggle (Settings)
    // swaps this class client-side and persists the choice.
    <html lang="en" className="dark">
      <body className="flex min-h-screen bg-background">
        <Providers>
          <Sidebar />
          <main className="flex-1 pb-16 md:pb-0">{children}</main>
          <MobileNav />
        </Providers>
      </body>
    </html>
  );
}
