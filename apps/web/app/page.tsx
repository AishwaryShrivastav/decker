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
  bg: "#080c14",
  surface: "#0f1624",
  card: "#141d2e",
  border: "rgba(99, 130, 180, 0.15)",
  text: "#e8eef5",
  muted: "#8a9bb8",
  dim: "#4a5f7f",
  gold: "#f5a623",
};

const FEATURES = [
  { icon: "🎙", title: "One-click recording", desc: "Captures your Google Meet tab audio — no screen-share dialog, no extra installs, zero friction." },
  { icon: "⚡", title: "Live transcription", desc: "Whisper processes your audio every 16 seconds as you speak. Watch the transcript build in real time." },
  { icon: "🤖", title: "AI extracts the points", desc: "GPT-4o reads the transcript and surfaces the 5–12 most important discussion points. You pick the ones that matter." },
  { icon: "📊", title: "Presentations AND notes", desc: "Generate a Reveal.js slide deck or a scrollable HTML notes document — your call, literally." },
  { icon: "📈", title: "Charts & diagrams", desc: "Chart.js and Mermaid diagrams generated automatically where your data calls for them." },
  { icon: "🛡️", title: "Your key. Your data. Always.", desc: "Calls go from your browser directly to OpenAI. No backend. No storage. No middleman. Audit the code yourself." },
];

const STEPS = [
  {
    n: 1,
    title: "Record",
    desc: "Click the Decker icon in your Chrome toolbar while you're in a Google Meet. One click starts the recording. That's it.",
  },
  {
    n: 2,
    title: "Review",
    desc: "When you stop, AI transcribes everything and extracts the key discussion points. Edit, select, add custom instructions.",
  },
  {
    n: 3,
    title: "Ship",
    desc: "Hit Generate. A polished HTML presentation downloads in seconds. Drop it in the chat before anyone leaves the call.",
  },
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

function useScrollReveal(threshold = 0.1) {
  const ref = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setRevealed(true); },
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
  const storyRef = useScrollReveal(0.1);
  const howRef = useScrollReveal(0.1);
  const featuresRef = useScrollReveal(0.08);
  const pricingRef = useScrollReveal(0.1);
  const browsersRef = useScrollReveal(0.1);
  const ctaRef = useScrollReveal(0.15);

  useEffect(() => { setBrowser(detectBrowser()); }, []);

  const primaryCTA =
    browser === "chromium" ? (
      <a href="https://chrome.google.com/webstore" target="_blank" rel="noopener noreferrer" className="btn btn-primary">
        Get Chrome Plugin — $1
      </a>
    ) : browser === "firefox" ? (
      <span className="btn btn-primary" style={{ opacity: 0.5, cursor: "not-allowed" }}>
        Firefox — Coming Soon
      </span>
    ) : (
      <a href="https://chrome.google.com/webstore" target="_blank" rel="noopener noreferrer" className="btn btn-primary">
        Get Chrome Plugin — $1
      </a>
    );

  return (
    <main>
      {/* Nav */}
      <nav className="nav-blur" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="#" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <img src="/logo.png" alt="Decker" width={36} height={36} style={{ objectFit: "contain" }} />
            <span style={{ fontWeight: 800, fontSize: "1.2rem", color: C.blue, letterSpacing: "-0.5px" }}>Decker</span>
          </a>
          <div style={{ display: "flex", gap: 28, alignItems: "center", fontSize: "0.9rem" }}>
            <a href="#story" className="nav-link" style={{ color: C.muted, textDecoration: "none" }}>Story</a>
            <a href="#how" className="nav-link" style={{ color: C.muted, textDecoration: "none" }}>How it works</a>
            <a href="#pricing" className="nav-link" style={{ color: C.muted, textDecoration: "none" }}>Pricing</a>
            <a href="https://github.com/AishwaryShrivastav/decker" target="_blank" rel="noopener noreferrer" style={{ color: C.muted, textDecoration: "none" }}>GitHub</a>
            {browser === "chromium" ? (
              <a href="https://chrome.google.com/webstore" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: "8px 18px", fontSize: "0.85rem" }}>
                Get Plugin — $1
              </a>
            ) : (
              <a href="https://github.com/AishwaryShrivastav/decker" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: "8px 18px", fontSize: "0.85rem" }}>
                View on GitHub
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section
        ref={heroRef.ref}
        className="hero-gradient hero-gradient-animated"
        style={{ padding: "130px 24px 110px", minHeight: "90vh", display: "flex", alignItems: "center" }}
      >
        <div style={{ maxWidth: 780, margin: "0 auto", width: "100%", textAlign: "center" }}>
          <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              background: "rgba(36, 150, 237, 0.1)", border: "1px solid rgba(36, 150, 237, 0.2)",
              borderRadius: 100, padding: "8px 18px", marginBottom: 28,
              fontSize: "0.82rem", color: C.blue, fontWeight: 600, letterSpacing: "0.02em"
            }}>
              <span>🔓 Open Source</span>
              <span style={{ color: C.dim }}>·</span>
              <span>💳 $1 Chrome Plugin</span>
              <span style={{ color: C.dim }}>·</span>
              <span>🚫 No Subscription</span>
            </div>
          </div>

          <h1
            className="animate-fade-in-up animate-delay-1"
            style={{
              fontSize: "clamp(2.8rem, 6vw, 4.5rem)", fontWeight: 800,
              margin: "0 0 24px", letterSpacing: "-2px", color: C.text, lineHeight: 1.08
            }}
          >
            End every meeting<br />
            <span style={{
              background: `linear-gradient(135deg, ${C.blue} 0%, #7ab8f5 100%)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
            }}>with an aha moment.</span>
          </h1>

          <p
            className="animate-fade-in-up animate-delay-2"
            style={{ fontSize: "1.2rem", color: C.muted, maxWidth: 600, margin: "0 auto 40px", lineHeight: 1.7 }}
          >
            Record your Google Meet. Decker transcribes it, extracts the key points, and generates a polished
            presentation — before anyone leaves the call.
          </p>

          <div className="animate-fade-in-up animate-delay-3" style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            {primaryCTA}
            <a href="https://github.com/AishwaryShrivastav/decker" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
              Self-host for free →
            </a>
          </div>

          <p className="animate-fade-in-up animate-delay-4" style={{ marginTop: 22, fontSize: "0.78rem", color: C.dim, letterSpacing: "0.04em" }}>
            MIT licensed · Your OpenAI key · No backend · No data stored
          </p>
        </div>
      </section>

      {/* Story */}
      <section
        id="story"
        ref={storyRef.ref}
        className={`reveal-on-scroll ${storyRef.revealed ? "revealed" : ""}`}
        style={{ maxWidth: 800, margin: "0 auto", padding: "100px 24px" }}
      >
        <div style={{
          position: "relative",
          padding: "48px 52px",
          background: `linear-gradient(135deg, rgba(36, 150, 237, 0.06) 0%, rgba(36, 150, 237, 0.02) 100%)`,
          border: `1px solid rgba(36, 150, 237, 0.18)`,
          borderRadius: 24,
          textAlign: "center"
        }}>
          <div style={{ fontSize: "2.4rem", marginBottom: 24 }}>💡</div>
          <p style={{ fontSize: "clamp(1.1rem, 2.2vw, 1.35rem)", color: C.text, lineHeight: 1.75, margin: "0 0 28px", fontStyle: "italic" }}>
            &ldquo;You&apos;re 45 minutes into a great meeting. Ideas are flying. Decisions are made.
            Then everyone closes their laptops — and it&apos;s gone.&rdquo;
          </p>
          <p style={{ fontSize: "clamp(1rem, 1.8vw, 1.15rem)", color: C.muted, lineHeight: 1.7, margin: "0 0 28px" }}>
            Decker captures it all. In the last minute of the call, you hit Generate.
            A Reveal.js presentation drops in the chat.
          </p>
          <p style={{ fontSize: "1.2rem", fontWeight: 700, color: C.blue, margin: 0 }}>
            That&apos;s the aha moment. ✨
          </p>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how"
        ref={howRef.ref}
        className={`reveal-on-scroll ${howRef.revealed ? "revealed" : ""}`}
        style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 100px" }}
      >
        <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)", fontWeight: 800, textAlign: "center", marginBottom: 12, color: C.text, letterSpacing: "-0.5px" }}>
          How it works
        </h2>
        <p style={{ color: C.muted, textAlign: "center", marginBottom: 52, fontSize: "1rem" }}>
          Three steps. Under a minute. No setup, no server, no subscription.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {STEPS.map((s, i) => (
            <div key={s.n} className="card" style={{ transitionDelay: `${i * 0.1}s`, position: "relative", overflow: "hidden" }}>
              <div style={{
                position: "absolute", top: 0, right: 0,
                fontSize: "6rem", fontWeight: 900, color: "rgba(36, 150, 237, 0.04)",
                lineHeight: 1, padding: "8px 16px", fontFamily: "Space Grotesk, sans-serif"
              }}>{s.n}</div>
              <div style={{
                width: 48, height: 48, borderRadius: "50%",
                background: `rgba(36, 150, 237, 0.12)`, border: `2px solid ${C.blue}`,
                color: C.blue, fontWeight: 800, fontSize: "1.1rem",
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18
              }}>{s.n}</div>
              <div style={{ fontWeight: 700, color: C.text, marginBottom: 10, fontSize: "1.1rem" }}>{s.title}</div>
              <p style={{ fontSize: "0.92rem", color: C.muted, margin: 0, lineHeight: 1.65 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        ref={featuresRef.ref}
        className={`reveal-on-scroll ${featuresRef.revealed ? "revealed" : ""}`}
        style={{ background: `rgba(255,255,255,0.015)`, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "100px 24px" }}>
          <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)", fontWeight: 800, textAlign: "center", marginBottom: 12, color: C.text, letterSpacing: "-0.5px" }}>
            Built for meetings that matter
          </h2>
          <p style={{ color: C.muted, textAlign: "center", marginBottom: 52, fontSize: "1rem" }}>
            Every feature exists to help you close meetings with conviction.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 20 }}>
            {FEATURES.map((f, i) => (
              <div key={f.title} className="card" style={{ transitionDelay: `${i * 0.07}s` }}>
                <div style={{ fontSize: "1.9rem", marginBottom: 14 }}>{f.icon}</div>
                <div style={{ fontWeight: 700, color: C.text, marginBottom: 8, fontSize: "1rem" }}>{f.title}</div>
                <p style={{ fontSize: "0.88rem", color: C.muted, margin: 0, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        ref={pricingRef.ref}
        className={`reveal-on-scroll ${pricingRef.revealed ? "revealed" : ""}`}
        style={{ maxWidth: 860, margin: "0 auto", padding: "100px 24px" }}
      >
        <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)", fontWeight: 800, textAlign: "center", marginBottom: 12, color: C.text, letterSpacing: "-0.5px" }}>
          Simple pricing. Actually simple.
        </h2>
        <p style={{ color: C.muted, textAlign: "center", marginBottom: 52, fontSize: "1rem" }}>
          Free if you build it. One dollar if you just want to use it.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }} className="pricing-grid">
          {/* Free */}
          <div className="card" style={{ padding: "36px 32px", display: "flex", flexDirection: "column" }}>
            <div style={{ fontWeight: 700, color: C.muted, fontSize: "0.8rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>Open Source</div>
            <div style={{ fontSize: "2.8rem", fontWeight: 800, color: C.text, letterSpacing: "-1px", marginBottom: 8 }}>Free</div>
            <p style={{ fontSize: "0.9rem", color: C.muted, marginBottom: 28, lineHeight: 1.6 }}>Clone, build, and run Decker yourself. MIT licensed — fork it, extend it, ship your own version.</p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", flex: 1 }}>
              {[
                "Full source code access",
                "Self-host the Next.js backend",
                "Build your own Chrome extension",
                "MIT licensed — use commercially",
                "Contribute back to the project",
              ].map((item) => (
                <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 11, color: C.muted, fontSize: "0.9rem" }}>
                  <span style={{ color: C.blue, marginTop: 2, flexShrink: 0 }}>✓</span> {item}
                </li>
              ))}
            </ul>
            <a href="https://github.com/AishwaryShrivastav/decker" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
              Clone on GitHub →
            </a>
          </div>

          {/* $1 Plugin */}
          <div
            className="card animate-glow"
            style={{
              padding: "36px 32px",
              display: "flex", flexDirection: "column",
              background: `linear-gradient(135deg, rgba(36,150,237,0.1) 0%, rgba(36,150,237,0.04) 100%)`,
              border: `1px solid rgba(36, 150, 237, 0.35)`,
              position: "relative", overflow: "hidden"
            }}
          >
            <div style={{
              position: "absolute", top: 20, right: 20,
              background: C.gold, color: "#000", fontSize: "0.7rem",
              fontWeight: 800, padding: "4px 10px", borderRadius: 100, letterSpacing: "0.05em"
            }}>RECOMMENDED</div>

            <div style={{ fontWeight: 700, color: C.blue, fontSize: "0.8rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>Chrome Plugin</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: "2.8rem", fontWeight: 800, color: C.text, letterSpacing: "-1px" }}>$1</span>
              <span style={{ color: C.muted, fontSize: "0.9rem" }}>one-time</span>
            </div>
            <p style={{ fontSize: "0.8rem", color: C.dim, marginBottom: 28 }}>No subscription. No renewal. Pay once, use forever.</p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", flex: 1 }}>
              {[
                "One-click install from Chrome Web Store",
                "Works in Chrome, Brave, Arc, Edge",
                "Use the current build forever",
                "Occasional free upgrades — no extra charge",
                "No self-hosting, no build step",
              ].map((item) => (
                <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 11, color: C.text, fontSize: "0.9rem" }}>
                  <span style={{ color: C.blue, marginTop: 2, flexShrink: 0 }}>✓</span> {item}
                </li>
              ))}
            </ul>
            <a href="https://chrome.google.com/webstore" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
              Install from Chrome Web Store — $1
            </a>
          </div>
        </div>

        <p style={{ textAlign: "center", color: C.dim, fontSize: "0.82rem", marginTop: 24 }}>
          Both options use your own OpenAI API key. Processing costs go directly to OpenAI — typically a few cents per meeting.
        </p>
      </section>

      {/* Open Source & Privacy */}
      <section
        style={{ background: `rgba(255,255,255,0.015)`, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "100px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }} className="privacy-grid">
            <div>
              <h2 style={{ fontSize: "clamp(1.6rem, 2.8vw, 2.2rem)", fontWeight: 800, marginBottom: 16, color: C.text, letterSpacing: "-0.5px" }}>
                Open source.<br />Privacy first.
              </h2>
              <p style={{ color: C.muted, marginBottom: 24, lineHeight: 1.75, fontSize: "1rem" }}>
                Decker is MIT licensed. Every line of code is on GitHub — inspect it, fork it, deploy it.
                We don&apos;t store recordings, transcripts, or decks. Your API key goes directly from
                your browser to OpenAI. Nothing passes through our servers.
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {[
                  "No backend data storage — ever",
                  "API calls go browser → OpenAI directly",
                  "Fully auditable open source code",
                  "Bring your own OpenAI or Claude key",
                  "Self-host everything for full control",
                ].map((item) => (
                  <li key={item} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, color: C.text, fontSize: "0.95rem" }}>
                    <span style={{ color: C.blue }}>✓</span> {item}
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: 32, display: "flex", gap: 12 }}>
                <a href="https://github.com/AishwaryShrivastav/decker" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ fontSize: "0.9rem" }}>
                  View source on GitHub ↗
                </a>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { icon: "🔑", title: "Your key, your costs", desc: "Add your OpenAI API key once. All AI calls are billed to your account. A typical meeting costs under $0.05." },
                { icon: "🏠", title: "Self-hostable", desc: "The web backend is a Next.js app. Deploy it on Vercel, fly.io, or your own server in minutes." },
                { icon: "🔍", title: "Fully auditable", desc: "Not just open source — it&apos;s a simple codebase. No telemetry, no tracking, no surprises." },
              ].map((item) => (
                <div key={item.title} className="card" style={{ padding: "20px 24px", display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, color: C.text, marginBottom: 4, fontSize: "0.95rem" }}>{item.title}</div>
                    <p style={{ fontSize: "0.85rem", color: C.muted, margin: 0, lineHeight: 1.55 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Browsers */}
      <section
        id="browsers"
        ref={browsersRef.ref}
        className={`reveal-on-scroll ${browsersRef.revealed ? "revealed" : ""}`}
        style={{ maxWidth: 1100, margin: "0 auto", padding: "100px 24px", textAlign: "center" }}
      >
        <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)", fontWeight: 800, marginBottom: 12, color: C.text, letterSpacing: "-0.5px" }}>
          Browser support
        </h2>
        <p style={{ color: C.muted, marginBottom: 44, fontSize: "1rem" }}>
          All Chromium-based browsers work today. Firefox and Safari are on the roadmap.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          {BROWSERS.map((b) => (
            <div
              key={b.name}
              className="roadmap-item"
              style={{
                background: C.card, border: `1px solid ${C.border}`,
                borderRadius: 100, padding: "10px 22px",
                fontSize: "0.9rem", color: b.status === "live" ? C.text : C.dim,
                display: "flex", alignItems: "center", gap: 8,
                opacity: b.status === "live" ? 1 : 0.6,
              }}
            >
              <span>{b.icon}</span>
              <span>{b.name}</span>
              {b.status === "live" ? (
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
              ) : (
                <span style={{ fontSize: "0.7rem", background: `rgba(36, 150, 237, 0.15)`, color: C.blue, borderRadius: 100, padding: "2px 8px" }}>roadmap</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section
        ref={ctaRef.ref}
        className={`reveal-on-scroll ${ctaRef.revealed ? "revealed" : ""}`}
        style={{
          padding: "120px 24px",
          textAlign: "center",
          background: `radial-gradient(ellipse 70% 60% at 50% 50%, rgba(36,150,237,0.1) 0%, transparent 70%)`,
          borderTop: `1px solid ${C.border}`,
        }}
      >
        <img src="/logo.png" alt="Decker" width={72} height={72} style={{ objectFit: "contain", marginBottom: 28 }} className="animate-float" />
        <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, marginBottom: 16, color: C.text, letterSpacing: "-1px" }}>
          Ready to give your next meeting<br />an aha moment?
        </h2>
        <p style={{ color: C.muted, marginBottom: 40, fontSize: "1.05rem", maxWidth: 500, margin: "0 auto 40px" }}>
          Free if you build it. A dollar if you just want to use it. No catch.
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="https://chrome.google.com/webstore" target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            Get Chrome Plugin — $1
          </a>
          <a href="https://github.com/AishwaryShrivastav/decker" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
            View on GitHub ↗
          </a>
        </div>
        <p style={{ marginTop: 20, fontSize: "0.78rem", color: C.dim }}>
          One-time payment · Use forever · MIT licensed
        </p>
      </section>

      {/* Footer */}
      <footer style={{
        maxWidth: 1100, margin: "0 auto",
        padding: "32px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 12,
        color: C.dim, fontSize: "0.85rem",
        borderTop: `1px solid ${C.border}`
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/logo.png" alt="Decker" width={24} height={24} style={{ objectFit: "contain", opacity: 0.6 }} />
          <span>© {new Date().getFullYear()} Decker — MIT License</span>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          <a href="https://github.com/AishwaryShrivastav/decker" style={{ color: C.blue, textDecoration: "none" }} target="_blank" rel="noopener noreferrer">GitHub ↗</a>
          <a href="https://github.com/AishwaryShrivastav/decker/issues" style={{ color: C.muted, textDecoration: "none" }} target="_blank" rel="noopener noreferrer">Issues</a>
          <a href="https://github.com/AishwaryShrivastav/decker/blob/main/CONTRIBUTING.md" style={{ color: C.muted, textDecoration: "none" }} target="_blank" rel="noopener noreferrer">Contributing</a>
        </div>
      </footer>

      <style>{`
        @media (max-width: 700px) {
          .pricing-grid { grid-template-columns: 1fr !important; }
          .privacy-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}
