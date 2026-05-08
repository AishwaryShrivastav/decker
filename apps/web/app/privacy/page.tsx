export const metadata = {
  title: "Privacy Policy — Decker",
  description: "Decker privacy policy. No data collection, no servers, BYOK.",
};

const C = {
  bg: "#05111e",
  surface: "#071828",
  card: "#091f30",
  border: "rgba(255,255,255,0.06)",
  accent: "#1AADE4",
  accentBorder: "rgba(26,173,228,0.22)",
  text: "#e8f4fb",
  muted: "#5a8099",
  dim: "#1e3347",
};

export default function PrivacyPolicy() {
  const sections = [
    {
      title: "No data collection",
      body: "Decker does not collect, store, transmit, or have access to any of your data. We have no servers, no database, and no analytics. There is nothing to collect.",
    },
    {
      title: "API keys",
      body: "Decker requires you to provide your own Anthropic (Claude) and OpenAI (Whisper) API keys. These keys are stored exclusively in Chrome's local extension storage (chrome.storage.local) on your device. They are never transmitted to Decker or any server operated by us.",
    },
    {
      title: "Audio and transcripts",
      body: "Audio recorded during a meeting is processed entirely on your device and sent directly from your browser to OpenAI's Whisper API using your own API key. Transcripts and generated HTML artifacts are kept in memory during your session and never leave your browser except to the AI APIs you have chosen to use.",
    },
    {
      title: "Third-party APIs",
      body: "When you use Decker, your audio is sent to OpenAI (Whisper) and your transcript is sent to Anthropic (Claude) for processing. These transmissions use your own API keys and are governed by OpenAI's and Anthropic's respective privacy policies. Decker has no visibility into these requests.",
    },
    {
      title: "Permissions",
      body: "Decker requests the following Chrome permissions: tabCapture (to record the active Meet tab), tabs (to identify the active tab URL), storage (to save your API keys locally), activeTab (to interact with the active tab), offscreen (to run the audio recorder), and downloads (to save the generated HTML file). Host permissions for meet.google.com, api.openai.com, and api.anthropic.com are required to record Meet and call the AI APIs directly from the extension.",
    },
    {
      title: "Open source",
      body: "Decker is fully open source under the MIT license. You can inspect every line of code at github.com/AishwaryShrivastav/decker. If you have any questions about what the extension does, reading the source is the most authoritative answer.",
    },
    {
      title: "Contact",
      body: "Questions or concerns about this policy can be raised as a GitHub issue at github.com/AishwaryShrivastav/decker/issues.",
    },
  ];

  return (
    <main style={{ background: C.bg, color: C.text, fontFamily: "Inter, -apple-system, sans-serif", minHeight: "100vh" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap'); *, *::before, *::after { box-sizing: border-box; } body { margin: 0; }`}</style>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "80px 24px 100px" }}>
        <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", color: C.muted, fontSize: "0.84rem", marginBottom: 48 }}>
          <img src="/logo.png" alt="Decker" width={20} height={20} style={{ objectFit: "contain" }} />
          Decker
        </a>

        <div style={{ marginBottom: 12, fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.accent }}>
          Legal
        </div>
        <h1 style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", fontWeight: 800, color: C.text, letterSpacing: "-1.5px", margin: "0 0 12px", lineHeight: 1.1 }}>
          Privacy Policy
        </h1>
        <p style={{ color: C.muted, fontSize: "0.9rem", margin: "0 0 56px" }}>
          Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>

        <div style={{ padding: "24px 28px", background: C.surface, border: `1px solid ${C.accentBorder}`, borderLeft: `3px solid ${C.accent}`, borderRadius: 12, marginBottom: 48 }}>
          <p style={{ color: C.text, fontSize: "1rem", lineHeight: 1.8, margin: 0, fontWeight: 500 }}>
            Decker does not collect any personal data. It runs entirely in your browser using your own API keys. Nothing is sent to our servers because we have no servers.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
          {sections.map((s) => (
            <div key={s.title} style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 36 }}>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: C.text, margin: "0 0 12px", letterSpacing: "-0.3px" }}>{s.title}</h2>
              <p style={{ color: C.muted, lineHeight: 1.8, margin: 0, fontSize: "0.93rem" }}>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
