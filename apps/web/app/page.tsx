"use client";

import { useEffect, useState } from "react";

type Browser = "chromium" | "firefox" | "other";

function detectBrowser(): Browser {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (ua.includes("Firefox")) return "firefox";
  if (ua.includes("Chrome") || ua.includes("Edg") || ua.includes("Brave")) return "chromium";
  return "other";
}

const S: Record<string, React.CSSProperties> = {
  body: {
    margin: 0,
    background: "#0f0f1a",
    color: "#e0e0e0",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    lineHeight: 1.6,
  },
  hero: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "60px 20px",
    background: "radial-gradient(ellipse at 50% 0%, #1e0a3c 0%, #0f0f1a 70%)",
  },
  logoText: {
    fontSize: "4rem",
    fontWeight: 800,
    color: "#7c3aed",
    letterSpacing: "-2px",
    margin: 0,
  },
  tagline: {
    fontSize: "1.4rem",
    color: "#d1d5db",
    maxWidth: 540,
    margin: "16px auto 40px",
  },
  ctaRow: {
    display: "flex",
    gap: 12,
    justifyContent: "center",
    flexWrap: "wrap" as const,
  },
  btnPrimary: {
    background: "#7c3aed",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "14px 28px",
    fontSize: "1rem",
    fontWeight: 700,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-block",
    transition: "background 0.15s",
  },
  btnSecondary: {
    background: "transparent",
    color: "#9ca3af",
    border: "1px solid #374151",
    borderRadius: 12,
    padding: "14px 28px",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-block",
  },
  btnDisabled: {
    opacity: 0.45,
    cursor: "not-allowed",
    pointerEvents: "none" as const,
  },
  section: {
    maxWidth: 960,
    margin: "0 auto",
    padding: "80px 24px",
  },
  sectionTitle: {
    fontSize: "2rem",
    fontWeight: 700,
    textAlign: "center" as const,
    marginBottom: 48,
    color: "#f3f4f6",
  },
  stepsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 32,
  },
  stepCard: {
    background: "#161625",
    border: "1px solid #1f2037",
    borderRadius: 16,
    padding: "28px 24px",
    textAlign: "center" as const,
  },
  stepNum: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    background: "#7c3aed22",
    border: "2px solid #7c3aed",
    color: "#7c3aed",
    fontWeight: 800,
    fontSize: "1.1rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
  },
  stepTitle: {
    fontWeight: 700,
    fontSize: "1.05rem",
    color: "#f3f4f6",
    marginBottom: 8,
  },
  stepDesc: {
    fontSize: "0.9rem",
    color: "#6b7280",
    lineHeight: 1.5,
  },
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 20,
  },
  featureCard: {
    background: "#161625",
    border: "1px solid #1f2037",
    borderRadius: 14,
    padding: "22px 20px",
  },
  featureIcon: {
    fontSize: "1.6rem",
    marginBottom: 10,
  },
  featureTitle: {
    fontWeight: 700,
    color: "#f3f4f6",
    marginBottom: 6,
    fontSize: "0.95rem",
  },
  featureDesc: {
    fontSize: "0.85rem",
    color: "#6b7280",
    lineHeight: 1.5,
  },
  browsersRow: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap" as const,
    justifyContent: "center",
  },
  browserPill: {
    background: "#161625",
    border: "1px solid #1f2037",
    borderRadius: 100,
    padding: "10px 20px",
    fontSize: "0.9rem",
    color: "#d1d5db",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  comingSoon: {
    fontSize: "0.7rem",
    background: "#374151",
    color: "#9ca3af",
    borderRadius: 100,
    padding: "2px 8px",
    marginLeft: 4,
  },
  divider: {
    border: "none",
    borderTop: "1px solid #1f2037",
    margin: "0 24px",
  },
  footer: {
    maxWidth: 960,
    margin: "0 auto",
    padding: "32px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap" as const,
    gap: 12,
    color: "#6b7280",
    fontSize: "0.85rem",
  },
  footerLink: {
    color: "#7c3aed",
    textDecoration: "none",
  },
};

const FEATURES = [
  { icon: "🎙", title: "One-click recording", desc: "Records your Google Meet tab audio with a single button press — no screen share needed." },
  { icon: "🔑", title: "Your API key, your data", desc: "Bring your own OpenAI or Anthropic key. Audio never touches our servers." },
  { icon: "🤖", title: "AI discussion points", desc: "Extracts key topics from the transcript — you pick what goes in the deck." },
  { icon: "🎨", title: "Reveal.js output", desc: "Downloads a self-contained HTML presentation that runs anywhere, offline." },
  { icon: "🔓", title: "Open source & free", desc: "MIT licensed. Inspect the code, self-host the API, or fork it." },
  { icon: "⚡", title: "Custom instructions", desc: "Add your own prompt to steer the AI — focus on action items, use formal tone, etc." },
];

const STEPS = [
  { n: 1, title: "Record", desc: "Join a Google Meet and click Start Recording in the Decker panel." },
  { n: 2, title: "Review", desc: "AI transcribes the audio and extracts discussion points — select the ones you want." },
  { n: 3, title: "Download", desc: "Click Generate Deck and get a polished Reveal.js HTML file in seconds." },
];

const BROWSERS = [
  { name: "Chrome", icon: "🌐", available: true },
  { name: "Brave", icon: "🦁", available: true },
  { name: "Arc", icon: "◐", available: true },
  { name: "Edge", icon: "🔷", available: true },
  { name: "Firefox", icon: "🦊", available: false },
  { name: "Zen", icon: "◯", available: false },
];

export default function Home() {
  const [browser, setBrowser] = useState<Browser>("other");

  useEffect(() => {
    setBrowser(detectBrowser());
  }, []);

  const ctaButton =
    browser === "chromium" ? (
      <a
        href="https://chrome.google.com/webstore"
        style={S.btnPrimary}
        target="_blank"
        rel="noopener noreferrer"
      >
        Add to Chrome — it&apos;s free
      </a>
    ) : browser === "firefox" ? (
      <a
        href="https://addons.mozilla.org"
        style={{ ...S.btnPrimary, ...S.btnDisabled }}
        aria-disabled
      >
        Firefox — Coming Soon
      </a>
    ) : (
      <a
        href="https://github.com/your-username/decker/releases"
        style={S.btnSecondary}
        target="_blank"
        rel="noopener noreferrer"
      >
        Download ZIP
      </a>
    );

  return (
    <main style={S.body}>
      {/* Hero */}
      <section style={S.hero}>
        <h1 style={S.logoText}>Decker</h1>
        <p style={S.tagline}>
          Record any meeting. Let AI summarise it. Download a presentation in one click.
        </p>
        <div style={S.ctaRow}>
          {ctaButton}
          <a
            href="https://github.com/your-username/decker"
            style={S.btnSecondary}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on GitHub ↗
          </a>
        </div>
      </section>

      <hr style={S.divider} />

      {/* How it works */}
      <section style={S.section}>
        <h2 style={S.sectionTitle}>How it works</h2>
        <div style={S.stepsRow}>
          {STEPS.map((s) => (
            <div key={s.n} style={S.stepCard}>
              <div style={S.stepNum}>{s.n}</div>
              <div style={S.stepTitle}>{s.title}</div>
              <p style={S.stepDesc}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <hr style={S.divider} />

      {/* Features */}
      <section style={S.section}>
        <h2 style={S.sectionTitle}>Why Decker</h2>
        <div style={S.featuresGrid}>
          {FEATURES.map((f) => (
            <div key={f.title} style={S.featureCard}>
              <div style={S.featureIcon}>{f.icon}</div>
              <div style={S.featureTitle}>{f.title}</div>
              <p style={S.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <hr style={S.divider} />

      {/* Supported browsers */}
      <section style={{ ...S.section, textAlign: "center" }}>
        <h2 style={S.sectionTitle}>Supported browsers</h2>
        <div style={S.browsersRow}>
          {BROWSERS.map((b) => (
            <div key={b.name} style={{ ...S.browserPill, opacity: b.available ? 1 : 0.5 }}>
              <span>{b.icon}</span>
              <span>{b.name}</span>
              {!b.available && <span style={S.comingSoon}>soon</span>}
            </div>
          ))}
        </div>
        <p style={{ color: "#4b5563", fontSize: "0.85rem", marginTop: 20 }}>
          All Chromium-based browsers (Chrome, Brave, Arc, Edge) are supported today.
        </p>
      </section>

      <hr style={S.divider} />

      {/* Install CTA */}
      <section style={{ ...S.section, textAlign: "center", paddingTop: 60, paddingBottom: 60 }}>
        <h2 style={{ ...S.sectionTitle, marginBottom: 20 }}>Ready to try it?</h2>
        <p style={{ color: "#6b7280", marginBottom: 32 }}>
          Free, open source, and takes 30 seconds to install.
        </p>
        <div style={S.ctaRow}>{ctaButton}</div>
      </section>

      <hr style={S.divider} />

      {/* Footer */}
      <footer style={S.footer}>
        <span>© {new Date().getFullYear()} Decker — MIT License</span>
        <span>
          <a
            href="https://github.com/your-username/decker"
            style={S.footerLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub ↗
          </a>
        </span>
      </footer>
    </main>
  );
}
