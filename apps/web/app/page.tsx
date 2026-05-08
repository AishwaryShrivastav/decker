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

// Colors derived from the Decker logo (ocean blue whale)
const C = {
  accent: "#1AADE4",
  accentBright: "#4DC8F0",
  accentDim: "rgba(26,173,228,0.10)",
  accentBorder: "rgba(26,173,228,0.22)",
  accentGlow: "rgba(26,173,228,0.18)",
  bg: "#05111e",
  surface: "#071828",
  card: "#091f30",
  border: "rgba(255,255,255,0.06)",
  text: "#e8f4fb",
  muted: "#5a8099",
  dim: "#1e3347",
  green: "#22d3a8",
  greenDim: "rgba(34,211,168,0.10)",
  greenBorder: "rgba(34,211,168,0.22)",
  teal: "#0dd4c4",
};

const OUTPUTS = [
  {
    tag: "Prototype",
    headline: "Your meeting described a product. This is it.",
    who: "Product owners, founders",
    desc: "Describe the feature on the call. Decker generates a working, interactive HTML app, tabs, forms, real flows. Show the team something clickable before you hang up.",
  },
  {
    tag: "Presentation",
    headline: "Your discussion, turned into a slide deck.",
    who: "Engineering leads, PMs",
    desc: "A self-contained HTML deck, keyboard navigable, no slide software needed. Drop it in Slack the moment the call ends.",
  },
  {
    tag: "Discussion SPA",
    headline: "The ideas from your call, turned into a website.",
    who: "Cross-functional reviews, stakeholders",
    desc: "Not notes. A real product brief site with a hero, sections, decisions, and insights. Something you would send to your whole org.",
  },
  {
    tag: "Meeting Brief",
    headline: "Decisions and actions, structured and ready.",
    who: "Any technical meeting",
    desc: "A dark-themed document with per-topic sections, key decisions highlighted, and a complete action item table. Readable in under two minutes.",
  },
];

const TIMELINE = [
  { time: "0:00", label: "Hit Record", sub: "One click in Chrome while you are live on Meet. Nothing else to configure.", side: "left" },
  { time: "0:16", label: "Transcript starts building", sub: "Whisper processes audio every 16 seconds. Topics appear in the popup as Claude listens.", side: "right" },
  { time: "0:32", label: "Select a topic, research starts", sub: "Check any topic and Claude Haiku researches it instantly, in the background, while the meeting continues.", side: "left" },
  { time: "ongoing", label: "Meeting continues, work runs in parallel", sub: "Topics refresh, research completes. Nothing interrupts your call.", side: "right" },
  { time: "end", label: "Hit Generate", sub: "Claude Sonnet builds the artifact using everything researched during the call. Research is already done.", side: "left" },
  { time: "+90s", label: "Share in chat before you hang up", sub: "Working prototype, slide deck, product brief. Drop the file in Slack before anyone closes their laptop.", side: "right" },
];

const FEATURES = [
  {
    title: "Live transcription",
    desc: "Whisper processes your audio every 16 seconds. The transcript builds while the meeting runs, nothing waits for the end.",
  },
  {
    title: "Parallel background research",
    desc: "Select a topic and Claude Haiku researches it immediately, in the background. By the time you hit Generate, the context is already there.",
  },
  {
    title: "Four artifact formats",
    desc: "Prototype, presentation, product SPA, or structured brief. Claude generates a complete self-contained HTML file for each one.",
  },
  {
    title: "Tab and mic capture",
    desc: "Captures everyone else through the Meet tab audio, captures you through the microphone. Mixed and transcribed together.",
  },
  {
    title: "State persists across opens",
    desc: "Close and reopen the popup during the call. Every topic and research result is exactly where you left it.",
  },
  {
    title: "Runs entirely in Chrome",
    desc: "No backend, no servers. Claude key for generation, OpenAI key for Whisper transcription, both stored locally in your browser.",
  },
];

function useScrollReveal(threshold = 0.06) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setRevealed(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, revealed };
}

const CHROME_STORE = "https://chrome.google.com/webstore";
const GITHUB = "https://github.com/AishwaryShrivastav/decker";

export default function Home() {
  const [browser, setBrowser] = useState<Browser>("other");
  const timelineRef = useScrollReveal(0.04);
  const outputsRef = useScrollReveal(0.04);
  const featuresRef = useScrollReveal(0.04);
  const pricingRef = useScrollReveal(0.04);
  const ctaRef = useScrollReveal(0.08);

  useEffect(() => { setBrowser(detectBrowser()); }, []);

  const isFirefox = browser === "firefox";

  return (
    <main style={{ background: C.bg, color: C.text, fontFamily: "Inter, -apple-system, sans-serif" }}>

      {/* NAV */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        backdropFilter: "blur(20px)",
        background: "rgba(5,17,30,0.88)",
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="#" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
            <img src="/logo.png" alt="Decker" width={26} height={26} style={{ objectFit: "contain" }} />
            <span style={{ fontWeight: 800, fontSize: "1.05rem", color: C.accent, letterSpacing: "-0.4px" }}>Decker</span>
          </a>
          <div style={{ display: "flex", gap: 28, alignItems: "center", fontSize: "0.84rem" }}>
            <a href="#how" style={{ color: C.muted, textDecoration: "none" }} className="nav-link">How it works</a>
            <a href="#outputs" style={{ color: C.muted, textDecoration: "none" }} className="nav-link">Outputs</a>
            <a href="#pricing" style={{ color: C.muted, textDecoration: "none" }} className="nav-link">Pricing</a>
            <a href={GITHUB} target="_blank" rel="noopener noreferrer" style={{ color: C.muted, textDecoration: "none" }} className="nav-link">GitHub</a>
            <a href={CHROME_STORE} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: "6px 14px", fontSize: "0.8rem" }}>
              Download Extension
            </a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        padding: "148px 24px 110px",
        minHeight: "92vh",
        display: "flex",
        alignItems: "center",
        background: `
          radial-gradient(ellipse 90% 55% at 50% -5%, rgba(26,173,228,0.14) 0%, transparent 55%),
          radial-gradient(ellipse 45% 35% at 85% 65%, rgba(13,212,196,0.06) 0%, transparent 50%),
          ${C.bg}`,
      }}>
        <div style={{ maxWidth: 760, margin: "0 auto", width: "100%", textAlign: "center" }}>

          <div className="fade-up" style={{ animationDelay: "0s" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: C.accentDim, border: `1px solid ${C.accentBorder}`,
              borderRadius: 99, padding: "5px 14px", marginBottom: 36,
              fontSize: "0.74rem", color: C.accentBright, fontWeight: 600, letterSpacing: "0.05em",
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.green, display: "inline-block", boxShadow: `0 0 6px ${C.green}` }} />
              Chrome Extension, works on Google Meet
            </div>
          </div>

          <h1 className="fade-up" style={{
            animationDelay: "0.08s",
            fontSize: "clamp(2.8rem, 6.5vw, 5rem)", fontWeight: 800,
            margin: "0 0 24px", letterSpacing: "-3px", lineHeight: 1.02, color: C.text,
          }}>
            Build the thing
            <br />
            <span style={{
              background: `linear-gradient(130deg, ${C.accent} 0%, ${C.teal} 60%, ${C.accentBright} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              before you hang up.
            </span>
          </h1>

          <p className="fade-up" style={{
            animationDelay: "0.16s",
            fontSize: "1.15rem", color: C.muted, maxWidth: 560, margin: "0 auto 44px", lineHeight: 1.8,
          }}>
            Record your meeting. Decker researches every topic in the background
            as you talk, then generates a working prototype, slide deck, or product
            brief from that conversation. Before the call ends.
          </p>

          <div className="fade-up" style={{ animationDelay: "0.22s" }}>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 14 }}>
              {isFirefox
                ? <span className="btn btn-primary" style={{ opacity: 0.45, cursor: "not-allowed" }}>Firefox, Coming Soon</span>
                : <a href={CHROME_STORE} target="_blank" rel="noopener noreferrer" className="btn btn-primary">Download Extension, Free</a>}
              <a href={GITHUB} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                Open Source on GitHub
              </a>
            </div>
            <p style={{ fontSize: "0.74rem", color: C.muted, margin: 0 }}>
              Firefox support coming soon
            </p>
          </div>

          <p className="fade-up" style={{ animationDelay: "0.28s", marginTop: 22, fontSize: "0.72rem", color: C.dim, letterSpacing: "0.02em" }}>
            MIT licensed, BYOK (Claude + OpenAI), no backend, your data never leaves your browser
          </p>
        </div>
      </section>

      {/* WHAT IT IS */}
      <section style={{ maxWidth: 820, margin: "0 auto", padding: "0 24px 100px" }}>
        <div style={{
          padding: "48px 52px",
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderLeft: `3px solid ${C.accent}`,
          borderRadius: 18,
        }}>
          <p style={{ fontSize: "clamp(1rem, 2vw, 1.22rem)", color: "#7ab8d4", lineHeight: 1.9, margin: "0 0 20px", fontWeight: 300 }}>
            Decker is not a meeting notes tool. It does not summarize your calls or send you a recap.
          </p>
          <p style={{ fontSize: "clamp(0.95rem, 1.7vw, 1.08rem)", color: C.text, lineHeight: 1.85, margin: 0, fontWeight: 400 }}>
            It takes your conversation and turns it into an artifact you can ship, share, or show.
            A working prototype of the feature you just spec&apos;d. A deck for the decision you just made.
            A product brief for the architecture you just designed.{" "}
            <span style={{ color: C.accentBright }}>Generated from your meeting, live, on the call.</span>
          </p>
        </div>
      </section>

      {/* TIMELINE */}
      <section
        id="how"
        ref={timelineRef.ref}
        className={`reveal ${timelineRef.revealed ? "revealed" : ""}`}
        style={{ maxWidth: 1000, margin: "0 auto", padding: "0 24px 110px" }}
      >
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.accent, marginBottom: 14 }}>How it works</div>
          <h2 style={{ fontSize: "clamp(1.8rem, 3.2vw, 2.6rem)", fontWeight: 800, color: C.text, letterSpacing: "-1px", margin: "0 0 14px" }}>
            The artifact builds while you talk.
          </h2>
          <p style={{ color: C.muted, fontSize: "1rem", maxWidth: 480, margin: "0 auto", lineHeight: 1.75 }}>
            By the time you hit Generate, the research is done, the transcript is complete,
            and Claude just needs to write.
          </p>
        </div>

        <div style={{ position: "relative" }}>
          <div className="timeline-spine" />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {TIMELINE.map((item, i) => (
              <div key={item.time} className="tl-row" style={{ transitionDelay: `${i * 0.08}s` }}>
                <div style={{ textAlign: "right", padding: "14px 28px 14px 0", opacity: item.side === "left" ? 1 : 0 }}>
                  {item.side === "left" && (
                    <div className="tl-card">
                      <div style={{ fontWeight: 700, color: C.text, marginBottom: 4, fontSize: "0.92rem" }}>{item.label}</div>
                      <div style={{ fontSize: "0.81rem", color: C.muted, lineHeight: 1.55 }}>{item.sub}</div>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, minWidth: 72 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: "50%",
                    background: C.card, border: `2px solid ${C.accentBorder}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: `0 0 10px ${C.accentGlow}`, zIndex: 1, flexShrink: 0,
                  }}>
                    <div style={{ width: 9, height: 9, borderRadius: "50%", background: C.accent }} />
                  </div>
                  <div style={{ fontSize: "0.6rem", fontFamily: "monospace", color: C.accent, fontWeight: 700, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{item.time}</div>
                </div>
                <div style={{ padding: "14px 0 14px 28px", opacity: item.side === "right" ? 1 : 0 }}>
                  {item.side === "right" && (
                    <div className="tl-card">
                      <div style={{ fontWeight: 700, color: C.text, marginBottom: 4, fontSize: "0.92rem" }}>{item.label}</div>
                      <div style={{ fontSize: "0.81rem", color: C.muted, lineHeight: 1.55 }}>{item.sub}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OUTPUTS */}
      <section
        id="outputs"
        ref={outputsRef.ref}
        className={`reveal ${outputsRef.revealed ? "revealed" : ""}`}
        style={{ background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "100px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <div style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.accent, marginBottom: 14 }}>Outputs</div>
            <h2 style={{ fontSize: "clamp(1.8rem, 3.2vw, 2.6rem)", fontWeight: 800, color: C.text, letterSpacing: "-1px", margin: "0 0 14px" }}>
              One meeting. Four kinds of artifact.
            </h2>
            <p style={{ color: C.muted, fontSize: "1rem", maxWidth: 500, margin: "0 auto", lineHeight: 1.75 }}>
              Every output is a single self-contained HTML file. Open it, share it, drop it in Slack.
              No logins, no exports, no waiting.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            {OUTPUTS.map((o, i) => (
              <div key={o.tag} className="card reveal-card" style={{
                transitionDelay: `${i * 0.07}s`,
                padding: "28px 24px",
                display: "flex", flexDirection: "column",
              }}>
                <div style={{
                  display: "inline-block", alignSelf: "flex-start",
                  fontSize: "0.63rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase",
                  color: C.accent, border: `1px solid ${C.accentBorder}`,
                  background: C.accentDim,
                  borderRadius: 6, padding: "3px 10px", marginBottom: 16,
                }}>{o.tag}</div>
                <div style={{ fontWeight: 700, color: C.text, fontSize: "0.97rem", marginBottom: 10, lineHeight: 1.4 }}>{o.headline}</div>
                <p style={{ fontSize: "0.86rem", color: C.muted, margin: "0 0 16px", lineHeight: 1.7, flex: 1 }}>{o.desc}</p>
                <div style={{ fontSize: "0.7rem", color: C.accentBright, fontWeight: 500 }}>{o.who}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section
        ref={featuresRef.ref}
        className={`reveal ${featuresRef.revealed ? "revealed" : ""}`}
        style={{ maxWidth: 1100, margin: "0 auto", padding: "100px 24px" }}
      >
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.accent, marginBottom: 14 }}>Under the hood</div>
          <h2 style={{ fontSize: "clamp(1.8rem, 3.2vw, 2.6rem)", fontWeight: 800, color: C.text, letterSpacing: "-1px", margin: "0 0 14px" }}>
            Designed to be ready when you are.
          </h2>
          <p style={{ color: C.muted, fontSize: "1rem", lineHeight: 1.75 }}>
            Every part of the pipeline runs in parallel so generation is instant the moment you ask for it.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
          {FEATURES.map((f, i) => (
            <div key={f.title} className="card reveal-card" style={{ transitionDelay: `${i * 0.06}s`, padding: "22px 24px" }}>
              <div style={{ fontWeight: 700, color: C.text, marginBottom: 6, fontSize: "0.93rem" }}>{f.title}</div>
              <p style={{ fontSize: "0.86rem", color: C.muted, margin: 0, lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section style={{ background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "96px 24px", textAlign: "center" }}>
          <div style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.accent, marginBottom: 14 }}>Who it&apos;s for</div>
          <h2 style={{ fontSize: "clamp(1.6rem, 2.8vw, 2.3rem)", fontWeight: 800, color: C.text, letterSpacing: "-0.5px", margin: "0 0 18px" }}>
            For the meetings where something real gets built.
          </h2>
          <p style={{ color: C.muted, lineHeight: 1.9, fontSize: "1.05rem", maxWidth: 600, margin: "0 auto 48px" }}>
            The spec review. The architecture call. The session where a founder walks an engineer through a product idea for the first time.
            The kind of meeting where you want to leave with something you can show someone.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            {["Product Owners", "Engineering Leads", "CTOs and VPs Eng", "Founders", "Design Leads", "Technical PMs"].map((role) => (
              <div key={role} style={{
                padding: "8px 18px", borderRadius: 99,
                background: C.accentDim, border: `1px solid ${C.accentBorder}`,
                fontSize: "0.84rem", color: C.accentBright, fontWeight: 500,
              }}>{role}</div>
            ))}
          </div>
        </div>
      </section>

      {/* BYOK */}
      <section style={{ maxWidth: 820, margin: "0 auto", padding: "80px 24px 0" }}>
        <div style={{
          padding: "36px 44px",
          background: C.surface,
          border: `1px solid ${C.accentBorder}`,
          borderRadius: 16,
          display: "grid", gridTemplateColumns: "auto 1fr", gap: 28, alignItems: "center",
        }} className="byok-grid">
          <div style={{
            width: 52, height: 52, borderRadius: 12,
            background: C.accentDim, border: `1px solid ${C.accentBorder}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <img src="/logo.png" alt="" width={28} height={28} style={{ objectFit: "contain", opacity: 0.85 }} />
          </div>
          <div>
            <div style={{ fontWeight: 800, color: C.text, fontSize: "0.98rem", marginBottom: 8 }}>
              Your keys. Your data. Always.
            </div>
            <p style={{ color: C.muted, margin: 0, lineHeight: 1.8, fontSize: "0.91rem" }}>
              Bring your Claude key (topics, research, generation) and your OpenAI key (Whisper transcription). Both stored locally in Chrome, never sent to our servers. A full 60-minute meeting costs a few cents.
            </p>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section
        id="pricing"
        ref={pricingRef.ref}
        className={`reveal ${pricingRef.revealed ? "revealed" : ""}`}
        style={{ maxWidth: 820, margin: "0 auto", padding: "96px 24px" }}
      >
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.accent, marginBottom: 14 }}>Pricing</div>
          <h2 style={{ fontSize: "clamp(1.8rem, 3.2vw, 2.6rem)", fontWeight: 800, color: C.text, letterSpacing: "-1px", margin: "0 0 12px" }}>
            Free to use. Open to build on.
          </h2>
          <p style={{ color: C.muted, fontSize: "1rem", lineHeight: 1.7 }}>Download the extension or self-host the whole thing. Both are free.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }} className="pricing-grid">

          <div className="card" style={{ padding: "36px 30px", display: "flex", flexDirection: "column" }}>
            <div style={{ fontWeight: 700, color: C.muted, fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 18 }}>Open Source</div>
            <div style={{ fontSize: "2.6rem", fontWeight: 800, color: C.text, letterSpacing: "-2px", marginBottom: 10 }}>Free</div>
            <p style={{ fontSize: "0.88rem", color: C.muted, marginBottom: 28, lineHeight: 1.7 }}>Clone, self-host, extend. MIT licensed. Use it commercially, fork it, make it yours.</p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              {["Full source code on GitHub", "Self-host the Next.js backend", "Build your own Chrome extension", "MIT, commercial use allowed"].map((item) => (
                <li key={item} style={{ display: "flex", gap: 10, color: C.muted, fontSize: "0.87rem", alignItems: "flex-start" }}>
                  <span style={{ color: C.accent, flexShrink: 0, marginTop: 1 }}>+</span> {item}
                </li>
              ))}
            </ul>
            <a href={GITHUB} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
              View on GitHub
            </a>
          </div>

          <div className="card card-featured" style={{
            padding: "36px 30px", display: "flex", flexDirection: "column",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ fontWeight: 700, color: C.accent, fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 18 }}>Chrome Extension</div>
            <div style={{ fontSize: "2.6rem", fontWeight: 800, color: C.text, letterSpacing: "-2px", marginBottom: 10 }}>Free</div>
            <p style={{ fontSize: "0.88rem", color: C.muted, marginBottom: 28, lineHeight: 1.7 }}>One-click install. No build step, no self-hosting. Works in Chrome, Brave, Arc, and Edge.</p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              {["One-click install from Chrome Web Store", "Works in Chrome, Brave, Arc, Edge", "No self-hosting or build step required", "Bring your own Claude and OpenAI keys"].map((item) => (
                <li key={item} style={{ display: "flex", gap: 10, color: C.text, fontSize: "0.87rem", alignItems: "flex-start" }}>
                  <span style={{ color: C.accent, flexShrink: 0, marginTop: 1 }}>+</span> {item}
                </li>
              ))}
            </ul>
            <a href={CHROME_STORE} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
              Download Extension
            </a>
            <p style={{ textAlign: "center", fontSize: "0.72rem", color: C.muted, marginTop: 10, marginBottom: 0 }}>
              Firefox support coming soon
            </p>
          </div>
        </div>
        <p style={{ textAlign: "center", color: C.dim, fontSize: "0.77rem", marginTop: 18, lineHeight: 1.7 }}>
          Both options require your own Claude and OpenAI keys. Keys stay in your browser, we never see them.
        </p>
      </section>

      {/* BROWSER SUPPORT */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 96px", textAlign: "center" }}>
        <p style={{ fontSize: "0.8rem", fontWeight: 600, color: C.muted, marginBottom: 20, letterSpacing: "0.04em" }}>Works in</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          {[
            { name: "Chrome", live: true },
            { name: "Brave", live: true },
            { name: "Arc", live: true },
            { name: "Edge", live: true },
            { name: "Firefox", live: false },
            { name: "Safari", live: false },
          ].map((b) => (
            <div key={b.name} style={{
              background: C.card, border: `1px solid ${b.live ? C.border : "transparent"}`,
              borderRadius: 8, padding: "7px 16px",
              fontSize: "0.83rem", color: b.live ? C.text : C.dim,
              display: "flex", alignItems: "center", gap: 8,
              opacity: b.live ? 1 : 0.4,
            }}>
              <span>{b.name}</span>
              {b.live
                ? <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.green, boxShadow: `0 0 5px ${C.green}` }} />
                : <span style={{ fontSize: "0.58rem", background: C.accentDim, color: C.accent, borderRadius: 4, padding: "2px 7px", fontWeight: 600 }}>soon</span>}
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section
        ref={ctaRef.ref}
        className={`reveal ${ctaRef.revealed ? "revealed" : ""}`}
        style={{
          padding: "120px 24px 140px",
          textAlign: "center",
          background: `radial-gradient(ellipse 70% 55% at 50% 50%, rgba(26,173,228,0.08) 0%, transparent 65%)`,
          borderTop: `1px solid ${C.border}`,
        }}
      >
        <div className="logo-float" style={{ marginBottom: 32 }}>
          <img src="/logo.png" alt="Decker" width={60} height={60} style={{ objectFit: "contain" }} />
        </div>
        <h2 style={{ fontSize: "clamp(2rem, 4.5vw, 3rem)", fontWeight: 800, margin: "0 0 18px", color: C.text, letterSpacing: "-1.5px", lineHeight: 1.12 }}>
          Turn your next big meeting
          <br />
          <span style={{
            background: `linear-gradient(130deg, ${C.accent} 0%, ${C.teal} 60%, ${C.accentBright} 100%)`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>into something you can ship.</span>
        </h2>
        <p style={{ color: C.muted, marginBottom: 44, fontSize: "1.05rem", maxWidth: 420, margin: "0 auto 44px", lineHeight: 1.8 }}>
          Free to download. Open source to self-host.
          No subscription, no follow-up required.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 14 }}>
          <a href={CHROME_STORE} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: "13px 28px", fontSize: "0.93rem" }}>
            Download Extension
          </a>
          <a href={GITHUB} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: "13px 28px", fontSize: "0.93rem" }}>
            View on GitHub
          </a>
        </div>
        <p style={{ fontSize: "0.72rem", color: C.muted, margin: 0 }}>Firefox support coming soon</p>
        <p style={{ marginTop: 10, fontSize: "0.7rem", color: C.dim, letterSpacing: "0.02em" }}>
          MIT, BYOK, Chrome Extension, no backend
        </p>
      </section>

      {/* FOOTER */}
      <footer style={{
        maxWidth: 1100, margin: "0 auto", padding: "22px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
        color: C.dim, fontSize: "0.79rem", borderTop: `1px solid ${C.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src="/logo.png" alt="Decker" width={16} height={16} style={{ objectFit: "contain", opacity: 0.35 }} />
          <span>Decker, MIT License</span>
        </div>
        <div style={{ display: "flex", gap: 22 }}>
          <a href={GITHUB} style={{ color: C.accent, textDecoration: "none" }} target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href={`${GITHUB}/issues`} style={{ color: C.muted, textDecoration: "none" }} target="_blank" rel="noopener noreferrer">Issues</a>
          <a href="/demo" style={{ color: C.muted, textDecoration: "none" }}>Demo</a>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; }

        .btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          padding: 11px 22px; border-radius: 8px; font-size: 0.87rem; font-weight: 700;
          text-decoration: none; transition: all 0.17s; cursor: pointer; border: none;
          font-family: inherit; letter-spacing: 0.01em;
        }
        .btn-primary { background: ${C.accent}; color: #05111e; }
        .btn-primary:hover { background: ${C.accentBright}; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(26,173,228,0.28); }
        .btn-secondary { background: transparent; color: ${C.text}; border: 1px solid ${C.border}; }
        .btn-secondary:hover { border-color: ${C.accentBorder}; color: ${C.accent}; }

        .card {
          background: ${C.card}; border: 1px solid ${C.border}; border-radius: 12px; padding: 22px;
          transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
        }
        .card:hover { border-color: ${C.accentBorder}; transform: translateY(-2px); box-shadow: 0 10px 36px rgba(0,0,0,0.4); }
        .card-featured {
          background: linear-gradient(135deg, rgba(26,173,228,0.09) 0%, rgba(26,173,228,0.03) 100%);
          border-color: ${C.accentBorder};
          box-shadow: 0 0 0 1px rgba(26,173,228,0.12);
        }
        .card-featured:hover { box-shadow: 0 0 0 1px rgba(26,173,228,0.25), 0 10px 36px rgba(26,173,228,0.10); }

        .nav-link:hover { color: ${C.text} !important; }

        .fade-up { animation: fadeInUp 0.65s ease both; }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:translateY(0); } }

        .reveal { opacity: 0; transform: translateY(16px); transition: opacity 0.6s ease, transform 0.6s ease; }
        .reveal.revealed { opacity: 1; transform: translateY(0); }
        .reveal-card { opacity: 0; transform: translateY(12px); transition: opacity 0.5s ease, transform 0.5s ease, border-color 0.2s, box-shadow 0.2s; }
        .reveal.revealed .reveal-card { opacity: 1; transform: translateY(0); }

        /* Timeline */
        .timeline-spine {
          position: absolute; left: 50%; top: 20px; bottom: 20px; width: 1px;
          background: linear-gradient(180deg, transparent 0%, ${C.accentBorder} 8%, ${C.accentBorder} 92%, transparent 100%);
          transform: translateX(-50%);
        }
        .tl-row {
          display: grid; grid-template-columns: 1fr 72px 1fr; align-items: center;
          opacity: 0; transform: translateY(10px);
          transition: opacity 0.45s ease, transform 0.45s ease;
        }
        .reveal.revealed .tl-row { opacity: 1; transform: translateY(0); }
        .tl-card {
          display: inline-block; padding: 14px 18px;
          background: ${C.card}; border: 1px solid ${C.border}; border-radius: 10px;
        }

        .logo-float { animation: float 3.5s ease-in-out infinite; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }

        @media (max-width: 720px) {
          .pricing-grid { grid-template-columns: 1fr !important; }
          .byok-grid { grid-template-columns: 1fr !important; }
          .timeline-spine { display: none; }
          .tl-row { grid-template-columns: 1fr !important; }
          .tl-row > div:first-child { display: none; }
          .tl-row > div:last-child { opacity: 1 !important; padding-left: 0 !important; }
        }
      `}</style>
    </main>
  );
}
