export const metadata = {
  title: "Privacy Policy | Decker",
  description: "How Decker sends meeting content to OpenAI, stores data locally, and handles website and support requests.",
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
      title: "Recording and OpenAI processing",
      body: "When you click Start Recording, Decker captures the active Google Meet tab audio and, if microphone access is available, mixes in your voice. Audio chunks are sent directly from your browser to OpenAI for transcription while recording, with a final segment after you stop. Transcript content, selected topics, your instructions, and generated research context are sent to OpenAI for topic summaries and document generation. Requests use HTTPS and your own OpenAI API key. OpenAI receives this content and your key; API usage is billed to your OpenAI account."
    },
    {
      title: "What stays on your device",
      body: "Your API key, a rolling log of up to 15 debug events, and four activation timestamps are saved in Chrome's local extension storage, without Chrome sync. The timestamps record when a key was saved, recording started, a transcript became ready, and an output was generated. They contain no meeting content and stay on your device unless you choose to include their labels in a feedback email. Decker does not add its own encryption to local storage. Logs can include selected topic text and API error responses. Decker also stores one recovery session in local IndexedDB. It can include pending audio segments, transcript text, selected topics, instructions, edits, warnings, research results, and generated HTML. Pending audio is removed after transcription succeeds or exhausts three attempts. Starting over or starting another recording replaces the saved session. This recovery record is not a complete recording archive."
    },
    {
      title: "Downloads and deletion",
      body: "Generated HTML files are saved to your Downloads folder and remain until you delete them. The Copy HTML action writes the output to your clipboard. To remove a saved key, clear the key field and click Save key. Uninstalling the extension removes its local storage, including debug logs; it does not delete downloaded files, clipboard history, or data already sent to OpenAI. Revoke a key through your OpenAI account if you need to stop its use."
    },
    {
      title: "What the developer receives",
      body: "The extension's recording and generation pipeline sends no audio, transcripts, prompts, API keys, or automatic telemetry to the Decker developer. There is no Decker account requirement. If you email us for a pilot or support, we receive your email address and whatever you send. Public GitHub issues are visible to others. Review logs and remove sensitive content before sharing them; never send an API key."
    },
    {
      title: "Website and separate web APIs",
      body: "Visiting this website sends ordinary request information, such as your IP address and browser details, to the website host. Pages load Google Fonts, which sends font requests to Google. The checked-in website code has no analytics integration; hosting logs and their retention depend on the operator's configuration. The repository also contains separate web API routes for audio and text processing. The Chrome extension does not call them. If you call those routes on a deployment, its operator receives the submitted content and any API key in the request, and forwards processing requests to OpenAI or Anthropic depending on the route. This differs from the extension's direct-to-OpenAI flow."
    },
    {
      title: "External resources in outputs",
      body: "Downloaded or opened HTML can request external fonts, scripts, styles, or other resources. The meeting document template uses Google Fonts. Model-generated presentations, prototypes, and discussion sites can include external resources or executable code. Opening or sharing a file can therefore cause additional network requests; an HTML file is not a guarantee of offline operation. Review generated content before opening or sharing it."
    },
    {
      title: "Permissions and recording choices",
      body: "Decker requests tabCapture for tab audio, offscreen for the recorder, storage for the key and local support data, activeTab to check and capture the Meet tab after you invoke the extension, and downloads for HTML exports. Its only persistent host access is api.openai.com for transcription and generation. Decker does not request broad tab access or persistent access to Google Meet. Microphone permission is requested separately. Browser or organization policies can block recording, installation, or OpenAI access. Tell participants about recording and OpenAI processing and obtain any required consent before starting."
    },
    {
      title: "OpenAI data controls",
      body: "OpenAI's processing and retention depend on the API endpoint, applicable terms, and your account's data controls. Decker does not control OpenAI retention or delete content already transmitted to OpenAI. Consult OpenAI's API data controls documentation before recording sensitive content."
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
          Last updated: September 17, 2026
        </p>

        <div style={{ padding: "24px 28px", background: C.surface, border: `1px solid ${C.accentBorder}`, borderLeft: `3px solid ${C.accent}`, borderRadius: 12, marginBottom: 48 }}>
          <p style={{ color: C.text, fontSize: "1rem", lineHeight: 1.8, margin: 0, fontWeight: 500 }}>
            Decker sends recorded audio and transcript content directly from your browser to OpenAI using your own API key. The extension stores your key and debug logs locally. Its recording and generation pipeline does not send this content to the developer.
          </p>
        </div>

        <p style={{ marginBottom: 36 }}>
          <a href="https://developers.openai.com/api/docs/guides/your-data" style={{ color: C.accent }}>OpenAI API data controls</a>
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
