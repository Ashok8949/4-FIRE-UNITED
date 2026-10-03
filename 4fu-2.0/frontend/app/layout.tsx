import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "4 FIRE UNITED",
  description: "4FU 2.0 esports platform"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
