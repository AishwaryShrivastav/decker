import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Decker: Convert Google Meet calls into actionable closing decks",
  description: "Decker captures a Google Meet call, helps you review transcript details, and generates a closing deck with actions and owners for the final review.",
  icons: { icon: "/favicon.png", apple: "/favicon.png" },
  openGraph: {
    title: "Decker: Convert Google Meet calls into actionable closing decks",
    description: "Capture a Google Meet conversation and turn it into a closing deck with decisions, scope, and owners.",
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
