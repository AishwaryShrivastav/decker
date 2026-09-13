import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Decker: Record Google Meet with no bot, deck before the call ends",
  description: "Record Google Meet without a bot. Get a slide deck, prototype, or meeting brief before the call ends. Your own API keys, nothing leaves your browser.",
  icons: { icon: "/favicon.png", apple: "/favicon.png" },
  openGraph: {
    title: "Decker: Record Google Meet with no bot, deck before the call ends",
    description: "Record Google Meet without a bot. Get a slide deck, prototype, or meeting brief before the call ends. Your own API keys, nothing leaves your browser.",
    images: [{ url: "/logo.png", width: 512, height: 512 }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
