import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Decker",
  description: "Generate Reveal.js decks from Google Meet recordings",
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
