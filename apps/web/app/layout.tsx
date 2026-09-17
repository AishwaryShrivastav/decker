import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://decker.techforgood.studio"),
  title: "Decker: Close the call with the deck already made",
  description: "Record Google Meet without a bot, review the transcript, and generate a closing deck, brief, discussion page, or prototype from your browser.",
  icons: { icon: "/favicon.png", apple: "/favicon.png" },
  openGraph: {
    title: "Decker: Close the call with the deck already made",
    description: "Record Google Meet without a bot, review the transcript, and generate the artifact the room needs next.",
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
