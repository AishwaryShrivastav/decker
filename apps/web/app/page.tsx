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

// ── Docker-inspired palette ──────────────────────────────────────────────
const C = {
  blue:     "#2496ED",
  blueDark: "#1D63ED",
  navy:     "#003F8C",
  bg:       "#0C1B33",
  surface:  "#0F2241",
  card:     "#132952",
  border:   "#1A3566",
  text:     "#E8EDF5",
  muted:    "#7E9ABF",
  dim:      "#3A5278",
};

const FEATURES = [
  { icon: "🎙", title: "One-click recording",   desc: "Captures your Google Meet tab audio — no screen-share dialog, no installs." },
  { icon: "🐳", title: "Your key, your data",   desc: "Bring your own OpenAI key. Audio never touches our servers." },
  { icon: "🤖", title: "AI point extraction",   desc: "Extracts key topics automatically — you choose what goes in the deck." },
  { icon: "📦", title: "Containerised output",  desc: "Downloads a self-contained HTML presentation that runs anywhere, offline." },
  { icon: "🔓", title: "Open source & free",    desc: "MIT licensed. Inspect the code, self-host the API, or fork it." },
  { icon: "⚡", title: "Custom instructions",   desc: "Add your own prompt to steer the AI — action items, formal tone, etc." },
];

const STEPS = [
  { n: 1, title: "Record",   desc: "Click the Decker icon in the toolbar while in a Google Meet to start recording." },
  { n: 2, title: "Review",   desc: "AI transcribes audio and extracts discussion points — select what goes in the deck." },
  { n: 3, title: "Download", desc: "Click Generate Deck. A polished HTML presentation downloads in seconds." },
];

const BROWSERS = [
  { name: "Chrome", icon: "🌐", available: true },
  { name: "Brave",  icon: "🦁", available: true },
  { name: "Arc",    icon: "◐",  available: true },
  { name: "Edge",   icon: "🔷", available: true },
  { name: "Firefox",icon: "🦊", available: false },
  { name: "Zen",    icon: "◯",  available: false },
];

// ── Whale SVG logo ───────────────────────────────────────────────────────
function WhaleLogo({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="14" fill={C.blue} />
      {/* body */}
      <ellipse cx="34" cy="40" rx="18" ry="11" fill="white" />
      {/* head */}
      <circle cx="47" cy="37" r="7" fill="white" />
      {/* tail lobes */}
      <circle cx="14" cy="35" r="6" fill="white" />
      <circle cx="14" cy="46" r="6" fill="white" />
      <rect x="13" y="35" width="8" height="12" fill="white" />
      {/* spout */}
      <rect x="46" y="22" width="3" height="9" rx="1.5" fill="white" />
      <rect x="42" y="20" width="9" height="4" rx="2" fill="white" />
      {/* containers (3 slides on back) */}
      <rect x="24" y="28" width="8" height="7" rx="1" fill={C.blueDark} />
      <rect x="34" y="28" width="8" height="7" rx="1" fill={C.blueDark} />
      <rect x="44" y="29" width="6" height="6" rx="1" fill={C.blueDark} />
      {/* container detail lines */}
      <rect x="25" y="31" width="6" height="1" fill="white" opacity="0.6" />
      <rect x="35" y="31" width="6" height="1" fill="white" opacity="0.6" />
    </svg>
  );
}

export default function Home() {
  const [browser, setBrowser] = useState<Browser>("other");

  useEffect(() => {
    setBrowser(detectBrowser());
  }, []);

  const ctaBtn =
    browser === "chromium" ? (
      <a href="https://chrome.google.com/webstore" target="_blank" rel="noopener noreferrer"
        style={btn("primary")}>
        Add to Chrome — it&apos;s free
      </a>
    ) : browser === "firefox" ? (
      <a href="https://addons.mozilla.org" style={{ ...btn("primary"), opacity: 0.45, pointerEvents: "none" as const }}>
        Firefox — Coming Soon
      </a>
    ) : (
      <a href="https://github.com/AishwaryShrivastav/decker/releases" target="_blank" rel="noopener noreferrer"
        style={btn("secondary")}>
        Download ZIP
      </a>
    );

  return (
    <main style={{ margin: 0, background: C.bg, color: C.text, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif", lineHeight: 1.6 }}>

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav style={{ borderBottom: `1px solid ${C.border}`, padding: "0 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <WhaleLogo size={34} />
            <span style={{ fontWeight: 800, fontSize: "1.15rem", color: C.blue, letterSpacing: "-0.4px" }}>Decker</span>
          </div>
          <div style={{ display: "flex", gap: 20, fontSize: "0.85rem" }}>
            <a href="#how" style={{ color: C.muted, textDecoration: "none" }}>How it works</a>
            <a href="#features" style={{ color: C.muted, textDecoration: "none" }}>Features</a>
            <a href="https://github.com/AishwaryShrivastav/decker" target="_blank" rel="noopener noreferrer" style={{ color: C.blue, textDecoration: "none", fontWeight: 600 }}>GitHub ↗</a>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section style={{ padding: "90px 24px 80px", textAlign: "center", background: `radial-gradient(ellipse at 50% -10%, ${C.navy}88 0%, ${C.bg} 65%)` }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <WhaleLogo size={72} />
          </div>
          <h1 style={{ fontSize: "clamp(2rem,5vw,3.2rem)", fontWeight: 900, margin: "0 0 16px", letterSpacing: "-1.5px", color: C.text }}>
            Record a meeting.<br />
            <span style={{ color: C.blue }}>Ship a presentation.</span>
          </h1>
          <p style={{ fontSize: "1.15rem", color: C.muted, maxWidth: 520, margin: "0 auto 36px", lineHeight: 1.7 }}>
            Decker records your Google Meet tab, transcribes it with Whisper, extracts discussion points, and downloads a Reveal.js deck — all in one click.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" as const }}>
            {ctaBtn}
            <a href="https://github.com/AishwaryShrivastav/decker" target="_blank" rel="noopener noreferrer" style={btn("secondary")}>
              View on GitHub ↗
            </a>
          </div>
          <p style={{ marginTop: 18, fontSize: "0.78rem", color: C.dim }}>
            Open source · MIT licence · Bring your own API key
          </p>
        </div>
      </section>

      <div style={{ borderTop: `1px solid ${C.border}` }} />

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section id="how" style={{ maxWidth: 960, margin: "0 auto", padding: "72px 24px" }}>
        <h2 style={sectionTitle()}>How it works</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 24 }}>
          {STEPS.map((s) => (
            <div key={s.n} style={cardStyle()}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: `${C.blue}22`, border: `2px solid ${C.blue}`,
                color: C.blue, fontWeight: 800, fontSize: "1rem",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 14,
              }}>{s.n}</div>
              <div style={{ fontWeight: 700, color: C.text, marginBottom: 6 }}>{s.title}</div>
              <p style={{ fontSize: "0.88rem", color: C.muted, margin: 0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div style={{ borderTop: `1px solid ${C.border}` }} />

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section id="features" style={{ maxWidth: 960, margin: "0 auto", padding: "72px 24px" }}>
        <h2 style={sectionTitle()}>Why Decker</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 18 }}>
          {FEATURES.map((f) => (
            <div key={f.title} style={cardStyle()}>
              <div style={{ fontSize: "1.6rem", marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, color: C.text, marginBottom: 6, fontSize: "0.95rem" }}>{f.title}</div>
              <p style={{ fontSize: "0.84rem", color: C.muted, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div style={{ borderTop: `1px solid ${C.border}` }} />

      {/* ── Browsers ────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 960, margin: "0 auto", padding: "72px 24px", textAlign: "center" }}>
        <h2 style={sectionTitle()}>Supported browsers</h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const, justifyContent: "center" }}>
          {BROWSERS.map((b) => (
            <div key={b.name} style={{
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 100, padding: "9px 18px", fontSize: "0.88rem",
              color: b.available ? C.text : C.dim,
              display: "flex", alignItems: "center", gap: 7,
              opacity: b.available ? 1 : 0.5,
            }}>
              <span>{b.icon}</span>
              <span>{b.name}</span>
              {!b.available && (
                <span style={{ fontSize: "0.68rem", background: C.border, color: C.muted, borderRadius: 100, padding: "1px 7px" }}>soon</span>
              )}
            </div>
          ))}
        </div>
        <p style={{ color: C.dim, fontSize: "0.82rem", marginTop: 18 }}>
          All Chromium-based browsers supported today via Chrome Web Store.
        </p>
      </section>

      <div style={{ borderTop: `1px solid ${C.border}` }} />

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 960, margin: "0 auto", padding: "72px 24px", textAlign: "center" }}>
        <WhaleLogo size={48} />
        <h2 style={{ ...sectionTitle(), marginTop: 20, marginBottom: 10 }}>Ready to ship your first deck?</h2>
        <p style={{ color: C.muted, marginBottom: 32, fontSize: "0.95rem" }}>Free, open source, and takes 30 seconds to set up.</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" as const }}>
          {ctaBtn}
        </div>
      </section>

      <div style={{ borderTop: `1px solid ${C.border}` }} />

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer style={{ maxWidth: 960, margin: "0 auto", padding: "28px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 10, color: C.dim, fontSize: "0.82rem" }}>
        <span>© {new Date().getFullYear()} Decker — MIT License</span>
        <div style={{ display: "flex", gap: 20 }}>
          <a href="https://github.com/AishwaryShrivastav/decker" style={{ color: C.blue, textDecoration: "none" }} target="_blank" rel="noopener noreferrer">GitHub ↗</a>
          <a href="https://github.com/AishwaryShrivastav/decker/issues" style={{ color: C.muted, textDecoration: "none" }} target="_blank" rel="noopener noreferrer">Issues</a>
        </div>
      </footer>
    </main>
  );
}

function btn(variant: "primary" | "secondary"): React.CSSProperties {
  return {
    background:     variant === "primary" ? C.blue : "transparent",
    color:          variant === "primary" ? "#fff" : C.muted,
    border:         variant === "primary" ? "none" : `1px solid ${C.border}`,
    borderRadius:   10,
    padding:        "13px 26px",
    fontSize:       "0.95rem",
    fontWeight:     700,
    cursor:         "pointer",
    textDecoration: "none",
    display:        "inline-block",
    letterSpacing:  "0.1px",
  };
}

function sectionTitle(): React.CSSProperties {
  return { fontSize: "1.8rem", fontWeight: 800, textAlign: "center", marginBottom: 40, color: C.text, letterSpacing: "-0.5px" };
}

function cardStyle(): React.CSSProperties {
  return { background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 20px" };
}
