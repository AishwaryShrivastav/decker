import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Decker: Google Meet notes, decks and prototypes",
  description: "Record Google Meet and generate HTML deliverables. Audio and transcript content go directly to OpenAI using your key. API charges apply.",
  icons: { icon: "/favicon.png", apple: "/favicon.png" },
  openGraph: {
    title: "Decker: Google Meet notes, decks and prototypes",
    description: "Record Google Meet and generate HTML deliverables. Audio and transcript content go directly to OpenAI using your key. API charges apply.",
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
