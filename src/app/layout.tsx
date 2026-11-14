import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "chirk",
  description: "By invitation only.",
  // Link previews need full addresses; Vercel supplies the live domain (chirk.fyi).
  metadataBase: new URL(process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#ffffff" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh">
        {children}
        {/* One quiet line on every page; the bottom space keeps it clear of the pinned RSVP button. */}
        <footer className="mx-auto max-w-lg px-5 pt-12 pb-28 text-center text-[13px] text-soft">
          chirk* · By invitation only · <Link href="/privacy" className="underline underline-offset-2">Privacy</Link>
        </footer>
      </body>
    </html>
  );
}
