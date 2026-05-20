import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "+Vantage — Market Intelligence",
    template: "%s · +Vantage",
  },
  description:
    "DOMAIN — Directional Outlook & Macro Alpha Intelligence. A market radar powered by AI and professionals. Built for operators, not beginners.",
  keywords: [
    "trading",
    "market intelligence",
    "alpha",
    "domain",
    "addvantage",
    "macro",
  ],
  openGraph: {
    title: "+Vantage — Market Intelligence",
    description:
      "Alpha Intelligence for global markets. No community. No chat. Operator eyes only.",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#111111",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="grain min-h-screen bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}
