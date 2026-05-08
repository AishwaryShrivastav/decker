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
  accent: "#1AADE4",
  accentBright: "#4DC8F0",
  accentDim: "rgba(26,173,228,0.10)",
  accentBorder: "rgba(26,173,228,0.22)",
  accentGlow: "rgba(26,173,228,0.16)",
  teal: "#0DD4C4",
  bg: "#05111e",
  surface: "#071828",
  card: "#091f30",
  border: "rgba(255,255,255,0.06)",
  text: "#e8f4fb",
  muted: "#5a8099",
  dim: "#1e3347",
  green: "#22d3a8",
};

const OUTPUTS = [
  {
    tag: "Prototype",
    headline: "A working product, not a mockup.",
    desc: "Clickable, interactive HTML built from what you described on the call.",
    who: "Product owners, founders",
  },
  {
    tag: "Presentation",
    headline: "A deck without the slide software.",
    desc: "Self-contained HTML, keyboard navigable, share as a single file.",
    who: "Engineering leads, PMs",
  },
  {
    tag: "Discussion SPA",
    headline: "A website about what you just decided.",
    desc: "Hero, sections, decisions, insights, a brief your whole org can read.",
    who: "Stakeholder reviews",
  },
  {
    tag: "Meeting Brief",
    headline: "Decisions and actions, structured.",
    desc: "Per-topic sections, key decisions highlighted, full action item table.",
    who: "Any technical meeting",
  },
];

const TIMELINE = [
  { time: "0:00",     label: "Hit Record",                    sub: "One click in Chrome while you're live on Meet.",                        side: "left" },
  { time: "0:16",     label: "Topics appear",                 sub: "Claude extracts discussion points from the live transcript.",            side: "right" },
  { time: "0:32",     label: "Select a topic, research runs", sub: "Haiku researches it in the background the moment you check it.",         side: "left" },
  { time: "ongoing",  label: "Meeting continues",             sub: "Topics refresh. Research completes. Nothing interrupts the call.",       side: "right" },
  { time: "end",      label: "Hit Generate",                  sub: "Sonnet builds the artifact. The research is already done.",              side: "left" },
  { time: "+90s",     label: "Share before you hang up",      sub: "Drop the file in Slack while everyone is still on the call.",           side: "right" },
];

const FEATURES = [
  { title: "Live transcription",        desc: "Whisper processes audio every 16 seconds. The transcript builds as you talk." },
  { title: "Parallel research",         desc: "Select a topic and Haiku researches it immediately, while the meeting runs." },
  { title: "Four artifact formats",     desc: "Prototype, deck, SPA, or brief. One self-contained HTML file, every time." },
  { title: "Tab and mic capture",       desc: "Captures the Meet tab audio and your mic. Mixed and transcribed together." },
  { title: "State persists",            desc: "Close and reopen the popup anytime. Topics and research are still there." },
  { title: "Runs entirely in Chrome",   desc: "No backend, no servers. Keys stored locally. Nothing leaves your browser." },
];

const TECH = ["Claude Haiku", "Claude Sonnet", "OpenAI Whisper"];

function useReveal(threshold = 0.06) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setOn(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, on };
}

const CHROME = "https://chrome.google.com/webstore";
const GITHUB = "https://github.com/AishwaryShrivastav/decker";

export default function Home() {
  const [browser, setBrowser] = useState<Browser>("other");
  const tlRef    = useReveal(0.04);
  const outRef   = useReveal(0.04);
  const featRef  = useReveal(0.04);
  const ctaRef   = useReveal(0.08);

  useEffect(() => { setBrowser(detectBrowser()); }, []);

  return (
    <main style={{ background: C.bg, color: C.text, fontFamily: "Inter, -apple-system, sans-serif" }}>

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, backdropFilter: "blur(20px)", background: "rgba(5,17,30,0.88)", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="#" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <img src="/logo.png" alt="Decker" width={24} height={24} style={{ objectFit: "contain" }} />
            <span style={{ fontWeight: 800, fontSize: "1rem", color: C.accent, letterSpacing: "-0.4px" }}>Decker</span>
          </a>
          <div style={{ display: "flex", gap: 24, alignItems: "center", fontSize: "0.83rem" }}>
            <a href="#how"     style={{ color: C.muted, textDecoration: "none" }} className="nav-link">How it works</a>
            <a href="#outputs" style={{ color: C.muted, textDecoration: "none" }} className="nav-link">Outputs</a>
            <a href={GITHUB}   target="_blank" rel="noopener noreferrer" style={{ color: C.muted, textDecoration: "none" }} className="nav-link">GitHub</a>
            <a href={CHROME}   target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: "6px 14px", fontSize: "0.79rem" }}>Add to Chrome</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        padding: "148px 24px 110px", minHeight: "90vh", display: "flex", alignItems: "center",
        background: `radial-gradient(ellipse 90% 55% at 50% -5%, rgba(26,173,228,0.13) 0%, transparent 55%), ${C.bg}`,
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>

          <div className="fu" style={{ animationDelay: "0s" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.accentDim, border: `1px solid ${C.accentBorder}`, borderRadius: 99, padding: "5px 14px", marginBottom: 32, fontSize: "0.73rem", color: C.accentBright, fontWeight: 600, letterSpacing: "0.05em" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.green, display: "inline-block", boxShadow: `0 0 5px ${C.green}` }} />
              Chrome Extension, Google Meet
            </div>
          </div>

          <h1 className="fu" style={{ animationDelay: "0.08s", fontSize: "clamp(2.8rem, 6.5vw, 5rem)", fontWeight: 800, margin: "0 0 22px", letterSpacing: "-3px", lineHeight: 1.02 }}>
            Build the thing
            <br />
            <span style={{ background: `linear-gradient(130deg, ${C.accent} 0%, ${C.teal} 60%, ${C.accentBright} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              before you hang up.
            </span>
          </h1>

          <p className="fu" style={{ animationDelay: "0.14s", fontSize: "1.1rem", color: C.muted, maxWidth: 520, margin: "0 auto 40px", lineHeight: 1.8 }}>
            Record your meeting. Decker researches every topic in the background while you talk,
            then generates a working prototype, deck, or product brief before the call ends.
          </p>

          <div className="fu" style={{ animationDelay: "0.2s" }}>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 12 }}>
              {browser === "firefox"
                ? <span className="btn btn-primary" style={{ opacity: 0.4, cursor: "not-allowed" }}>Add to Chrome</span>
                : <a href={CHROME} target="_blank" rel="noopener noreferrer" className="btn btn-primary">Add to Chrome, Free</a>}
              <a href={GITHUB} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">Open Source on GitHub</a>
            </div>
            <p style={{ fontSize: "0.72rem", color: C.muted, margin: 0 }}>Firefox coming soon</p>
          </div>

          <p className="fu" style={{ animationDelay: "0.26s", marginTop: 20, fontSize: "0.7rem", color: C.dim }}>
            MIT licensed, BYOK, no backend, your data never leaves your browser
          </p>
        </div>
      </section>

      {/* WHAT IT IS */}
      <section style={{ maxWidth: 780, margin: "0 auto", padding: "0 24px 96px" }}>
        <div style={{ padding: "40px 48px", background: C.surface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.accent}`, borderRadius: 16 }}>
          <p style={{ fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.accent, margin: "0 0 14px" }}>Not a note-taker</p>
          <p style={{ fontSize: "clamp(1rem, 2vw, 1.2rem)", color: C.text, lineHeight: 1.85, margin: 0, fontWeight: 400 }}>
            Decker turns your conversation into an artifact you can ship, show, or share.
            A working prototype of the feature you just spec&apos;d. A deck for the decision you just made.
            Generated from your meeting, live, on the call.
          </p>
        </div>
      </section>

      {/* TIMELINE */}
      <section id="how" ref={tlRef.ref} className={`rv ${tlRef.on ? "on" : ""}`} style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px 110px" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.accent, margin: "0 0 12px" }}>How it works</p>
          <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)", fontWeight: 800, color: C.text, letterSpacing: "-1px", margin: "0 0 12px" }}>
            The artifact builds while you talk.
          </h2>
          <p style={{ color: C.muted, fontSize: "0.95rem", maxWidth: 420, margin: "0 auto", lineHeight: 1.7 }}>
            By the time you hit Generate, the research is done.
          </p>
        </div>

        <div style={{ position: "relative" }}>
          <div className="tl-spine" />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {TIMELINE.map((item, i) => (
              <div key={item.time} className="tl-row" style={{ display: "grid", gridTemplateColumns: "1fr 68px 1fr", alignItems: "center", transitionDelay: `${i * 0.07}s` }}>
                <div style={{ textAlign: "right", padding: "12px 24px 12px 0", opacity: item.side === "left" ? 1 : 0 }}>
                  {item.side === "left" && <div className="tl-card"><div style={{ fontWeight: 700, color: C.text, marginBottom: 3, fontSize: "0.88rem" }}>{item.label}</div><div style={{ fontSize: "0.78rem", color: C.muted, lineHeight: 1.5 }}>{item.sub}</div></div>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.card, border: `2px solid ${C.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 10px ${C.accentGlow}`, zIndex: 1 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.accent }} />
                  </div>
                  <div style={{ fontSize: "0.58rem", fontFamily: "monospace", color: C.accent, fontWeight: 700, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{item.time}</div>
                </div>
                <div style={{ padding: "12px 0 12px 24px", opacity: item.side === "right" ? 1 : 0 }}>
                  {item.side === "right" && <div className="tl-card"><div style={{ fontWeight: 700, color: C.text, marginBottom: 3, fontSize: "0.88rem" }}>{item.label}</div><div style={{ fontSize: "0.78rem", color: C.muted, lineHeight: 1.5 }}>{item.sub}</div></div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OUTPUTS */}
      <section id="outputs" ref={outRef.ref} className={`rv ${outRef.on ? "on" : ""}`} style={{ background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "96px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.accent, margin: "0 0 12px" }}>Outputs</p>
            <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)", fontWeight: 800, color: C.text, letterSpacing: "-1px", margin: "0 0 12px" }}>
              One meeting. Four kinds of artifact.
            </h2>
            <p style={{ color: C.muted, fontSize: "0.95rem", maxWidth: 420, margin: "0 auto" }}>
              Every output is a self-contained HTML file. Open it, share it, drop it in Slack.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 14 }}>
            {OUTPUTS.map((o, i) => (
              <div key={o.tag} className="card rv-card" style={{ transitionDelay: `${i * 0.07}s`, padding: "26px 22px", display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: C.accent, border: `1px solid ${C.accentBorder}`, background: C.accentDim, borderRadius: 5, padding: "3px 9px", marginBottom: 14, alignSelf: "flex-start" }}>{o.tag}</div>
                <div style={{ fontWeight: 700, color: C.text, fontSize: "0.94rem", marginBottom: 8, lineHeight: 1.35 }}>{o.headline}</div>
                <p style={{ fontSize: "0.84rem", color: C.muted, margin: "0 0 14px", lineHeight: 1.65, flex: 1 }}>{o.desc}</p>
                <div style={{ fontSize: "0.69rem", color: C.accentBright, fontWeight: 500 }}>{o.who}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section ref={featRef.ref} className={`rv ${featRef.on ? "on" : ""}`} style={{ maxWidth: 1100, margin: "0 auto", padding: "96px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.accent, margin: "0 0 12px" }}>Under the hood</p>
          <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)", fontWeight: 800, color: C.text, letterSpacing: "-1px", margin: "0 0 12px" }}>
            Ready the moment you generate.
          </h2>
          <p style={{ color: C.muted, fontSize: "0.95rem", lineHeight: 1.7 }}>
            Every part of the pipeline runs in parallel so there is no wait at the end.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
          {FEATURES.map((f, i) => (
            <div key={f.title} className="card rv-card" style={{ transitionDelay: `${i * 0.05}s`, padding: "20px 22px" }}>
              <div style={{ fontWeight: 700, color: C.text, marginBottom: 5, fontSize: "0.9rem" }}>{f.title}</div>
              <p style={{ fontSize: "0.84rem", color: C.muted, margin: 0, lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section style={{ background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "88px 24px", textAlign: "center" }}>
          <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.accent, margin: "0 0 12px" }}>Who it&apos;s for</p>
          <h2 style={{ fontSize: "clamp(1.6rem, 2.8vw, 2.2rem)", fontWeight: 800, color: C.text, letterSpacing: "-0.5px", margin: "0 0 16px" }}>
            For the meetings where something real gets built.
          </h2>
          <p style={{ color: C.muted, fontSize: "1rem", maxWidth: 520, margin: "0 auto 40px", lineHeight: 1.8 }}>
            The spec review. The architecture call. The session where you walk an engineer through a product idea for the first time. The meeting where you want to leave with something in your hands.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            {["Product Owners", "Engineering Leads", "CTOs and VPs Eng", "Founders", "Design Leads", "Technical PMs"].map((r) => (
              <div key={r} style={{ padding: "7px 16px", borderRadius: 99, background: C.accentDim, border: `1px solid ${C.accentBorder}`, fontSize: "0.82rem", color: C.accentBright, fontWeight: 500 }}>{r}</div>
            ))}
          </div>
        </div>
      </section>

      {/* BYOK */}
      <section style={{ maxWidth: 780, margin: "0 auto", padding: "72px 24px 0" }}>
        <div style={{ padding: "36px 44px", background: C.surface, border: `1px solid ${C.accentBorder}`, borderRadius: 16 }}>
          <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.accent, margin: "0 0 10px" }}>Bring Your Own Keys</p>
          <p style={{ fontSize: "1rem", fontWeight: 700, color: C.text, margin: "0 0 10px" }}>Your keys. Your data. Always.</p>
          <p style={{ color: C.muted, margin: "0 0 20px", lineHeight: 1.75, fontSize: "0.9rem" }}>
            Decker uses your own API keys, stored locally in Chrome. Nothing is sent to our servers. A full 60-minute meeting costs a few cents.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {TECH.map((t) => (
              <div key={t} style={{ padding: "5px 12px", background: C.accentDim, border: `1px solid ${C.accentBorder}`, borderRadius: 6, fontSize: "0.76rem", color: C.accentBright, fontWeight: 600 }}>{t}</div>
            ))}
          </div>
        </div>
      </section>

      {/* BROWSER SUPPORT */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 88px", textAlign: "center" }}>
        <p style={{ fontSize: "0.75rem", fontWeight: 600, color: C.muted, marginBottom: 18, letterSpacing: "0.04em" }}>Works in</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          {[{ name: "Chrome", live: true }, { name: "Brave", live: true }, { name: "Arc", live: true }, { name: "Edge", live: true }, { name: "Firefox", live: false }, { name: "Safari", live: false }].map((b) => (
            <div key={b.name} style={{ background: C.card, border: `1px solid ${b.live ? C.border : "transparent"}`, borderRadius: 7, padding: "6px 14px", fontSize: "0.81rem", color: b.live ? C.text : C.dim, display: "flex", alignItems: "center", gap: 7, opacity: b.live ? 1 : 0.38 }}>
              {b.name}
              {b.live
                ? <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.green, boxShadow: `0 0 4px ${C.green}` }} />
                : <span style={{ fontSize: "0.56rem", background: C.accentDim, color: C.accent, borderRadius: 4, padding: "2px 6px", fontWeight: 600 }}>soon</span>}
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section ref={ctaRef.ref} className={`rv ${ctaRef.on ? "on" : ""}`} style={{ padding: "112px 24px 128px", textAlign: "center", background: `radial-gradient(ellipse 65% 55% at 50% 50%, rgba(26,173,228,0.08) 0%, transparent 65%)`, borderTop: `1px solid ${C.border}` }}>
        <div className="logo-float" style={{ marginBottom: 28 }}>
          <img src="/logo.png" alt="Decker" width={56} height={56} style={{ objectFit: "contain" }} />
        </div>
        <h2 style={{ fontSize: "clamp(1.9rem, 4.5vw, 3rem)", fontWeight: 800, margin: "0 0 16px", color: C.text, letterSpacing: "-1.5px", lineHeight: 1.1 }}>
          Turn your next meeting
          <br />
          <span style={{ background: `linear-gradient(130deg, ${C.accent} 0%, ${C.teal} 60%, ${C.accentBright} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            into something you can ship.
          </span>
        </h2>
        <p style={{ color: C.muted, fontSize: "1rem", maxWidth: 360, margin: "0 auto 40px", lineHeight: 1.75 }}>
          Free to download. Open source. No subscription.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 12 }}>
          <a href={CHROME} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: "12px 26px", fontSize: "0.92rem" }}>Add to Chrome, Free</a>
          <a href={GITHUB} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: "12px 26px", fontSize: "0.92rem" }}>View on GitHub</a>
        </div>
        <p style={{ fontSize: "0.71rem", color: C.muted, margin: 0 }}>Firefox coming soon</p>
      </section>

      {/* FOOTER */}
      <footer style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, color: C.dim, fontSize: "0.78rem", borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <img src="/logo.png" alt="" width={15} height={15} style={{ objectFit: "contain", opacity: 0.3 }} />
          <span>Decker, MIT License</span>
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          <a href={GITHUB} style={{ color: C.accent, textDecoration: "none" }} target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href={`${GITHUB}/issues`} style={{ color: C.muted, textDecoration: "none" }} target="_blank" rel="noopener noreferrer">Issues</a>
          <a href="/privacy" style={{ color: C.muted, textDecoration: "none" }}>Privacy Policy</a>
          <a href="/demo" style={{ color: C.muted, textDecoration: "none" }}>Demo</a>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; }

        .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 20px; border-radius: 8px; font-size: 0.86rem; font-weight: 700; text-decoration: none; transition: all 0.17s; cursor: pointer; border: none; font-family: inherit; }
        .btn-primary { background: ${C.accent}; color: #05111e; }
        .btn-primary:hover { background: ${C.accentBright}; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(26,173,228,0.28); }
        .btn-secondary { background: transparent; color: ${C.text}; border: 1px solid ${C.border}; }
        .btn-secondary:hover { border-color: ${C.accentBorder}; color: ${C.accent}; }

        .card { background: ${C.card}; border: 1px solid ${C.border}; border-radius: 11px; padding: 22px; transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s; }
        .card:hover { border-color: ${C.accentBorder}; transform: translateY(-2px); box-shadow: 0 10px 36px rgba(0,0,0,0.4); }
        .card-feat { background: linear-gradient(135deg, rgba(26,173,228,0.08) 0%, rgba(26,173,228,0.02) 100%); border-color: ${C.accentBorder}; }
        .card-feat:hover { box-shadow: 0 10px 36px rgba(26,173,228,0.10); }

        .nav-link:hover { color: ${C.text} !important; }

        .fu { animation: fadeUp 0.6s ease both; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }

        .rv { opacity: 0; transform: translateY(14px); transition: opacity 0.55s ease, transform 0.55s ease; }
        .rv.on { opacity: 1; transform: translateY(0); }
        .rv-card { opacity: 0; transform: translateY(10px); transition: opacity 0.45s ease, transform 0.45s ease, border-color 0.2s, box-shadow 0.2s; }
        .rv.on .rv-card { opacity: 1; transform: translateY(0); }

        .tl-spine { position: absolute; left: 50%; top: 16px; bottom: 16px; width: 1px; background: linear-gradient(180deg, transparent 0%, ${C.accentBorder} 8%, ${C.accentBorder} 92%, transparent 100%); transform: translateX(-50%); }
        .tl-row { opacity: 0; transform: translateY(8px); transition: opacity 0.4s ease, transform 0.4s ease; }
        .rv.on .tl-row { opacity: 1; transform: translateY(0); }
        .tl-card { display: inline-block; padding: 12px 16px; background: ${C.card}; border: 1px solid ${C.border}; border-radius: 9px; }

        .logo-float { animation: float 3.5s ease-in-out infinite; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }

        @media (max-width: 680px) {
          .tl-spine { display: none; }
          .tl-row { grid-template-columns: 1fr !important; }
          .tl-row > div:first-child { display: none; }
          .tl-row > div:last-child { opacity: 1 !important; padding-left: 0 !important; }
        }
      `}</style>
    </main>
  );
}
