'use client';

import { useEffect, useState, useRef } from "react";

const C = {
  accent: "#1AADE4",
  accentBright: "#4DC8F0",
  accentDim: "rgba(26,173,228,0.12)",
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

const CLOSING_SLIDES = [
  {
    title: "Objective",
    desc: "What the conversation was meant to resolve.",
  },
  {
    title: "Agreed decisions",
    desc: "Only claims the room confirmed by the end of the call.",
  },
  {
    title: "In scope",
    desc: "What will be delivered now.",
  },
  {
    title: "Out of scope",
    desc: "What you explicitly did not agree to do yet.",
  },
  {
    title: "Open items + owners",
    desc: "What still needs confirmation, with owners and next steps.",
  },
];

const TIMELINE = [
  {
    time: "1. PREP",
    label: "Agree on scope in the room",
    sub: "Tell the room that the final review will use a closing deck with decisions and owners.",
  },
  {
    time: "2. RECORD",
    label: "Decker captures Google Meet audio",
    sub: "Tab audio and approved mic audio are sent to OpenAI for transcription.",
  },
  {
    time: "3. REVIEW",
    label: "Review transcript and select points",
    sub: "Keep only statements you want in the artifact. Mark uncertainty instead of inventing details.",
  },
  {
    time: "4. PRESENT",
    label: "Generate the closing deck",
    sub: "Choose Presentation and add any instructions the room needs for its final review.",
  },
  {
    time: "5. SHARE",
    label: "Hand off the artifact",
    sub: "Open the generated HTML, read it once together, then share the file.",
  },
];

const OUTPUTS = [
  {
    tag: "Other outputs",
    headline: "Prototype, discussion page, or meeting brief",
    desc: "Use these only after the close if the room needs a different artifact.",
    who: "For follow-up work and stakeholder sharing.",
  },
];

const TECH = ["OpenAI Whisper", "GPT-4o mini", "GPT-4o", "IndexedDB recovery"];

const RECRUITER_STEPS = [
  {
    title: "Assisted pilot",
    desc: "We help install, run a short rehearsal, and walk through one real meeting.",
  },
  {
    title: "Clear data handling",
    desc: "We explain what goes to OpenAI and what stays on your machine before the first call.",
  },
  {
    title: "Handoff test",
    desc: "You test presenting the final deck and sharing it with the room after the call.",
  },
];

function useReveal(threshold = 0.06) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setOn(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, on };
}

const EARLY_ACCESS_MAIL =
  "mailto:aishwaryshrivastava@gmail.com?subject=Decker%20assisted%20pilot&body=Hi%20there%2C%20I%20want%20to%20join%20the%20assisted%20pilot.%20%0A%0AUse%20case%3A%20%0AScheduled%20meeting%20URL%20or%20time%3A%20%0A%0AThank%20you.";
const SUPPORT_ROUTE = "/support";
const GITHUB = "https://github.com/AishwaryShrivastav/decker";

export default function Home() {
  const tlRef = useReveal(0.04);
  const outRef = useReveal(0.04);
  const featRef = useReveal(0.04);
  const ctaRef = useReveal(0.08);

  return (
    <main style={{ background: C.bg, color: C.text, fontFamily: "Inter, -apple-system, sans-serif" }}>
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, backdropFilter: "blur(20px)", background: "rgba(5,17,30,0.88)", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="#" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <img src="/logo.png" alt="Decker" width={24} height={24} style={{ objectFit: "contain" }} />
            <span style={{ fontWeight: 800, fontSize: "1rem", color: C.accent, letterSpacing: "-0.4px" }}>Decker</span>
          </a>
          <div style={{ display: "flex", gap: 24, alignItems: "center", fontSize: "0.83rem" }}>
            <a href="#closing" style={{ color: C.muted, textDecoration: "none" }} className="nav-link">Closing deck</a>
            <a href="#how" style={{ color: C.muted, textDecoration: "none" }} className="nav-link">How it works</a>
            <a href={SUPPORT_ROUTE} style={{ color: C.muted, textDecoration: "none" }} className="nav-link">Support</a>
            <a href={EARLY_ACCESS_MAIL} className="btn btn-primary" style={{ padding: "6px 14px", fontSize: "0.79rem" }}>Request assisted pilot</a>
          </div>
        </div>
      </nav>

      <section style={{
        padding: "148px 24px 104px",
        minHeight: "90vh",
        display: "flex",
        alignItems: "center",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", width: "100%", display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 38, alignItems: "center" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(34,211,168,0.14)", border: `1px solid rgba(34,211,168,0.22)`, borderRadius: 99, padding: "5px 14px", marginBottom: 24, fontSize: "0.73rem", color: "#86efac", fontWeight: 600, letterSpacing: "0.05em" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.green, display: "inline-block", boxShadow: `0 0 5px ${C.green}` }} />
              Chrome Web Store submission: In review
            </div>

            <h1 style={{ fontSize: "clamp(2.6rem, 6vw, 4.8rem)", fontWeight: 800, margin: "0 0 18px", letterSpacing: "-3px", lineHeight: 1.02 }}>
              Turn your Google Meet call into a deck everyone can act on.
            </h1>
            <p style={{ fontSize: "1.05rem", color: C.muted, maxWidth: 560, margin: "0 0 28px", lineHeight: 1.82 }}>
              Decker captures the conversation, lets you review transcript details, and produces a closing deck with objective, agreements, scope boundaries, and owners.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
              <a href={EARLY_ACCESS_MAIL} className="btn btn-primary">Request assisted pilot</a>
              <a href="#closing" className="btn btn-secondary">See what gets generated</a>
            </div>
            <p style={{ fontSize: "0.72rem", color: C.muted, margin: 0 }}>
              Not in the Web Store yet. Early access is assisted during the review period.
            </p>
          </div>

          <div style={{ border: `1px solid ${C.border}`, borderRadius: 16, background: C.surface, padding: 20, boxShadow: `0 20px 80px ${C.accentGlow}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, marginBottom: 18 }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.accent }}>Close in 5 slides</span>
              <span style={{ fontSize: "0.7rem", color: C.muted }}>Browser recording. Your API key.</span>
            </div>
            <img src="/images/hero.png" alt="Decker interface" style={{ width: "100%", borderRadius: 10, border: `1px solid ${C.border}` }} />
            <p style={{ marginTop: 14, color: C.dim, fontSize: "0.76rem" }}>
              This is the current Decker interface. Open the sample below to inspect an example output.
            </p>
          </div>
        </div>
      </section>

      <section id="closing" style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 106px" }}>
        <div style={{ padding: "40px", background: C.surface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.accent}` }}>
          <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.accent, margin: "0 0 12px" }}>Closing deck structure</p>
          <p style={{ fontSize: "clamp(1rem, 2vw, 1.24rem)", color: C.text, lineHeight: 1.7, margin: 0, fontWeight: 400 }}>
            We keep the artifact around the action. Before you stop recording, set a simple expectation: the meeting will end by confirming these five sections.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginTop: 24 }}>
            {CLOSING_SLIDES.map((slide, i) => (
              <div key={slide.title} className="card" style={{ padding: "16px 16px" }}>
                <div style={{ fontSize: "0.64rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.accent, marginBottom: 10 }}>
                  {`0${i + 1}. ${slide.title}`}
                </div>
                <p style={{ color: C.text, fontWeight: 600, margin: "0 0 8px", lineHeight: 1.4 }}>{slide.title}</p>
                <p style={{ fontSize: "0.84rem", color: C.muted, margin: 0, lineHeight: 1.6 }}>{slide.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" ref={tlRef.ref} className={`rv ${tlRef.on ? "on" : ""}`} style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px 102px" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.accent, margin: "0 0 12px" }}>How it works</p>
          <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)", fontWeight: 800, color: C.text, letterSpacing: "-1px", margin: "0 0 12px" }}>
            Start the call. Capture. Review. Present.
          </h2>
          <p style={{ color: C.muted, fontSize: "0.95rem", maxWidth: 420, margin: "0 auto", lineHeight: 1.7 }}>
            The host sets quality upfront, then review before sharing.
          </p>
        </div>

        <div style={{ position: "relative" }}>
          <div className="tl-spine" />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {TIMELINE.map((item, i) => (
              <div key={item.time} className="tl-row" style={{ display: "grid", gridTemplateColumns: "1fr 68px 1fr", alignItems: "center", transitionDelay: `${i * 0.07}s` }}>
                <div style={{ textAlign: "right", padding: "12px 24px 12px 0", opacity: 1 }}>
                  <div className="tl-card">
                    <div style={{ fontWeight: 700, color: C.text, marginBottom: 3, fontSize: "0.88rem" }}>{item.label}</div>
                    <div style={{ fontSize: "0.78rem", color: C.muted, lineHeight: 1.5 }}>{item.time}</div>
                    <div style={{ fontSize: "0.78rem", color: C.muted, lineHeight: 1.5 }}>{item.sub}</div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.card, border: `2px solid ${C.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 10px ${C.accentGlow}`, zIndex: 1 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.accent }} />
                  </div>
                </div>
                <div />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="outputs" ref={outRef.ref} className={`rv ${outRef.on ? "on" : ""}`} style={{ background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "96px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.accent, margin: "0 0 12px" }}>Output</p>
            <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)", fontWeight: 800, color: C.text, letterSpacing: "-1px", margin: "0 0 12px" }}>
              Start with a closing deck
            </h2>
          </div>
          <div style={{ display: "grid", gap: 14 }}>
            <div className="card rv-card" style={{ borderColor: C.accentBorder, padding: "28px", background: `linear-gradient(160deg, ${C.card} 0%, #092238 100%)`, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(130deg, rgba(26,173,228,0.12), transparent 45%)", pointerEvents: "none" }} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: C.accent, border: `1px solid ${C.accentBorder}`, background: C.accentDim, borderRadius: 5, padding: "3px 9px" }}>Primary</div>
                  <div style={{ color: C.text, fontWeight: 700 }}>Closing deck</div>
                </div>
                <div style={{ fontWeight: 700, color: C.text, fontSize: "1.06rem", lineHeight: 1.4, marginBottom: 10 }}>Actionable decisions and owners from the meeting.</div>
                <p style={{ fontSize: "0.89rem", color: C.muted, margin: 0, lineHeight: 1.65, maxWidth: 640 }}>
                  Generate an HTML slide deck with explicit agreed statements, boundaries, and follow-ups. The room can review it before you leave and then act on the same artifact after the call.
                </p>
                <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <a href="/demo" className="btn btn-secondary" style={{ padding: "8px 12px", fontSize: "0.8rem" }}>View sample deck</a>
                  <a href="#pilot" className="btn btn-secondary" style={{ padding: "8px 12px", fontSize: "0.8rem" }}>See assisted pilot</a>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 14 }}>
              {OUTPUTS.map((o, i) => (
                <div key={o.tag} className="card rv-card" style={{ transitionDelay: `${i * 0.07}s`, padding: "24px 22px", display: "flex", flexDirection: "column" }}>
                  <div style={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: C.accent, border: `1px solid ${C.accentBorder}`, background: C.accentDim, borderRadius: 5, padding: "3px 9px", marginBottom: 14, alignSelf: "flex-start" }}>{o.tag}</div>
                  <div style={{ fontWeight: 700, color: C.text, fontSize: "0.94rem", marginBottom: 8, lineHeight: 1.35 }}>{o.headline}</div>
                  <p style={{ fontSize: "0.84rem", color: C.muted, margin: "0 0 14px", lineHeight: 1.65, flex: 1 }}>{o.desc}</p>
                  <div style={{ fontSize: "0.69rem", color: C.accentBright, fontWeight: 500 }}>{o.who}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="pilot" ref={featRef.ref} className={`rv ${featRef.on ? "on" : ""}`} style={{ maxWidth: 1100, margin: "0 auto", padding: "96px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.accent, margin: "0 0 12px" }}>Assisted pilot</p>
          <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)", fontWeight: 800, color: C.text, letterSpacing: "-1px", margin: "0 0 12px" }}>
            Try Decker on one real call with setup support.
          </h2>
          <p style={{ color: C.muted, fontSize: "0.95rem", maxWidth: 520, margin: "0 auto" }}>
            If your review is blocked by store approval timing, we will set up and test one live meeting with you.
          </p>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          {RECRUITER_STEPS.map((step, i) => (
            <div key={step.title} className="card rv-card" style={{ display: "flex", gap: 12, alignItems: "center", padding: "18px 20px", transitionDelay: `${i * 0.08}s` }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: C.accentDim, border: `1px solid ${C.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: C.accent }}>{i + 1}</div>
              <div>
                <div style={{ fontWeight: 700, color: C.text }}>{step.title}</div>
                <div style={{ color: C.muted, fontSize: "0.85rem", lineHeight: 1.6 }}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 22, fontSize: "0.86rem", color: C.muted }}>
          <p style={{ marginBottom: 10 }}>
            <strong style={{ color: C.text }}>What we expect:</strong> a meeting scheduled within 10 days and a 20-minute follow-up review.
          </p>
          <p style={{ margin: 0 }}>Need onboarding instead of email? We also offer assisted unpacked installation while store review is pending.</p>
        </div>
      </section>

      <section style={{ maxWidth: 780, margin: "0 auto", padding: "0 24px 24px" }}>
        <div style={{ padding: "36px 44px", background: C.surface, border: `1px solid ${C.accentBorder}`, borderRadius: 16 }}>
          <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.accent, margin: "0 0 10px" }}>Your own API key</p>
          <p style={{ fontSize: "1rem", fontWeight: 700, color: C.text, margin: "0 0 10px" }}>No subscription. OpenAI key required.</p>
          <p style={{ color: C.muted, margin: "0 0 20px", lineHeight: 1.75, fontSize: "0.9rem" }}>
            Audio, transcript, selected points, and instructions are sent from your browser to OpenAI using your key. Decker does not build a user profile or send meeting content to the developer.
          </p>
          <p style={{ color: C.muted, fontSize: "0.85rem", lineHeight: 1.7 }}>
            Browser policy, OpenAI policy, and meeting rules can affect install, microphone access, or API calls. Obtain participant consent before recording.
            {" "}
            <a href="/privacy" style={{ color: C.accent }}>Read the privacy policy</a>.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            {TECH.map((t) => (
              <div key={t} style={{ padding: "5px 12px", background: C.accentDim, border: `1px solid ${C.accentBorder}`, borderRadius: 6, fontSize: "0.76rem", color: C.accentBright, fontWeight: 600 }}>{t}</div>
            ))}
          </div>
        </div>
      </section>

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

      <section ref={ctaRef.ref} className={`rv ${ctaRef.on ? "on" : ""}`} style={{ padding: "96px 24px 128px", textAlign: "center", borderTop: `1px solid ${C.border}`, background: `radial-gradient(ellipse 65% 55% at 50% 50%, rgba(26,173,228,0.08) 0%, transparent 65%)` }}>
        <div className="logo-float" style={{ marginBottom: 28 }}>
          <img src="/logo.png" alt="Decker" width={56} height={56} style={{ objectFit: "contain" }} />
        </div>
        <h2 style={{ fontSize: "clamp(1.9rem, 4.5vw, 3rem)", fontWeight: 800, margin: "0 0 16px", color: C.text, letterSpacing: "-1.5px", lineHeight: 1.1 }}>
          Build the close.
          <br />
          <span style={{ background: `linear-gradient(130deg, ${C.accent} 0%, ${C.teal} 60%, ${C.accentBright} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            Your conversation, your decisions.
          </span>
        </h2>
        <p style={{ color: C.muted, fontSize: "1rem", maxWidth: 430, margin: "0 auto 32px", lineHeight: 1.75 }}>
          Not available in the store yet. Use the assisted pilot to start in live meetings now.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 12 }}>
          <a href={EARLY_ACCESS_MAIL} className="btn btn-primary" style={{ padding: "12px 26px", fontSize: "0.92rem" }}>Request assisted pilot</a>
          <a href={SUPPORT_ROUTE} className="btn btn-secondary" style={{ padding: "12px 26px", fontSize: "0.92rem" }}>Need support?</a>
        </div>
        <p style={{ fontSize: "0.71rem", color: C.muted, margin: 0 }}>No subscription. No usage analytics in Decker.</p>
      </section>

      <footer style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, color: C.dim, fontSize: "0.78rem", borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <img src="/logo.png" alt="" width={15} height={15} style={{ objectFit: "contain", opacity: 0.3 }} />
          <span>Decker, MIT License</span>
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          <a href={GITHUB} style={{ color: C.accent, textDecoration: "none" }} target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href={`${GITHUB}/issues`} style={{ color: C.muted, textDecoration: "none" }} target="_blank" rel="noopener noreferrer">Issues</a>
          <a href="/privacy" style={{ color: C.muted, textDecoration: "none" }}>Privacy</a>
          <a href={SUPPORT_ROUTE} style={{ color: C.muted, textDecoration: "none" }}>Support</a>
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

        @media (max-width: 1040px) {
          section > div[style*='grid-template-columns: "1.15fr 0.85fr"'] { grid-template-columns: 1fr !important; }
        }

        @media (max-width: 680px) {
          .tl-spine { display: none; }
          .tl-row { grid-template-columns: 1fr !important; }
          .tl-row > div:first-child { display: none; }
          .tl-row > div:last-child { opacity: 1 !important; padding-left: 0 !important; }
          h1 { letter-spacing: -2px !important; }
        }
      `}</style>
    </main>
  );
}
