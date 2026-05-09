import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "EcoHome Studio",
  description:
    "AI-powered sustainable home design assistant for climate-smart concepts, floor plans, and affordability-aware recommendations."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
