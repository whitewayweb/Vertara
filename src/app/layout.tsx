import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "Vertara",
  description:
    "Reframe your video for social-ready vertical, square, and landscape edits—privately, on your device.",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="font-sans">
      <body>{children}</body>
    </html>
  );
}
