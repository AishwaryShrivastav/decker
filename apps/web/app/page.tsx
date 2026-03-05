"use client";

import { useEffect, useState, useRef } from "react";

type Browser = "chromium" | "firefox" | "other";

function detectBrowser(): Browser {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (ua.includes("Firefox")) return "firefox";
  if (ua.includes("Chrome") || ua.includes("Edg") || ua.includes("Brave") || ua.includes("Arc")) return "chromium";
  return "other";
}

const C = {
  blue: "#2496ED",
  blueDim: "#1D63ED",
  navy: "#003F8C",
  bg: "#080c14",
  surface: "#0f1624",
  card: "#141d2e",
  border: "rgba(99, 130, 180, 0.15)",
  text: "#e8eef5",
  muted: "#8a9bb8",
  dim: "#4a5f7f",
};

const FEATURES = [
  { icon: "🎙", title: "One-click recording", desc: "Captures your Google Meet tab audio — no screen-share dialog, no installs." },
  { icon: "🔑", title: "Bring your own AI", desc: "Add your OpenAI API key. Process transcription and extraction locally or via your own key." },
  { icon: "🤖", title: "AI point extraction", desc: "Extracts key topics automatically — you choose what goes in the deck." },
  { icon: "📦", title: "Self-contained output", desc: "Downloads a standalone HTML presentation that runs anywhere, offline." },
  { icon: "🔓", title: "Open source & free", desc: "MIT licensed. Inspect the code, self-host the API, or fork it." },
  { icon: "🛡️", title: "Privacy first", desc: "Your data never leaves your control. No backend storage, end-to-end local processing." },
];

const STEPS = [
  { n: 1, title: "Record", desc: "Click the Decker icon in the toolbar while in a Google Meet to start recording." },
  { n: 2, title: "Review", desc: "AI transcribes audio and extracts discussion points — select what goes in the deck." },
  { n: 3, title: "Download", desc: "Click Generate Deck. A polished HTML presentation downloads in seconds." },
];

const BROWSERS = [
  { name: "Chrome", icon: "🌐", status: "live" },
  { name: "Brave", icon: "🦁", status: "live" },
  { name: "Arc", icon: "◐", status: "live" },
  { name: "Edge", icon: "🔷", status: "live" },
  { name: "Firefox", icon: "🦊", status: "roadmap" },
  { name: "Safari", icon: "🧭", status: "roadmap" },
  { name: "Zen", icon: "◯", status: "roadmap" },
];

const INSTALL_OPTIONS = [
  {
    title: "Install from Chrome Web Store",
    desc: "One-click install for Chrome, Brave, Arc, Edge, and all Chromium-based browsers.",
    cta: "Add to Chrome — it's free",
    href: "https://chrome.google.com/webstore",
    primary: true,
  },
  {
    title: "Download & run locally",
    desc: "Clone the repo, run the web app and extension locally. Perfect for self-hosting or custom builds.",
    cta: "Clone & run locally",
    href: "https://github.com/AishwaryShrivastav/decker#readme",
    primary: false,
  },
  {
    title: "Download release ZIP",
    desc: "Grab a pre-built extension from GitHub releases and load it in developer mode.",
    cta: "Download ZIP",
    href: "https://github.com/AishwaryShrivastav/decker/releases",
    primary: false,
  },
];

function useScrollReveal(threshold = 0.1) {
  const ref = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setRevealed(true);
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, revealed };
}

export default function Home() {
  const [browser, setBrowser] = useState<Browser>("other");

  const heroRef = useScrollReveal(0.2);
  const howRef = useScrollReveal(0.15);
  const featuresRef = useScrollReveal(0.08);
  const privacyRef = useScrollReveal(0.15);
  const browsersRef = useScrollReveal(0.15);
  const installRef = useScrollReveal(0.15);
  const ctaRef = useScrollReveal(0.2);

  useEffect(() => {
    setBrowser(detectBrowser());
  }, []);

  const ctaBtn =
    browser === "chromium" ? (
      <a href="https://chrome.google.com/webstore" target="_blank" rel="noopener noreferrer" className="btn btn-primary animate-fade-in-up animate-delay-4">
        Add to Chrome — it&apos;s free
      </a>
    ) : browser === "firefox" ? (
      <a href="#" className="btn btn-primary" style={{ opacity: 0.6, pointerEvents: "none" }}>
        Firefox — Coming Soon
      </a>
    ) : (
      <a href="https://github.com/AishwaryShrivastav/decker/releases" target="_blank" rel="noopener noreferrer" className="btn btn-secondary animate-fade-in-up animate-delay-4">
        Download ZIP
      </a>
    );

  return (
    <main>
      {/* Nav */}
      <nav className="nav-blur fixed top-0 left-0 right-0 z-50">
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="#" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
            <img src="/logo.png" alt="Decker" width={38} height={38} style={{ objectFit: "contain" }} />
            <span style={{ fontWeight: 800, fontSize: "1.2rem", color: C.blue, letterSpacing: "-0.5px" }}>Decker</span>
          </a>
          <div style={{ display: "flex", gap: 28, fontSize: "0.9rem" }}>
            <a href="#how" className="nav-link" style={{ color: C.muted, textDecoration: "none", transition: "color 0.2s" }}>How it works</a>
            <a href="#features" className="nav-link" style={{ color: C.muted, textDecoration: "none", transition: "color 0.2s" }}>Features</a>
            <a href="#browsers" className="nav-link" style={{ color: C.muted, textDecoration: "none", transition: "color 0.2s" }}>Browsers</a>
            <a href="#install" className="nav-link" style={{ color: C.muted, textDecoration: "none", transition: "color 0.2s" }}>Install</a>
            <a href="https://github.com/AishwaryShrivastav/decker" target="_blank" rel="noopener noreferrer" style={{ color: C.blue, textDecoration: "none", fontWeight: 600 }}>GitHub ↗</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section
        ref={heroRef.ref}
        className="hero-gradient hero-gradient-animated"
        style={{ padding: "120px 24px 100px", minHeight: "85vh", display: "flex", alignItems: "center" }}
      >
        <div className="hero-grid" style={{ maxWidth: 1100, margin: "0 auto", width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
          <div>
            <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(36, 150, 237, 0.12)", borderRadius: 100, padding: "8px 16px", marginBottom: 20, fontSize: "0.85rem", color: C.blue, fontWeight: 600 }}>
                <span>🔓 Open source</span>
                <span style={{ color: C.dim }}>·</span>
                <span>🛡️ Privacy first</span>
                <span style={{ color: C.dim }}>·</span>
                <span>🔑 Bring your AI</span>
              </div>
            </div>
            <h1
              className="animate-fade-in-up animate-delay-1"
              style={{ fontSize: "clamp(2.5rem, 4.5vw, 3.5rem)", fontWeight: 800, margin: "0 0 20px", letterSpacing: "-1.5px", color: C.text, lineHeight: 1.1 }}
            >
              Record a meeting.<br />
              <span style={{ color: C.blue }}>Ship a presentation.</span>
            </h1>
            <p style={{ fontSize: "1.15rem", color: C.muted, maxWidth: 480, margin: "0 0 36px", lineHeight: 1.7 }} className="animate-fade-in-up animate-delay-2">
              Decker records your Google Meet tab, transcribes it with Whisper, extracts discussion points, and downloads a Reveal.js deck — all in one click. Connect the extension and bring your own AI.
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              {ctaBtn}
              <a href="https://github.com/AishwaryShrivastav/decker" target="_blank" rel="noopener noreferrer" className="btn btn-secondary animate-fade-in-up animate-delay-5">
                View on GitHub ↗
              </a>
            </div>
            <p style={{ marginTop: 20, fontSize: "0.8rem", color: C.dim }} className="animate-fade-in-up animate-delay-6">
              MIT licensed · Self-host friendly · No data stored
            </p>
          </div>
          <div
            className="hero-image-wrap animate-float"
            style={{ aspectRatio: "1", maxWidth: 360, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "rgba(255,255,255,0.03)", borderRadius: 24 }}
          >
            <img src="/logo.png" alt="Decker — whale carrying presentation deck" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how"
        ref={howRef.ref}
        className={`reveal-on-scroll ${howRef.revealed ? "revealed" : ""}`}
        style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px" }}
      >
        <h2 style={{ fontSize: "2rem", fontWeight: 800, textAlign: "center", marginBottom: 48, color: C.text, letterSpacing: "-0.5px" }}>How it works</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
          {STEPS.map((s, i) => (
            <div key={s.n} className="card" style={{ transitionDelay: `${i * 0.1}s` }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: `${C.blue}18`,
                  border: `2px solid ${C.blue}`,
                  color: C.blue,
                  fontWeight: 800,
                  fontSize: "1.1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                {s.n}
              </div>
              <div style={{ fontWeight: 700, color: C.text, marginBottom: 8, fontSize: "1.05rem" }}>{s.title}</div>
              <p style={{ fontSize: "0.9rem", color: C.muted, margin: 0, lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        ref={featuresRef.ref}
        className={`reveal-on-scroll ${featuresRef.revealed ? "revealed" : ""}`}
        style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px" }}
      >
        <h2 style={{ fontSize: "2rem", fontWeight: 800, textAlign: "center", marginBottom: 48, color: C.text, letterSpacing: "-0.5px" }}>Why Decker</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
          {FEATURES.map((f) => (
            <div key={f.title} className="card">
              <div style={{ fontSize: "1.8rem", marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, color: C.text, marginBottom: 8, fontSize: "1rem" }}>{f.title}</div>
              <p style={{ fontSize: "0.88rem", color: C.muted, margin: 0, lineHeight: 1.55 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Open Source & Privacy */}
      <section
        ref={privacyRef.ref}
        className={`reveal-on-scroll ${privacyRef.revealed ? "revealed" : ""}`}
        style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px" }}
      >
        <div className="card privacy-grid" style={{ padding: "48px 32px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
          <div>
            <img
              src="/images/privacy.png"
              alt="Privacy first — your data stays yours"
              style={{ width: "100%", maxWidth: 320, borderRadius: 16, boxShadow: "0 20px 50px -20px rgba(0,0,0,0.5)" }}
            />
          </div>
          <div>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: 16, color: C.text }}>Open source. Privacy first.</h2>
            <p style={{ color: C.muted, marginBottom: 20, lineHeight: 1.7 }}>
              Decker is fully open source (MIT) and privacy-first. Use your own OpenAI API key — we don&apos;t store recordings, transcripts, or decks. Everything stays local until you choose to process it. Connect the extension to your workflow and own your data.
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {["No backend data storage", "End-to-end local processing", "Open source — audit the code", "Bring your own API key"].map((item) => (
                <li key={item} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, color: C.text, fontSize: "0.95rem" }}>
                  <span style={{ color: C.blue }}>✓</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Bring your own AI */}
      <section
        className={`reveal-on-scroll ${privacyRef.revealed ? "revealed" : ""}`}
        style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 80px" }}
      >
        <div
          className="card animate-glow"
          style={{
            padding: "40px 48px",
            textAlign: "center",
            border: `1px solid ${C.border}`,
            background: `linear-gradient(135deg, rgba(36, 150, 237, 0.08) 0%, transparent 50%)`,
          }}
        >
          <div style={{ fontSize: "2.5rem", marginBottom: 16 }}>🔑</div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: 12, color: C.text }}>Bring your own AI</h2>
          <p style={{ color: C.muted, maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>
            Decker doesn&apos;t run AI on our servers. Add your OpenAI API key in the extension settings — transcription (Whisper) and point extraction run through your key. You control costs, rate limits, and data flow.
          </p>
        </div>
      </section>

      {/* Browsers & Roadmap */}
      <section
        id="browsers"
        ref={browsersRef.ref}
        className={`reveal-on-scroll ${browsersRef.revealed ? "revealed" : ""}`}
        style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}
      >
        <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: 16, color: C.text, letterSpacing: "-0.5px" }}>Supported browsers</h2>
        <p style={{ color: C.muted, marginBottom: 40, fontSize: "1rem" }}>All Chromium-based browsers supported today. More on the roadmap.</p>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
          {BROWSERS.map((b) => (
            <div
              key={b.name}
              className="roadmap-item"
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 100,
                padding: "10px 20px",
                fontSize: "0.9rem",
                color: b.status === "live" ? C.text : C.dim,
                display: "flex",
                alignItems: "center",
                gap: 8,
                opacity: b.status === "live" ? 1 : 0.7,
              }}
            >
              <span>{b.icon}</span>
              <span>{b.name}</span>
              {b.status === "roadmap" && (
                <span style={{ fontSize: "0.7rem", background: `${C.blue}20`, color: C.blue, borderRadius: 100, padding: "2px 8px" }}>roadmap</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Install options */}
      <section
        id="install"
        ref={installRef.ref}
        className={`reveal-on-scroll ${installRef.revealed ? "revealed" : ""}`}
        style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px" }}
      >
        <h2 style={{ fontSize: "2rem", fontWeight: 800, textAlign: "center", marginBottom: 16, color: C.text, letterSpacing: "-0.5px" }}>Get started</h2>
        <p style={{ color: C.muted, textAlign: "center", marginBottom: 48, fontSize: "1rem" }}>
          Install the extension from the Chrome Web Store, or run everything locally.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
          {INSTALL_OPTIONS.map((opt) => (
            <div key={opt.title} className="card" style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontWeight: 700, color: C.text, marginBottom: 8, fontSize: "1.1rem" }}>{opt.title}</div>
              <p style={{ fontSize: "0.9rem", color: C.muted, margin: "0 0 20px", lineHeight: 1.6, flex: 1 }}>{opt.desc}</p>
              <a
                href={opt.href}
                target="_blank"
                rel="noopener noreferrer"
                className={opt.primary ? "btn btn-primary" : "btn btn-secondary"}
                style={{ alignSelf: "flex-start" }}
              >
                {opt.cta}
              </a>
            </div>
          ))}
        </div>
        <div className="card" style={{ marginTop: 24, padding: "24px 32px" }}>
          <div style={{ fontWeight: 700, color: C.text, marginBottom: 8, fontSize: "1rem" }}>Run locally</div>
          <p style={{ fontSize: "0.9rem", color: C.muted, marginBottom: 16, lineHeight: 1.6 }}>
            Clone the repo, install dependencies, and run the web app and extension locally for full control.
          </p>
          <code style={{ background: "rgba(0,0,0,0.3)", padding: "12px 16px", borderRadius: 8, fontSize: "0.85rem", display: "block", overflowX: "auto", color: C.text }}>
            git clone https://github.com/AishwaryShrivastav/decker.git<br />
            cd decker && pnpm install<br />
            pnpm dev:web &amp;&amp; pnpm dev:extension
          </code>
        </div>
      </section>

      {/* CTA */}
      <section
        ref={ctaRef.ref}
        className={`hero-gradient reveal-on-scroll ${ctaRef.revealed ? "revealed" : ""}`}
        style={{ padding: "80px 24px", textAlign: "center" }}
      >
        <img src="/logo.png" alt="Decker" width={64} height={64} style={{ objectFit: "contain" }} />
        <h2 style={{ fontSize: "2rem", fontWeight: 800, marginTop: 24, marginBottom: 12, color: C.text }}>Ready to ship your first deck?</h2>
        <p style={{ color: C.muted, marginBottom: 32, fontSize: "1rem" }}>Free, open source, and takes 30 seconds to set up.</p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>{ctaBtn}</div>
      </section>

      {/* Footer */}
      <footer style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, color: C.dim, fontSize: "0.85rem", borderTop: `1px solid ${C.border}` }}>
        <span>© {new Date().getFullYear()} Decker — MIT License · Open source</span>
        <div style={{ display: "flex", gap: 24 }}>
          <a href="https://github.com/AishwaryShrivastav/decker" style={{ color: C.blue, textDecoration: "none" }} target="_blank" rel="noopener noreferrer">GitHub ↗</a>
          <a href="https://github.com/AishwaryShrivastav/decker/issues" style={{ color: C.muted, textDecoration: "none" }} target="_blank" rel="noopener noreferrer">Issues</a>
        </div>
      </footer>
    </main>
  );
}