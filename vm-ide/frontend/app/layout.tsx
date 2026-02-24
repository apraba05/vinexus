import type { Metadata } from "next";
import "./globals.css";
import "@xterm/xterm/css/xterm.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "InfraNexus",
  description: "Browser-based IDE for your Linux VMs — deploy, monitor, and manage infrastructure",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
