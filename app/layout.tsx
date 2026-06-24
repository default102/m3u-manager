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
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  var activeTheme = theme === 'dark' || theme === 'light' ? theme : systemTheme;
                  document.documentElement.classList.toggle('dark', activeTheme === 'dark');
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
