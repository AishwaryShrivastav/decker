import { Metadata } from "next";

const C = {
  bg: "#05111e",
  surface: "#071828",
  card: "#091f30",
  border: "rgba(255,255,255,0.06)",
  accent: "#1AADE4",
  accentBright: "#4DC8F0",
  accentBorder: "rgba(26,173,228,0.22)",
  text: "#e8f4fb",
  muted: "#5a8099",
};

const SUPPORT_EMAIL = "aishwaryshrivastava@gmail.com";
const MAILTO =
  "mailto:" +
  SUPPORT_EMAIL +
  "?subject=" +
  encodeURIComponent("Decker support request") +
  "&body=" +
  encodeURIComponent("Support request details:\n\nIssue:\n\nChrome version:\n\nMeet URL or environment:\n\nSteps to reproduce:\n");

export const metadata: Metadata = {
  title: "Support | Decker",
  description: "Get help with Decker installation, recording setup, a first meeting, or output generation.",
};

export default function SupportPage() {
  const checks = [
    "Chrome version and browser",
    "OpenAI key and active billing status",
    "Meet URL and permissions granted",
    "Transcript review sequence used",
    "Exact browser popup error text, if any",
  ];

  return (
    <main style={{ background: C.bg, color: C.text, fontFamily: "Inter, -apple-system, sans-serif", minHeight: "100vh" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap'); *, *::before, *::after { box-sizing: border-box; } body { margin: 0; }`}</style>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "80px 24px 100px" }}>
        <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", color: C.muted, fontSize: "0.84rem", marginBottom: 48 }}>
          <img src="/logo.png" alt="Decker" width={20} height={20} style={{ objectFit: "contain" }} />
          Decker
        </a>

        <div style={{ marginBottom: 12, fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.accent }}>Support</div>
        <h1 style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", fontWeight: 800, color: C.text, letterSpacing: "-1.5px", margin: "0 0 12px", lineHeight: 1.1 }}>Assisted setup and support</h1>
        <p style={{ color: C.muted, fontSize: "0.9rem", margin: "0 0 40px", lineHeight: 1.7 }}>
          Decker is public on the Chrome Web Store. Use this page for setup help, a first-meeting pilot, or troubleshooting.
        </p>

        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ padding: "24px", background: C.surface, border: `1px solid ${C.accentBorder}`, borderLeft: `3px solid ${C.accent}`, borderRadius: 12 }}>
            <h2 style={{ fontSize: "1.04rem", margin: "0 0 10px", color: C.text }}>Fastest way to get help</h2>
            <p style={{ color: C.muted, lineHeight: 1.72, fontSize: "0.93rem", margin: "0 0 16px" }}>
              Email support with your setup stage and the exact error text. Do not include an API key or private meeting content.
            </p>
            <a href={MAILTO} style={{ color: C.accentBright, textDecoration: "none", fontWeight: 600 }}>
              Email support
            </a>
            <p style={{ color: C.muted, margin: "14px 0 0", fontSize: "0.84rem" }}>
              Or use the public tracker: <a href="https://github.com/AishwaryShrivastav/decker/issues" style={{ color: C.accent }}>GitHub issues</a>
            </p>
          </div>

          <div style={{ padding: "24px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12 }}>
            <h2 style={{ fontSize: "1.04rem", margin: "0 0 12px", color: C.text }}>What to include</h2>
            <div style={{ display: "grid", gap: 10 }}>
              {checks.map((item) => (
                <p key={item} style={{ margin: 0, color: C.muted, fontSize: "0.9rem", display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span style={{ color: C.accent }}>-</span>
                    {item}
                  </p>
              ))}
            </div>
          </div>

          <div style={{ padding: "24px", background: C.surface, border: `1px solid ${C.accentBorder}`, borderRadius: 12 }}>
            <h2 style={{ fontSize: "1.04rem", margin: "0 0 10px", color: C.text }}>If you want an assisted pilot</h2>
            <p style={{ color: C.muted, lineHeight: 1.72, fontSize: "0.93rem", margin: 0 }}>
              Send a message with your target meeting window. We can help with installation, run one rehearsal, and review whether the generated artifact was useful.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
