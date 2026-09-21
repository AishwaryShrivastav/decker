export const metadata = {
  title: "Privacy Policy | Decker",
  description: "How Decker validates OpenAI or Gemini keys, processes meeting content, deletes temporary Gemini audio files, and stores recovery data locally.",
  alternates: { canonical: "/privacy" },
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
      title: "Provider connection and validation",
      body: "You choose OpenAI or Gemini and supply your own API key. Before Decker saves the key, it sends live capability probes to that provider for both text models and audio transcription. The text probes contain a single period. The audio probe is a generated silent WAV file. These checks can use provider quota and appear in provider logs. Requests use HTTPS and go directly from the extension to the selected provider. Decker does not send the key to its developer."
    },
    {
      title: "Recording and direct processing",
      body: "When you click Start Recording, Decker captures audio from the active eligible browser tab. It can mix in your microphone after you grant permission. Muted tabs and tabs with no recent audio remain eligible, so Decker shows a warning and checks the captured track and audio signal after recording starts. Native meeting apps cannot be captured by this browser extension. Audio segments go directly to the selected provider for transcription. Transcript text, selected topics, instructions, and generated topic context go to the same provider for text processing. Provider charges or quota use may apply."
    },
    {
      title: "Gemini temporary audio files",
      body: "Gemini transcription requires each audio segment to be uploaded as a temporary Gemini file. Decker asks Gemini to process that file with storage disabled, then waits for the file deletion request before it finishes the transcription step. A failed deletion is retried up to three times. If all three attempts fail, Decker keeps the transcript and adds a warning with the Gemini file name to the local recovery session and review page. Decker cannot promise that Google deleted a file when Gemini returns a cleanup error. The same upload and awaited deletion flow runs for the silent validation audio."
    },
    {
      title: "OpenAI and provider retention",
      body: "OpenAI receives audio through its transcription API and receives text through its chat-completions API. Gemini receives temporary uploaded audio through its Files and Interactions APIs and receives text through its generation API. Provider processing, logs, and retention follow the terms and account controls for the provider you select. Decker cannot delete content already sent to OpenAI. For Gemini audio, Decker can report only whether the deletion request succeeded or failed."
    },
    {
      title: "What stays on your device",
      body: "The selected provider and API key are saved in chrome.storage.local without Chrome Sync. Decker also stores up to 15 recent debug events and four timestamps for key saved, recording started, transcript ready, and output generated. Logs can include topic text, warnings, and provider error details. One recovery session is stored in local IndexedDB. It can contain pending audio segments, transcript text, selected topics, instructions, edits, warnings, topic context, and generated HTML. A pending segment is removed after transcription succeeds or after three failed transcription attempts. A new or reset session replaces the recovery record. Decker adds no separate encryption to this local data."
    },
    {
      title: "Local deletion and downloads",
      body: "Clear key removes the saved provider setting and any migrated OpenAI key. Resetting or starting a session replaces the IndexedDB recovery record. Uninstalling removes extension storage, including logs and recovery data. Generated HTML files stay in Downloads until you delete them. Copy HTML writes the output to the clipboard. These actions do not erase provider records, downloaded files, or clipboard history. Revoke a key in the provider account when needed."
    },
    {
      title: "What the developer receives",
      body: "The extension sends no audio, transcript, prompt, API key, or automatic meeting-content telemetry to the Decker developer. No Decker account is required. If you email support or request a pilot, the developer receives your email address and message. GitHub issues are public. Remove sensitive content from logs before sharing them, and never send an API key."
    },
    {
      title: "Website and generated HTML",
      body: "The website host receives ordinary request data, including IP address and browser details. The pages request Google Fonts. The checked-in site has no analytics integration, though hosting logs depend on the operator's configuration. This repository contains separate web API routes that the extension does not call. A deployed route can receive content submitted directly to it. Generated HTML can load external fonts, scripts, styles, or other resources and can contain executable code. Review each file before opening or sharing it."
    },
    {
      title: "Permissions and recording limits",
      body: "Decker uses tabCapture for user-initiated tab audio, offscreen for the recorder, storage for local settings and recovery support, activeTab to inspect and capture the selected tab, and downloads for HTML exports. Persistent host access is limited to the OpenAI and Gemini API origins. Microphone access uses a separate browser permission. Browser and organization policies can block installation, capture, microphones, or provider traffic. Tell participants which provider will process the meeting and obtain any required consent before recording."
    },
    {
      title: "Contact",
      body: "For privacy questions, email aish@techforgood.studio. For public bug reports, use github.com/AishwaryShrivastav/decker/issues. Only include information you intend to share."
    }
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
          Last updated: September 21, 2026
        </p>

        <div style={{ padding: "24px 28px", background: C.surface, border: `1px solid ${C.accentBorder}`, borderLeft: `3px solid ${C.accent}`, borderRadius: 12, marginBottom: 48 }}>
          <p style={{ color: C.text, fontSize: "1rem", lineHeight: 1.8, margin: 0, fontWeight: 500 }}>
            Connect OpenAI or Gemini with your own key. Decker sends meeting content directly to that provider, keeps one recovery session on your device, and sends no automatic meeting-content telemetry to the developer.
          </p>
        </div>

        <p style={{ marginBottom: 36 }}>
          <a href="https://developers.openai.com/api/docs/guides/your-data" style={{ color: C.accent }}>OpenAI API data controls</a>
          <span style={{ color: C.dim, margin: "0 10px" }}>|</span>
          <a href="https://ai.google.dev/gemini-api/terms" style={{ color: C.accent }}>Gemini API terms</a>
        </p>
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
