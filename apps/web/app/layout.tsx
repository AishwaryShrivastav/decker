import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://decker.techforgood.studio"),
  title: "Decker: Close the call with the deck already made",
  description: "Record a browser meeting without a bot, review the transcript, and create an HTML deck, brief, discussion page, or prototype with your OpenAI or Gemini key.",
  alternates: { canonical: "/" },
  icons: { icon: "/favicon.png", apple: "/favicon.png" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Decker: Close the call with the deck already made",
    description: "Record a browser meeting, review the transcript, and create the artifact the room needs next with your OpenAI or Gemini key.",
    url: "/",
    siteName: "Decker",
    type: "website",
    images: [{ url: "/logo.png", width: 512, height: 512 }],
  },
  twitter: {
    card: "summary",
    title: "Decker: Close the call with the deck already made",
    description: "Record a browser meeting, review the transcript, and create an HTML artifact with your OpenAI or Gemini key.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const softwareApplication = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Decker",
    url: "https://decker.techforgood.studio/",
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Meeting notes and document generation",
    operatingSystem: "Chromium browsers",
    description: "A Chrome extension that records eligible browser meeting tabs, lets users review the transcript, and creates HTML meeting documents with a user-supplied OpenAI or Gemini API key.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    softwareHelp: "https://decker.techforgood.studio/support",
    featureList: [
      "User-initiated browser tab audio recording",
      "Optional microphone capture",
      "OpenAI or Gemini bring-your-own-key processing",
      "Editable transcript review",
      "HTML documents, presentations, discussion pages, and prototypes",
      "Local recovery session",
    ],
  };
  return (
    <html lang="en">
      <body>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplication) }} />
      </body>
    </html>
  );
}
