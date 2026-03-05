import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Decker — Meeting to Presentation in One Click",
  description: "Record Google Meet calls, transcribe with Whisper, extract key points, and download a polished Reveal.js deck. Open source, privacy-first, bring your own AI.",
  icons: { icon: "/favicon.png", apple: "/favicon.png" },
  openGraph: {
    title: "Decker — Meeting to Presentation in One Click",
    description: "Open source, privacy-first. Record meetings, bring your own AI, ship presentations.",
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
