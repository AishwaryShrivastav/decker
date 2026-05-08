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
  accentDim: "rgba(99,102,241,0.12)",
  accentBorder: "rgba(99,102,241,0.25)",
  violet: "#a78bfa",
  bg: "#060910",
  surface: "#0c1020",
  card: "#0e1528",
  cardHover: "#111c32",
  border: "rgba(255,255,255,0.06)",
  borderHover: "rgba(99,102,241,0.3)",
  text: "#e2e8f0",
  muted: "#64748b",
  dim: "#2d3748",
  green: "#34d399",
  amber: "#f59e0b",
};

const TIMELINE = [
  { time: "0:00", label: "Hit Record", sub: "One click in Chrome while you're live on Meet.", color: C.accent },
  { time: "0:16", label: "First topics appear", sub: "Claude extracts discussion points from the live transcript.", color: C.violet },
  { time: "0:32", label: "Research starts", sub: "Select a topic → Haiku researches it instantly in the background.", color: C.green },
  { time: "ongoing", label: "Meeting continues", sub: "Topics update. Research runs. Nothing interrupts your call.", color: C.muted },
  { time: "end", label: "Hit Generate", sub: "Claude Sonnet builds the artifact. Research is already done.", color: C.amber },
  { time: "+90s", label: "Share in chat", sub: "Working prototype, deck, or brief. Before anyone hangs up.", color: C.green },
];

const OUTPUTS = [
  {
    tag: "Prototype",
    icon: "⚡",
    headline: "A working product, not a mockup",
    who: "For: product owners, founders",
    desc: "You described the feature. Claude builds it — tabs, forms, data, interactions. Show the team an actual product before the call ends.",
    color: C.violet,
    colorDim: "rgba(167,139,250,0.08)",
    colorBorder: "rgba(167,139,250,0.2)",
  },
  {
    tag: "Presentation",
    icon: "🎯",
    headline: "A slide deck with no slide software",
    who: "For: engineering leads, PMs",
    desc: "Pure HTML. Navigate with arrow keys or buttons. One self-contained file you can drop in Slack right now.",
    color: C.accent,
    colorDim: "rgba(99,102,241,0.08)",
    colorBorder: "rgba(99,102,241,0.2)",
  },
  {
    tag: "Discussion SPA",
    icon: "🌐",
    headline: "A website about what you just built",
    who: "For: cross-functional reviews, stakeholders",
    desc: "Not meeting notes. A real product brief site — hero, decisions, insights, sections. Something you'd actually share with your org.",
    color: C.green,
    colorDim: "rgba(52,211,153,0.08)",
    colorBorder: "rgba(52,211,153,0.2)",
  },
  {
    tag: "Meeting Brief",
    icon: "📋",
    headline: "Decisions and actions, not bullet points",
    who: "For: any technical meeting",
    desc: "Structured dark-themed document with topic sections, key decisions highlighted, and a full action item table.",
    color: C.amber,
    colorDim: "rgba(245,158,11,0.08)",
    colorBorder: "rgba(245,158,11,0.2)",
  },
];

const FEATURES = [
  {
    icon: "◉",
    title: "Live transcription",
    desc: "Whisper processes your audio every 16 seconds. The transcript builds while the meeting runs — nothing waits for the end.",
    color: C.accent,
  },
  {
    icon: "◎",
    title: "Parallel research",
    desc: "Check a topic and Claude Haiku researches it immediately, in the background. Zero interruption to your call.",
    color: C.violet,
  },
  {
    icon: "◈",
    title: "Four output formats",
    desc: "Prototype, presentation, product SPA, or structured brief. Claude generates a complete self-contained HTML file for each.",
    color: C.green,
  },
  {
    icon: "◐",
    title: "Tab + mic capture",
    desc: "Captures everyone else through the Meet tab, captures you through the mic. Mixed and transcribed together.",
    color: C.accent,
  },
  {
    icon: "◑",
    title: "State persists always",
    desc: "Close and reopen the popup during the call. Every topic and research result is exactly where you left it.",
    color: C.violet,
  },
  {
    icon: "◒",
    title: "Runs entirely in Chrome",
    desc: "No backend. No servers. Claude key for generation, OpenAI key for Whisper — both stored locally in your browser.",
    color: C.green,
  },
];

function useScrollReveal(threshold = 0.06) {
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
  const timelineRef = useScrollReveal(0.04);
  const outputsRef = useScrollReveal(0.04);
  const howRef = useScrollReveal(0.04);
  const featuresRef = useScrollReveal(0.04);
  const pricingRef = useScrollReveal(0.04);
  const ctaRef = useScrollReveal(0.08);

  useEffect(() => { setBrowser(detectBrowser()); }, []);

  const primaryCTA = browser === "firefox"
    ? <span className="btn btn-primary" style={{ opacity: 0.45, cursor: "not-allowed" }}>Firefox — Coming Soon</span>
    : <a href="https://chrome.google.com/webstore" target="_blank" rel="noopener noreferrer" className="btn btn-primary">Get Decker — $1</a>;

  return (
    <main style={{ background: C.bg, color: C.text, fontFamily: "Inter, -apple-system, sans-serif" }}>

      {/* ── NAV ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        backdropFilter: "blur(20px)",
        background: "rgba(6,9,16,0.85)",
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="#" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
            <img src="/logo.png" alt="Decker" width={28} height={28} style={{ objectFit: "contain" }} />
            <span style={{ fontWeight: 800, fontSize: "1.1rem", color: C.accent, letterSpacing: "-0.5px" }}>Decker</span>
          </a>
          <div style={{ display: "flex", gap: 28, alignItems: "center", fontSize: "0.85rem" }}>
            <a href="#how" style={{ color: C.muted, textDecoration: "none" }} className="nav-link">How it works</a>
            <a href="#outputs" style={{ color: C.muted, textDecoration: "none" }} className="nav-link">Outputs</a>
            <a href="#pricing" style={{ color: C.muted, textDecoration: "none" }} className="nav-link">Pricing</a>
            <a href="https://github.com/AishwaryShrivastav/decker" target="_blank" rel="noopener noreferrer" style={{ color: C.muted, textDecoration: "none" }} className="nav-link">GitHub</a>
            {browser === "chromium"
              ? <a href="https://chrome.google.com/webstore" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: "6px 14px", fontSize: "0.8rem" }}>Get Extension — $1</a>
              : <a href="https://github.com/AishwaryShrivastav/decker" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: "6px 14px", fontSize: "0.8rem" }}>GitHub ↗</a>}
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        padding: "148px 24px 110px",
        minHeight: "92vh",
        display: "flex",
        alignItems: "center",
        background: `
          radial-gradient(ellipse 90% 60% at 50% -5%, rgba(99,102,241,0.18) 0%, transparent 55%),
          radial-gradient(ellipse 50% 40% at 80% 70%, rgba(167,139,250,0.07) 0%, transparent 50%),
          ${C.bg}`,
      }}>
        <div style={{ maxWidth: 760, margin: "0 auto", width: "100%", textAlign: "center" }}>

          <div className="fade-up" style={{ animationDelay: "0s" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: C.accentDim, border: `1px solid ${C.accentBorder}`,
              borderRadius: 99, padding: "5px 14px", marginBottom: 36,
              fontSize: "0.75rem", color: C.accentBright, fontWeight: 600, letterSpacing: "0.05em",
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.green, display: "inline-block", boxShadow: `0 0 6px ${C.green}` }} />
              Chrome Extension · Works on Google Meet
            </div>
          </div>

          <h1 className="fade-up" style={{
            animationDelay: "0.08s",
            fontSize: "clamp(2.8rem, 6.5vw, 5rem)", fontWeight: 800,
            margin: "0 0 22px", letterSpacing: "-3px", lineHeight: 1.02, color: C.text,
          }}>
            Build the thing
            <br />
            <span style={{
              background: `linear-gradient(135deg, ${C.accent} 0%, ${C.violet} 50%, ${C.accentBright} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              before you hang up.
            </span>
          </h1>

          <p className="fade-up" style={{
            animationDelay: "0.16s",
            fontSize: "1.15rem", color: C.muted, maxWidth: 560, margin: "0 auto 40px", lineHeight: 1.75,
          }}>
            Decker records your Google Meet and researches every topic in the background
            as you talk. Hit Generate at the end — Claude ships a working prototype,
            a slide deck, or a product brief. Right there. Before the call ends.
          </p>

          <div className="fade-up" style={{ animationDelay: "0.22s", display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {primaryCTA}
            <a href="https://github.com/AishwaryShrivastav/decker" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
              Self-host free →
            </a>
          </div>

          <p className="fade-up" style={{ animationDelay: "0.28s", marginTop: 22, fontSize: "0.74rem", color: C.dim, letterSpacing: "0.02em" }}>
            MIT licensed · BYOK (Claude + OpenAI) · No backend · Your data never leaves your browser
          </p>
        </div>
      </section>

      {/* ── THE PROBLEM ── */}
      <section style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px 100px" }}>
        <div style={{
          padding: "52px 56px",
          background: `linear-gradient(135deg, rgba(14,21,40,1) 0%, rgba(12,16,32,1) 100%)`,
          border: `1px solid ${C.border}`,
          borderLeft: `3px solid ${C.accent}`,
          borderRadius: 20,
        }}>
          <p style={{ fontSize: "clamp(1rem, 2vw, 1.25rem)", color: "#94a3b8", lineHeight: 1.85, margin: "0 0 20px", fontWeight: 300 }}>
            You&apos;ve had that meeting. 50 minutes, great energy, real decisions made.
            Someone says "I&apos;ll send a summary" — and three days later you&apos;re looking at a
            blank Jira board trying to remember what you actually agreed on.
          </p>
          <p style={{ fontSize: "clamp(0.95rem, 1.7vw, 1.1rem)", color: C.text, lineHeight: 1.8, margin: 0, fontWeight: 500 }}>
            Decker solves the last minute of the meeting — when the idea is live,
            decisions are fresh, and everyone&apos;s still on the call.{" "}
            <span style={{ color: C.accentBright }}>That&apos;s when you generate.</span>
          </p>
        </div>
      </section>

      {/* ── TIMELINE ── */}
      <section
        id="how"
        ref={timelineRef.ref as React.RefObject<HTMLElement>}
        className={`reveal ${timelineRef.revealed ? "revealed" : ""}`}
        style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 110px" }}
      >
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.accent, marginBottom: 14 }}>How it works</div>
          <h2 style={{ fontSize: "clamp(1.8rem, 3.2vw, 2.7rem)", fontWeight: 800, color: C.text, letterSpacing: "-1px", margin: "0 0 14px" }}>
            The work happens while you talk.
          </h2>
          <p style={{ color: C.muted, fontSize: "1rem", maxWidth: 500, margin: "0 auto", lineHeight: 1.7 }}>
            By the time you hit Generate, the research is done, the transcript is built,
            and Claude just needs to write.
          </p>
        </div>

        <div style={{ position: "relative" }}>
          {/* Vertical line */}
          <div style={{
            position: "absolute", left: "50%", top: 20, bottom: 20,
            width: 1, background: `linear-gradient(180deg, transparent 0%, ${C.accentBorder} 10%, ${C.accentBorder} 90%, transparent 100%)`,
            transform: "translateX(-50%)",
          }} className="timeline-line" />

          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {TIMELINE.map((item, i) => {
              const isLeft = i % 2 === 0;
              return (
                <div key={item.time} className="timeline-item" style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 80px 1fr",
                  alignItems: "center",
                  gap: 0,
                  marginBottom: 8,
                  transitionDelay: `${i * 0.08}s`,
                }}>
                  {/* Left content */}
                  <div style={{ textAlign: "right", padding: "16px 32px 16px 0", opacity: isLeft ? 1 : 0 }}>
                    {isLeft && (
                      <div style={{ display: "inline-block", padding: "14px 20px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, textAlign: "left" }}>
                        <div style={{ fontWeight: 700, color: C.text, marginBottom: 4, fontSize: "0.95rem" }}>{item.label}</div>
                        <div style={{ fontSize: "0.82rem", color: C.muted, lineHeight: 1.5 }}>{item.sub}</div>
                      </div>
                    )}
                  </div>

                  {/* Center dot + time */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: C.card,
                      border: `2px solid ${item.color}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: `0 0 12px ${item.color}40`,
                      flexShrink: 0,
                      zIndex: 1,
                    }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: item.color }} />
                    </div>
                    <div style={{ fontSize: "0.62rem", fontFamily: "monospace", color: item.color, fontWeight: 700, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{item.time}</div>
                  </div>

                  {/* Right content */}
                  <div style={{ padding: "16px 0 16px 32px", opacity: isLeft ? 0 : 1 }}>
                    {!isLeft && (
                      <div style={{ display: "inline-block", padding: "14px 20px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12 }}>
                        <div style={{ fontWeight: 700, color: C.text, marginBottom: 4, fontSize: "0.95rem" }}>{item.label}</div>
                        <div style={{ fontSize: "0.82rem", color: C.muted, lineHeight: 1.5 }}>{item.sub}</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── OUTPUTS ── */}
      <section
        id="outputs"
        ref={outputsRef.ref as React.RefObject<HTMLElement>}
        className={`reveal ${outputsRef.revealed ? "revealed" : ""}`}
        style={{ background: `rgba(255,255,255,0.01)`, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "100px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.accent, marginBottom: 14 }}>Outputs</div>
            <h2 style={{ fontSize: "clamp(1.8rem, 3.2vw, 2.7rem)", fontWeight: 800, color: C.text, letterSpacing: "-1px", margin: "0 0 14px" }}>
              One meeting. Four kinds of shipped.
            </h2>
            <p style={{ color: C.muted, fontSize: "1rem", maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
              Every output is a single self-contained HTML file. Open it, share it, drop it in Slack — no logins, no exports, no waiting.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            {OUTPUTS.map((o, i) => (
              <div key={o.tag} className="card reveal-card" style={{
                transitionDelay: `${i * 0.07}s`,
                background: o.colorDim,
                border: `1px solid ${o.colorBorder}`,
                padding: "28px 24px",
                display: "flex", flexDirection: "column",
              }}>
                <div style={{ fontSize: "1.5rem", marginBottom: 14 }}>{o.icon}</div>
                <div style={{
                  display: "inline-block", alignSelf: "flex-start",
                  fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase",
                  color: o.color, border: `1px solid ${o.colorBorder}`,
                  borderRadius: 99, padding: "3px 10px", marginBottom: 14,
                }}>{o.tag}</div>
                <div style={{ fontWeight: 700, color: C.text, fontSize: "1rem", marginBottom: 8, lineHeight: 1.3 }}>{o.headline}</div>
                <p style={{ fontSize: "0.87rem", color: C.muted, margin: "0 0 14px", lineHeight: 1.65, flex: 1 }}>{o.desc}</p>
                <div style={{ fontSize: "0.72rem", color: o.color, fontWeight: 600, opacity: 0.8 }}>{o.who}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section
        ref={featuresRef.ref as React.RefObject<HTMLElement>}
        className={`reveal ${featuresRef.revealed ? "revealed" : ""}`}
        style={{ maxWidth: 1100, margin: "0 auto", padding: "100px 24px" }}
      >
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.accent, marginBottom: 14 }}>Under the hood</div>
          <h2 style={{ fontSize: "clamp(1.8rem, 3.2vw, 2.7rem)", fontWeight: 800, color: C.text, letterSpacing: "-1px", margin: "0 0 14px" }}>
            Designed to be ready when you are.
          </h2>
          <p style={{ color: C.muted, fontSize: "1rem", lineHeight: 1.7 }}>
            Every part of the architecture is built around one goal: zero wait time when you hit Generate.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
          {FEATURES.map((f, i) => (
            <div key={f.title} className="card reveal-card" style={{ transitionDelay: `${i * 0.06}s`, display: "flex", gap: 18, alignItems: "flex-start", padding: "22px 24px" }}>
              <span style={{ fontSize: "1.3rem", flexShrink: 0, color: f.color, marginTop: 1 }}>{f.icon}</span>
              <div>
                <div style={{ fontWeight: 700, color: C.text, marginBottom: 5, fontSize: "0.95rem" }}>{f.title}</div>
                <p style={{ fontSize: "0.86rem", color: C.muted, margin: 0, lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHO IT'S FOR ── */}
      <section style={{ background: `rgba(255,255,255,0.01)`, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "96px 24px", textAlign: "center" }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.accent, marginBottom: 14 }}>Who it&apos;s for</div>
          <h2 style={{ fontSize: "clamp(1.6rem, 2.8vw, 2.3rem)", fontWeight: 800, color: C.text, letterSpacing: "-0.5px", margin: "0 0 18px" }}>
            For the meetings where something real gets decided.
          </h2>
          <p style={{ color: C.muted, lineHeight: 1.85, fontSize: "1.05rem", maxWidth: 600, margin: "0 auto 48px" }}>
            Not every standup. The spec review. The architecture discussion.
            The session where a founder explains a product to an engineer for the first time.
            The kind of meeting where you want to leave with something in your hands.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            {[
              "Product Owners",
              "Engineering Leads",
              "CTOs & VPs Eng",
              "Founders",
              "Design Leads",
              "Technical PMs",
            ].map((role) => (
              <div key={role} style={{
                padding: "8px 18px", borderRadius: 99,
                background: C.accentDim, border: `1px solid ${C.accentBorder}`,
                fontSize: "0.84rem", color: C.accentBright, fontWeight: 500,
              }}>{role}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BYOK ── */}
      <section style={{ maxWidth: 860, margin: "0 auto", padding: "80px 24px 0" }}>
        <div style={{
          padding: "36px 44px",
          background: `linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(99,102,241,0.02) 100%)`,
          border: `1px solid ${C.accentBorder}`,
          borderRadius: 18,
          display: "grid", gridTemplateColumns: "auto 1fr", gap: 28, alignItems: "center",
        }} className="byok-grid">
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: C.accentDim, border: `1px solid ${C.accentBorder}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.5rem", flexShrink: 0,
          }}>🔑</div>
          <div>
            <div style={{ fontWeight: 800, color: C.text, fontSize: "1rem", marginBottom: 8 }}>
              Your keys. Your data. Always.
            </div>
            <p style={{ color: C.muted, margin: 0, lineHeight: 1.75, fontSize: "0.92rem" }}>
              Bring your <strong style={{ color: C.text }}>Claude key</strong> (topics, research, generation) and your <strong style={{ color: C.text }}>OpenAI key</strong> (Whisper transcription). Both stored locally in Chrome — never sent to our servers. A full 60-minute meeting costs a few cents.
            </p>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section
        id="pricing"
        ref={pricingRef.ref as React.RefObject<HTMLElement>}
        className={`reveal ${pricingRef.revealed ? "revealed" : ""}`}
        style={{ maxWidth: 860, margin: "0 auto", padding: "100px 24px" }}
      >
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.accent, marginBottom: 14 }}>Pricing</div>
          <h2 style={{ fontSize: "clamp(1.8rem, 3.2vw, 2.7rem)", fontWeight: 800, color: C.text, letterSpacing: "-1px", margin: "0 0 12px" }}>
            Free to build. A dollar to install.
          </h2>
          <p style={{ color: C.muted, fontSize: "1rem" }}>No subscription. No usage limits. No catch.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }} className="pricing-grid">

          <div className="card" style={{ padding: "36px 32px", display: "flex", flexDirection: "column" }}>
            <div style={{ fontWeight: 700, color: C.muted, fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 18 }}>Open Source</div>
            <div style={{ fontSize: "2.8rem", fontWeight: 800, color: C.text, letterSpacing: "-2px", marginBottom: 10 }}>Free</div>
            <p style={{ fontSize: "0.9rem", color: C.muted, marginBottom: 28, lineHeight: 1.65 }}>Clone, self-host, extend. MIT licensed. Use it commercially, fork it, make it yours.</p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              {["Full source code on GitHub", "Self-host the Next.js backend", "Build your own Chrome extension", "MIT — commercial use allowed"].map((item) => (
                <li key={item} style={{ display: "flex", gap: 10, color: C.muted, fontSize: "0.88rem", alignItems: "flex-start" }}>
                  <span style={{ color: C.accent, flexShrink: 0, marginTop: 1 }}>✓</span> {item}
                </li>
              ))}
            </ul>
            <a href="https://github.com/AishwaryShrivastav/decker" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
              Clone on GitHub →
            </a>
          </div>

          <div className="card" style={{
            padding: "36px 32px", display: "flex", flexDirection: "column",
            background: `linear-gradient(135deg, rgba(99,102,241,0.10) 0%, rgba(99,102,241,0.04) 100%)`,
            border: `1px solid ${C.accentBorder}`,
            position: "relative", overflow: "hidden",
            boxShadow: `0 0 0 1px rgba(99,102,241,0.15), 0 8px 32px rgba(99,102,241,0.08)`,
          }}>
            <div style={{
              position: "absolute", top: 16, right: 16,
              background: C.amber, color: "#000",
              fontSize: "0.6rem", fontWeight: 800, padding: "3px 10px", borderRadius: 99, letterSpacing: "0.06em",
            }}>RECOMMENDED</div>
            <div style={{ fontWeight: 700, color: C.accent, fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 18 }}>Chrome Extension</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: "2.8rem", fontWeight: 800, color: C.text, letterSpacing: "-2px" }}>$1</span>
              <span style={{ color: C.muted, fontSize: "0.88rem" }}>one-time</span>
            </div>
            <p style={{ fontSize: "0.85rem", color: C.muted, marginBottom: 28, lineHeight: 1.55 }}>Pay once. Use it in every meeting, forever. No renewal, no upsell.</p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              {["One-click install from Chrome Web Store", "Works in Chrome, Brave, Arc, Edge", "Current build forever, free updates", "No self-hosting, no build step"].map((item) => (
                <li key={item} style={{ display: "flex", gap: 10, color: C.text, fontSize: "0.88rem", alignItems: "flex-start" }}>
                  <span style={{ color: C.accent, flexShrink: 0, marginTop: 1 }}>✓</span> {item}
                </li>
              ))}
            </ul>
            <a href="https://chrome.google.com/webstore" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
              Install from Chrome Web Store — $1
            </a>
          </div>
        </div>
        <p style={{ textAlign: "center", color: C.dim, fontSize: "0.78rem", marginTop: 18, lineHeight: 1.6 }}>
          Both options require your own Claude + OpenAI keys. Keys stay in your browser — we never see them.
        </p>
      </section>

      {/* ── BROWSER SUPPORT ── */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 96px", textAlign: "center" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, color: C.muted, marginBottom: 24, letterSpacing: "0.02em" }}>Works in</h3>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          {[
            { name: "Chrome", icon: "🌐", live: true },
            { name: "Brave", icon: "🦁", live: true },
            { name: "Arc", icon: "◐", live: true },
            { name: "Edge", icon: "🔷", live: true },
            { name: "Firefox", icon: "🦊", live: false },
            { name: "Safari", icon: "🧭", live: false },
          ].map((b) => (
            <div key={b.name} style={{
              background: C.card, border: `1px solid ${b.live ? C.border : "transparent"}`,
              borderRadius: 99, padding: "8px 18px",
              fontSize: "0.85rem", color: b.live ? C.text : C.dim,
              display: "flex", alignItems: "center", gap: 8,
              opacity: b.live ? 1 : 0.45,
            }}>
              <span>{b.icon}</span>
              <span>{b.name}</span>
              {b.live
                ? <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.green, boxShadow: `0 0 5px ${C.green}` }} />
                : <span style={{ fontSize: "0.6rem", background: C.accentDim, color: C.accent, borderRadius: 99, padding: "2px 7px" }}>soon</span>}
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section
        ref={ctaRef.ref as React.RefObject<HTMLElement>}
        className={`reveal ${ctaRef.revealed ? "revealed" : ""}`}
        style={{
          padding: "120px 24px 140px",
          textAlign: "center",
          background: `radial-gradient(ellipse 70% 60% at 50% 50%, rgba(99,102,241,0.10) 0%, transparent 70%)`,
          borderTop: `1px solid ${C.border}`,
        }}
      >
        <div className="logo-float" style={{ marginBottom: 32 }}>
          <img src="/logo.png" alt="Decker" width={64} height={64} style={{ objectFit: "contain" }} />
        </div>
        <h2 style={{ fontSize: "clamp(2rem, 4.5vw, 3.2rem)", fontWeight: 800, margin: "0 0 16px", color: C.text, letterSpacing: "-1.5px", lineHeight: 1.1 }}>
          End your next meeting
          <br />
          <span style={{
            background: `linear-gradient(135deg, ${C.accent} 0%, ${C.violet} 100%)`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>with something shipped.</span>
        </h2>
        <p style={{ color: C.muted, marginBottom: 44, fontSize: "1.05rem", maxWidth: 440, margin: "0 auto 44px", lineHeight: 1.75 }}>
          Free to build. A dollar to install.
          No subscriptions. No follow-up required.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="https://chrome.google.com/webstore" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: "13px 28px", fontSize: "0.95rem" }}>
            Get Decker — $1
          </a>
          <a href="https://github.com/AishwaryShrivastav/decker" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: "13px 28px", fontSize: "0.95rem" }}>
            Self-host on GitHub ↗
          </a>
        </div>
        <p style={{ marginTop: 20, fontSize: "0.73rem", color: C.dim, letterSpacing: "0.03em" }}>
          MIT · BYOK · Chrome Extension · No backend
        </p>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        maxWidth: 1100, margin: "0 auto", padding: "24px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
        color: C.dim, fontSize: "0.8rem", borderTop: `1px solid ${C.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src="/logo.png" alt="Decker" width={18} height={18} style={{ objectFit: "contain", opacity: 0.4 }} />
          <span>© {new Date().getFullYear()} Decker — MIT License</span>
        </div>
        <div style={{ display: "flex", gap: 22 }}>
          <a href="https://github.com/AishwaryShrivastav/decker" style={{ color: C.accent, textDecoration: "none" }} target="_blank" rel="noopener noreferrer">GitHub ↗</a>
          <a href="https://github.com/AishwaryShrivastav/decker/issues" style={{ color: C.muted, textDecoration: "none" }} target="_blank" rel="noopener noreferrer">Issues</a>
          <a href="/demo" style={{ color: C.muted, textDecoration: "none" }}>Demo →</a>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; }

        /* Buttons */
        .btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          padding: 11px 22px; border-radius: 8px; font-size: 0.88rem; font-weight: 700;
          text-decoration: none; transition: all 0.18s; cursor: pointer; border: none;
          font-family: inherit; letter-spacing: 0.01em;
        }
        .btn-primary { background: ${C.accent}; color: ${C.bg}; }
        .btn-primary:hover { background: ${C.accentBright}; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(99,102,241,0.28); }
        .btn-secondary { background: transparent; color: ${C.text}; border: 1px solid ${C.border}; }
        .btn-secondary:hover { border-color: ${C.accent}; color: ${C.accent}; }

        /* Cards */
        .card {
          background: ${C.card}; border: 1px solid ${C.border}; border-radius: 14px; padding: 24px;
          transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
        }
        .card:hover {
          border-color: rgba(99,102,241,0.25);
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.35);
        }

        /* Nav links */
        .nav-link:hover { color: ${C.text} !important; }

        /* Fade in up — hero */
        .fade-up { animation: fadeInUp 0.65s ease both; }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:translateY(0); } }

        /* Reveal on scroll */
        .reveal { opacity: 0; transform: translateY(18px); transition: opacity 0.65s ease, transform 0.65s ease; }
        .reveal.revealed { opacity: 1; transform: translateY(0); }
        .reveal-card { opacity: 0; transform: translateY(14px); transition: opacity 0.5s ease, transform 0.5s ease, border-color 0.2s, box-shadow 0.2s; }
        .reveal.revealed .reveal-card { opacity: 1; transform: translateY(0); }

        /* Timeline */
        .timeline-line { display: block; }
        .timeline-item { opacity: 0; transform: translateY(12px); transition: opacity 0.45s ease, transform 0.45s ease; }
        .reveal.revealed .timeline-item { opacity: 1; transform: translateY(0); }

        /* Floating logo */
        .logo-float { animation: float 3.5s ease-in-out infinite; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)} }

        /* Responsive */
        @media (max-width: 760px) {
          .pricing-grid { grid-template-columns: 1fr !important; }
          .byok-grid { grid-template-columns: 1fr !important; }
          .timeline-line { display: none; }
          .timeline-item { grid-template-columns: 1fr !important; }
          .timeline-item > div:first-child { display: none; }
          .timeline-item > div:last-child { opacity: 1 !important; padding-left: 0 !important; }
        }
      `}</style>
    </main>
  );
}
