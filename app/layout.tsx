import type { Metadata } from "next";
import { Bricolage_Grotesque, IBM_Plex_Mono, Instrument_Sans } from "next/font/google";
import "./globals.css";
import Toaster from "@/components/Toaster";
import CommandPalette from "@/components/CommandPalette";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display" });
const body = Instrument_Sans({ subsets: ["latin"], variable: "--font-body" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Daily Log",
  description: "Fast daily task log — capture during meetings, carry over what's left.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-screen">
        {children}
        <CommandPalette />
        <Toaster />
      </body>
    </html>
  );
}
