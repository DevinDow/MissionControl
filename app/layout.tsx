import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenClaw Mission Control",
  description: "Personal Command Center",
  manifest: "/manifest.json",
  icons: {
    icon: '/avatars/darvis_head_192.png',
    apple: '/avatars/darvis_head_192.png',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}
