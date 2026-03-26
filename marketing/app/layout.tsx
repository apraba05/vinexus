import type { Metadata } from "next";
import "./globals.css";
import { MarketingLayout } from "./marketing-layout";

export const metadata: Metadata = {
  title: { default: "Vinexus", template: "%s | Vinexus" },
  description: "A native desktop IDE that connects directly to your virtual machines via SSH. Full Monaco editor, integrated terminal, and AI pair programming.",
  metadataBase: new URL("https://vinexus.space"),
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    siteName: "Vinexus",
    type: "website",
    images: [{ url: "/favicon.png" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <MarketingLayout>{children}</MarketingLayout>
      </body>
    </html>
  );
}
