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
  accent: "#818cf8",
  accentBright: "#a5b4fc",
  accentDim: "rgba(99,102,241,0.15)",
  accentBorder: "rgba(99,102,241,0.3)",
  violet: "#a78bfa",
  bg: "#080c18",
  surface: "#0d1224",
  card: "#111827",
  border: "rgba(255,255,255,0.07)",
  text: "#e2e8f0",
  muted: "#64748b",
  dim: "#374151",
  green: "#34d399",
};

const OUTPUTS = [
  {
    tag: "Static Prototype",
    icon: "⚡",
    headline: "Claude builds the actual product",
    desc: "Describe it in a meeting. Decker builds a working, clickable prototype while you talk. Show it before the call ends.",
    color: C.violet,
    colorDim: "rgba(167,139,250,0.12)",
    colorBorder: "rgba(167,139,250,0.3)",
  },
  {
    tag: "HTML Presentation",
    icon: "🎯",
    headline: "A slide deck without the slides software",
    desc: "Pure HTML. Click or arrow-key to navigate. Drop it in the chat. No PowerPoint, no Google Slides, no exports.",
    color: C.accent,
    colorDim: C.accentDim,
    colorBorder: C.accentBorder,
  },
  {
    tag: "Discussion SPA",
    icon: "🌐",
    headline: "A website about the ideas you just discussed",
    desc: "A full single-page brief: hero, sections, decisions, insights. Something you'd share with your whole org.",
    color: "#34d399",
    colorDim: "rgba(52,211,153,0.1)",
    colorBorder: "rgba(52,211,153,0.3)",
  },
  {
    tag: "Meeting Brief",
    icon: "📋",
    headline: "A structured brief, not bullet points",
    desc: "Key decisions, action items, and research context — laid out like a proper product document.",
    color: "#f59e0b",
    colorDim: "rgba(245,158,11,0.1)",
    colorBorder: "rgba(245,158,11,0.3)",
  },
];

const HOW_STEPS = [
  {
    n: "01",
    title: "Hit record",
    desc: "Click the Decker icon in Chrome while you're live in Google Meet. One click. No setup, no screen share, no friction.",
  },
  {
    n: "02",
    title: "Topics appear live",
    desc: "Claude listens as you talk and surfaces topics in real time. Check the ones that matter — research starts instantly in the background.",
  },
  {
    n: "03",
    title: "Generate at any point",
    desc: "Hit Generate whenever you're ready — mid-meeting or after. Claude builds your artifact using everything it researched while you were talking.",
  },
  {
    n: "04",
    title: "Show it before the call ends",
    desc: "A working prototype, a presentation, a website — drop it in the chat. That's the aha moment. That's how you close a meeting.",
  },
];

const FEATURES = [
  {
    icon: "🔴",
    title: "Live topic discovery",
    desc: "Claude extracts discussion topics in real time as audio is transcribed — every 16 seconds while the meeting runs.",
  },
  {
    icon: "🔬",
    title: "Background research",
    desc: "The moment you select a topic, Claude Haiku researches it in parallel. By generate time, the context is already there.",
  },
  {
    icon: "⚡",
    title: "Four output formats",
    desc: "Prototype, presentation, SPA, or brief — Claude generates a complete, self-contained HTML file for each.",
  },
  {
    icon: "🎙",
    title: "Tab + mic recording",
    desc: "Captures Google Meet tab audio (everyone else) plus your microphone. No screen share dialog, no extra installs.",
  },
  {
    icon: "🔑",
    title: "Your keys. Your data.",
    desc: "Claude key for generation. OpenAI key for Whisper transcription. Both stored locally. Nothing touches our servers.",
  },
  {
    icon: "🧠",
    title: "State persists across opens",
    desc: "Close and reopen the popup anytime. Topics, research, and transcripts are all still there — exactly where you left them.",
  },
];

const BROWSERS = [
  { name: "Chrome", icon: "🌐", status: "live" as const },
  { name: "Brave", icon: "🦁", status: "live" as const },
  { name: "Arc", icon: "◐", status: "live" as const },
  { name: "Edge", icon: "🔷", status: "live" as const },
  { name: "Firefox", icon: "🦊", status: "soon" as const },
  { name: "Safari", icon: "🧭", status: "soon" as const },
];

function useScrollReveal(threshold = 0.08) {
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
  const heroRef = useScrollReveal(0.15);
  const outputsRef = useScrollReveal(0.05);
  const howRef = useScrollReveal(0.05);
  const featuresRef = useScrollReveal(0.05);
  const pricingRef = useScrollReveal(0.05);
  const ctaRef = useScrollReveal(0.1);

  useEffect(() => { setBrowser(detectBrowser()); }, []);

  const primaryCTA = browser === "firefox"
    ? <span className="btn btn-primary" style={{ opacity: 0.45, cursor: "not-allowed" }}>Firefox — Coming Soon</span>
    : <a href="https://chrome.google.com/webstore" target="_blank" rel="noopener noreferrer" className="btn btn-primary">Get the Extension — $1</a>;

  return (
    <main style={{ background: C.bg, color: C.text, fontFamily: "Inter, -apple-system, sans-serif" }}>

      {/* ── NAV ── */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, backdropFilter: "blur(16px)", background: "rgba(8,12,24,0.8)", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="#" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <img src="/logo.png" alt="Decker" width={32} height={32} style={{ objectFit: "contain" }} />
            <span style={{ fontWeight: 800, fontSize: "1.15rem", color: C.accent, letterSpacing: "-0.5px" }}>Decker</span>
          </a>
          <div style={{ display: "flex", gap: 24, alignItems: "center", fontSize: "0.875rem" }}>
            <a href="#how" style={{ color: C.muted, textDecoration: "none" }}>How it works</a>
            <a href="#outputs" style={{ color: C.muted, textDecoration: "none" }}>Outputs</a>
            <a href="#pricing" style={{ color: C.muted, textDecoration: "none" }}>Pricing</a>
            <a href="https://github.com/AishwaryShrivastav/decker" target="_blank" rel="noopener noreferrer" style={{ color: C.muted, textDecoration: "none" }}>GitHub</a>
            {browser === "chromium"
              ? <a href="https://chrome.google.com/webstore" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: "7px 16px", fontSize: "0.82rem" }}>Get Extension — $1</a>
              : <a href="https://github.com/AishwaryShrivastav/decker" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: "7px 16px", fontSize: "0.82rem" }}>View on GitHub</a>}
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        ref={heroRef.ref}
        style={{
          padding: "140px 24px 100px",
          minHeight: "88vh",
          display: "flex",
          alignItems: "center",
          background: `radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.2) 0%, transparent 60%),
                       radial-gradient(ellipse 60% 40% at 85% 60%, rgba(167,139,250,0.08) 0%, transparent 50%),
                       ${C.bg}`,
        }}
      >
        <div style={{ maxWidth: 800, margin: "0 auto", width: "100%", textAlign: "center" }}>
          <div className="animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: C.accentDim, border: `1px solid ${C.accentBorder}`,
              borderRadius: 99, padding: "6px 16px", marginBottom: 32,
              fontSize: "0.78rem", color: C.accentBright, fontWeight: 600, letterSpacing: "0.04em",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, display: "inline-block" }} />
              For product owners and tech leads in meetings
            </div>
          </div>

          <h1 className="animate-fade-in-up animate-delay-1" style={{
            fontSize: "clamp(2.6rem, 6vw, 4.8rem)", fontWeight: 800,
            margin: "0 0 20px", letterSpacing: "-2.5px", lineHeight: 1.05, color: C.text,
          }}>
            Ship the idea,
            <br />
            <span style={{
              background: `linear-gradient(135deg, ${C.accent} 0%, ${C.violet} 60%, ${C.accentBright} 100%)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>not the follow-up.</span>
          </h1>

          <p className="animate-fade-in-up animate-delay-2" style={{
            fontSize: "1.2rem", color: C.muted, maxWidth: 580, margin: "0 auto 36px", lineHeight: 1.7,
          }}>
            Record your meeting. Decker researches every topic in the background as you talk.
            At the end of the call — hit Generate. Claude ships a working prototype, a slide deck,
            or a product brief. Right there. Before anyone closes their laptop.
          </p>

          <div className="animate-fade-in-up animate-delay-3" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {primaryCTA}
            <a href="https://github.com/AishwaryShrivastav/decker" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
              Self-host for free →
            </a>
          </div>

          <p className="animate-fade-in-up animate-delay-4" style={{ marginTop: 20, fontSize: "0.76rem", color: C.dim }}>
            MIT licensed · BYOK (Claude + OpenAI) · No backend · No data stored
          </p>
        </div>
      </section>

      {/* ── AHA MOMENT BLOCK ── */}
      <section style={{ maxWidth: 820, margin: "0 auto", padding: "0 24px 100px" }}>
        <div style={{
          padding: "52px 56px",
          background: `linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(167,139,250,0.04) 100%)`,
          border: `1px solid ${C.accentBorder}`,
          borderRadius: 24,
          textAlign: "center",
        }}>
          <div style={{ fontSize: "2rem", marginBottom: 20 }}>💡</div>
          <p style={{ fontSize: "clamp(1.05rem, 2vw, 1.3rem)", color: C.text, lineHeight: 1.8, margin: "0 0 24px", fontStyle: "italic", fontWeight: 300 }}>
            &ldquo;You&apos;re 50 minutes into a great product session. The idea is clear. The decisions are made.
            The old way: someone takes notes, sends a recap tomorrow, momentum dies.&rdquo;
          </p>
          <p style={{ fontSize: "clamp(0.95rem, 1.7vw, 1.1rem)", color: C.muted, lineHeight: 1.75, margin: "0 0 24px" }}>
            The Decker way: you hit Generate in the last minute.
            Claude builds the prototype you just described. You share it in the chat.
            <br />
            <strong style={{ color: C.text }}>Everyone sees it. Right now. Before the call ends.</strong>
          </p>
          <p style={{ fontSize: "1.15rem", fontWeight: 700, color: C.accentBright, margin: 0 }}>
            That&apos;s the aha moment. ✨
          </p>
        </div>
      </section>

      {/* ── OUTPUTS ── */}
      <section
        id="outputs"
        ref={outputsRef.ref}
        className={`reveal-on-scroll ${outputsRef.revealed ? "revealed" : ""}`}
        style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 100px" }}
      >
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)", fontWeight: 800, color: C.text, letterSpacing: "-0.5px", marginBottom: 12 }}>
            Four outputs. One meeting.
          </h2>
          <p style={{ color: C.muted, fontSize: "1rem", maxWidth: 520, margin: "0 auto" }}>
            Claude decides the best format for what you built — or you choose. Every output is a self-contained HTML file you can share instantly.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
          {OUTPUTS.map((o, i) => (
            <div key={o.tag} className="card" style={{
              transitionDelay: `${i * 0.08}s`,
              background: o.colorDim,
              border: `1px solid ${o.colorBorder}`,
              padding: "28px 26px",
            }}>
              <div style={{ fontSize: "1.6rem", marginBottom: 12 }}>{o.icon}</div>
              <div style={{
                display: "inline-block",
                fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em",
                textTransform: "uppercase", color: o.color,
                background: `rgba(255,255,255,0.04)`,
                border: `1px solid ${o.colorBorder}`,
                borderRadius: 99, padding: "3px 10px", marginBottom: 12,
              }}>{o.tag}</div>
              <div style={{ fontWeight: 700, color: C.text, fontSize: "1rem", marginBottom: 8, lineHeight: 1.35 }}>{o.headline}</div>
              <p style={{ fontSize: "0.88rem", color: C.muted, margin: 0, lineHeight: 1.65 }}>{o.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section
        id="how"
        ref={howRef.ref}
        className={`reveal-on-scroll ${howRef.revealed ? "revealed" : ""}`}
        style={{ background: "rgba(255,255,255,0.015)", borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "100px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)", fontWeight: 800, color: C.text, letterSpacing: "-0.5px", marginBottom: 12 }}>
              How it works
            </h2>
            <p style={{ color: C.muted, fontSize: "1rem" }}>
              One extension. Four steps. Zero follow-up emails.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
            {HOW_STEPS.map((s, i) => (
              <div key={s.n} className="card" style={{ transitionDelay: `${i * 0.1}s`, position: "relative", paddingTop: 32 }}>
                <div style={{
                  position: "absolute", top: -1, left: 24,
                  fontFamily: "monospace", fontSize: "0.68rem", fontWeight: 700,
                  color: C.accent, background: C.accentDim,
                  border: `1px solid ${C.accentBorder}`,
                  padding: "3px 10px", borderRadius: "0 0 8px 8px",
                  letterSpacing: "0.06em",
                }}>{s.n}</div>
                <div style={{ fontWeight: 700, color: C.text, marginBottom: 10, fontSize: "1.05rem" }}>{s.title}</div>
                <p style={{ fontSize: "0.9rem", color: C.muted, margin: 0, lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section
        id="features"
        ref={featuresRef.ref}
        className={`reveal-on-scroll ${featuresRef.revealed ? "revealed" : ""}`}
        style={{ maxWidth: 1100, margin: "0 auto", padding: "100px 24px" }}
      >
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)", fontWeight: 800, color: C.text, letterSpacing: "-0.5px", marginBottom: 12 }}>
            Built for the last minute of a meeting
          </h2>
          <p style={{ color: C.muted, fontSize: "1rem" }}>
            Every feature is designed so generation is instant by the time you need it.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          {FEATURES.map((f, i) => (
            <div key={f.title} className="card" style={{ transitionDelay: `${i * 0.06}s`, display: "flex", gap: 16, alignItems: "flex-start", padding: "20px 22px" }}>
              <span style={{ fontSize: "1.4rem", flexShrink: 0 }}>{f.icon}</span>
              <div>
                <div style={{ fontWeight: 700, color: C.text, marginBottom: 5, fontSize: "0.95rem" }}>{f.title}</div>
                <p style={{ fontSize: "0.86rem", color: C.muted, margin: 0, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHO IT'S FOR ── */}
      <section style={{ background: "rgba(255,255,255,0.015)", borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "100px 24px", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(1.6rem, 2.8vw, 2.2rem)", fontWeight: 800, color: C.text, letterSpacing: "-0.5px", marginBottom: 16 }}>
            Built for people who make things in meetings
          </h2>
          <p style={{ color: C.muted, lineHeight: 1.8, fontSize: "1.05rem", maxWidth: 640, margin: "0 auto 48px" }}>
            If you&apos;re a product owner walking through a spec, a tech lead scoping an architecture, an engineer explaining a feature — Decker is for that meeting. The one where the idea is real, decisions get made, and you want to leave with something tangible.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {["Product Owners", "Engineering Leads", "CTOs & VPs Eng", "Founders", "Design Leads", "Technical PMs"].map((role) => (
              <div key={role} style={{
                padding: "8px 18px", borderRadius: 99,
                background: C.accentDim, border: `1px solid ${C.accentBorder}`,
                fontSize: "0.85rem", color: C.accentBright, fontWeight: 500,
              }}>{role}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BYOK ── */}
      <section style={{ maxWidth: 860, margin: "0 auto", padding: "80px 24px 0" }}>
        <div style={{
          padding: "36px 44px",
          background: `linear-gradient(135deg, rgba(99,102,241,0.07) 0%, rgba(99,102,241,0.02) 100%)`,
          border: `1px solid ${C.accentBorder}`,
          borderRadius: 20,
          display: "grid", gridTemplateColumns: "auto 1fr", gap: 24, alignItems: "center",
        }} className="byok-grid">
          <div style={{
            width: 60, height: 60, borderRadius: 14,
            background: C.accentDim, border: `1px solid ${C.accentBorder}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.6rem", flexShrink: 0,
          }}>🔑</div>
          <div>
            <div style={{ fontWeight: 800, color: C.text, fontSize: "1.05rem", marginBottom: 7 }}>
              Bring Your Own Keys — Claude + OpenAI
            </div>
            <p style={{ color: C.muted, margin: 0, lineHeight: 1.7, fontSize: "0.92rem" }}>
              Decker uses <strong style={{ color: C.text }}>your Claude key</strong> (Anthropic) for topic extraction, research, and generation — and <strong style={{ color: C.text }}>your OpenAI key</strong> for Whisper transcription. Both are stored locally in your browser. Nothing touches our servers. A typical meeting costs a few cents.
            </p>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section
        id="pricing"
        ref={pricingRef.ref}
        className={`reveal-on-scroll ${pricingRef.revealed ? "revealed" : ""}`}
        style={{ maxWidth: 860, margin: "0 auto", padding: "100px 24px" }}
      >
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)", fontWeight: 800, color: C.text, letterSpacing: "-0.5px", marginBottom: 12 }}>
            Simple pricing.
          </h2>
          <p style={{ color: C.muted, fontSize: "1rem" }}>Free if you build it. One dollar if you just want to use it.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }} className="pricing-grid">

          {/* Open Source */}
          <div className="card" style={{ padding: "36px 32px", display: "flex", flexDirection: "column" }}>
            <div style={{ fontWeight: 700, color: C.muted, fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>Open Source</div>
            <div style={{ fontSize: "2.6rem", fontWeight: 800, color: C.text, letterSpacing: "-1px", marginBottom: 8 }}>Free</div>
            <p style={{ fontSize: "0.9rem", color: C.muted, marginBottom: 28, lineHeight: 1.6 }}>Clone, self-host, extend. MIT licensed — use it commercially, fork it, make it yours.</p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", flex: 1 }}>
              {["Full source code on GitHub", "Self-host the Next.js backend", "Build your own Chrome extension", "MIT licensed — use commercially"].map((item) => (
                <li key={item} style={{ display: "flex", gap: 10, marginBottom: 10, color: C.muted, fontSize: "0.88rem" }}>
                  <span style={{ color: C.accent, flexShrink: 0 }}>✓</span> {item}
                </li>
              ))}
            </ul>
            <a href="https://github.com/AishwaryShrivastav/decker" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
              Clone on GitHub →
            </a>
          </div>

          {/* $1 Plugin */}
          <div className="card animate-glow" style={{
            padding: "36px 32px", display: "flex", flexDirection: "column",
            background: `linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(99,102,241,0.04) 100%)`,
            border: `1px solid ${C.accentBorder}`,
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: 18, right: 18,
              background: "#f59e0b", color: "#000",
              fontSize: "0.65rem", fontWeight: 800, padding: "3px 10px", borderRadius: 99, letterSpacing: "0.06em",
            }}>RECOMMENDED</div>
            <div style={{ fontWeight: 700, color: C.accent, fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>Chrome Extension</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: "2.6rem", fontWeight: 800, color: C.text, letterSpacing: "-1px" }}>$1</span>
              <span style={{ color: C.muted, fontSize: "0.9rem" }}>one-time</span>
            </div>
            <p style={{ fontSize: "0.8rem", color: C.muted, marginBottom: 28 }}>No subscription. No renewal. Pay once, use forever.</p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", flex: 1 }}>
              {["One-click install from Chrome Web Store", "Works in Chrome, Brave, Arc, Edge", "Use the current build forever", "No self-hosting, no build step"].map((item) => (
                <li key={item} style={{ display: "flex", gap: 10, marginBottom: 10, color: C.text, fontSize: "0.88rem" }}>
                  <span style={{ color: C.accent, flexShrink: 0 }}>✓</span> {item}
                </li>
              ))}
            </ul>
            <a href="https://chrome.google.com/webstore" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
              Install from Chrome Web Store — $1
            </a>
          </div>
        </div>
        <p style={{ textAlign: "center", color: C.dim, fontSize: "0.8rem", marginTop: 20 }}>
          🔑 Both options are BYOK — your Claude and OpenAI keys, stored in your browser. We never handle your data.
        </p>
      </section>

      {/* ── BROWSERS ── */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 100px", textAlign: "center" }}>
        <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: C.text, marginBottom: 10, letterSpacing: "-0.3px" }}>Browser support</h2>
        <p style={{ color: C.muted, marginBottom: 36, fontSize: "0.95rem" }}>All Chromium-based browsers today. Firefox and Safari on the roadmap.</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          {BROWSERS.map((b) => (
            <div key={b.name} style={{
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 99, padding: "9px 20px",
              fontSize: "0.88rem", color: b.status === "live" ? C.text : C.dim,
              display: "flex", alignItems: "center", gap: 8,
              opacity: b.status === "live" ? 1 : 0.55,
            }}>
              <span>{b.icon}</span>
              <span>{b.name}</span>
              {b.status === "live"
                ? <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.green }} />
                : <span style={{ fontSize: "0.65rem", background: C.accentDim, color: C.accent, borderRadius: 99, padding: "2px 7px" }}>soon</span>}
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section
        ref={ctaRef.ref}
        className={`reveal-on-scroll ${ctaRef.revealed ? "revealed" : ""}`}
        style={{
          padding: "120px 24px",
          textAlign: "center",
          background: `radial-gradient(ellipse 70% 60% at 50% 50%, rgba(99,102,241,0.12) 0%, transparent 70%)`,
          borderTop: `1px solid ${C.border}`,
        }}
      >
        <img src="/logo.png" alt="Decker" width={68} height={68} style={{ objectFit: "contain", marginBottom: 28 }} className="animate-float" />
        <h2 style={{ fontSize: "clamp(1.9rem, 4vw, 3rem)", fontWeight: 800, marginBottom: 14, color: C.text, letterSpacing: "-1px" }}>
          End your next big meeting
          <br />with a working prototype.
        </h2>
        <p style={{ color: C.muted, marginBottom: 40, fontSize: "1.05rem", maxWidth: 460, margin: "0 auto 40px" }}>
          Free to build. A dollar to install. No subscription. No catch.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="https://chrome.google.com/webstore" target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            Get the Extension — $1
          </a>
          <a href="https://github.com/AishwaryShrivastav/decker" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
            View on GitHub ↗
          </a>
        </div>
        <p style={{ marginTop: 18, fontSize: "0.76rem", color: C.dim }}>
          One-time payment · MIT licensed · BYOK
        </p>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        maxWidth: 1100, margin: "0 auto", padding: "28px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
        color: C.dim, fontSize: "0.82rem", borderTop: `1px solid ${C.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src="/logo.png" alt="Decker" width={22} height={22} style={{ objectFit: "contain", opacity: 0.5 }} />
          <span>© {new Date().getFullYear()} Decker — MIT License</span>
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          <a href="https://github.com/AishwaryShrivastav/decker" style={{ color: C.accent, textDecoration: "none" }} target="_blank" rel="noopener noreferrer">GitHub ↗</a>
          <a href="https://github.com/AishwaryShrivastav/decker/issues" style={{ color: C.muted, textDecoration: "none" }} target="_blank" rel="noopener noreferrer">Issues</a>
          <a href="/demo" style={{ color: C.muted, textDecoration: "none" }}>Demo →</a>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 11px 22px; border-radius: 8px; font-size: 0.9rem; font-weight: 700; text-decoration: none; transition: all 0.18s; cursor: pointer; border: none; }
        .btn-primary { background: ${C.accent}; color: ${C.bg}; }
        .btn-primary:hover { background: ${C.accentBright}; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(99,102,241,0.3); }
        .btn-secondary { background: transparent; color: ${C.text}; border: 1px solid ${C.border}; }
        .btn-secondary:hover { border-color: ${C.accent}; color: ${C.accent}; }
        .card { background: ${C.card}; border: 1px solid ${C.border}; border-radius: 14px; padding: 26px; transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s; }
        .card:hover { border-color: rgba(99,102,241,0.3); transform: translateY(-2px); box-shadow: 0 12px 32px rgba(0,0,0,0.3); }
        .nav-link:hover { color: ${C.text} !important; }
        .animate-glow { box-shadow: 0 0 0 1px rgba(99,102,241,0.2); }
        .animate-glow:hover { box-shadow: 0 0 0 1px rgba(99,102,241,0.4), 0 8px 32px rgba(99,102,241,0.15); }
        .animate-float { animation: float 3s ease-in-out infinite; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .animate-fade-in-up { animation: fadeInUp 0.7s ease both; }
        .animate-delay-1 { animation-delay: 0.15s; }
        .animate-delay-2 { animation-delay: 0.25s; }
        .animate-delay-3 { animation-delay: 0.35s; }
        .animate-delay-4 { animation-delay: 0.45s; }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        .reveal-on-scroll { opacity: 0; transform: translateY(20px); transition: opacity 0.6s ease, transform 0.6s ease; }
        .reveal-on-scroll.revealed { opacity: 1; transform: translateY(0); }
        .reveal-on-scroll .card { opacity: 0; transform: translateY(16px); transition: opacity 0.5s ease, transform 0.5s ease, border-color 0.2s, box-shadow 0.2s; }
        .reveal-on-scroll.revealed .card { opacity: 1; transform: translateY(0); }
        @media (max-width: 700px) {
          .pricing-grid { grid-template-columns: 1fr !important; }
          .byok-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}
