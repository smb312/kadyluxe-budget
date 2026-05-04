import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KADYLUXE × COAST · Marketing Budget",
  description: "2026 marketing budget modeling tool for KADYLUXE.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-cream text-ink">{children}</body>
    </html>
  );
}
