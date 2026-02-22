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
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
