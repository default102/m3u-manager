import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "M3U Manager",
  description: "A lightweight, beautiful, and responsive M3U playlist manager.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
