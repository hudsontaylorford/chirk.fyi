import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "chirk", description: "Invites from the Fords." };
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#ffffff" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
