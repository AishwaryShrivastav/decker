const CHROME_STORE =
  "https://chromewebstore.google.com/detail/decker-google-meet-notes/khbafeikhdehdhpfcbdlfkpmmikbfihk";
const GITHUB = "https://github.com/AishwaryShrivastav/decker";
const PILOT_MAIL =
  "mailto:aishwaryshrivastava@gmail.com?subject=Decker%20first%20meeting%20pilot&body=I%20have%20a%20browser%20meeting%20coming%20up.%0A%0AMeeting%20service%3A%0ADate%3A%0AWhat%20I%20need%20to%20leave%20with%3A%0A";

const FIRST_MEETING = [
  ["01", "Install and pin Decker", "Use Chrome or another Chromium browser that can install Chrome extensions."],
  ["02", "Connect OpenAI or Gemini", "Add your own provider key. Decker checks it before saving it on this device."],
  ["03", "Run a two-minute rehearsal", "Open the meeting in a browser tab, allow the microphone if needed, and confirm that speech is transcribed."],
  ["04", "Record the useful part", "Tell participants, obtain consent, and watch for silence or muted-tab warnings."],
  ["05", "Review and open the artifact", "Correct the transcript, choose the useful points, generate an HTML file, then open it from Downloads."],
] as const;

const OUTPUTS = [
  ["Closing deck", "Present decisions, scope, and owners before the call ends."],
  ["Meeting brief", "Keep a structured document with summaries and action items."],
  ["Discussion page", "Share a single HTML page with the wider team."],
  ["Prototype", "Turn a product discussion into a working HTML concept."],
] as const;

export default function Home() {
  return (
    <main>
      <nav className="site-nav" aria-label="Primary navigation">
        <a className="brand" href="#top" aria-label="Decker home">
          <img src="/logo.png" width="28" height="28" alt="" />
          <span>Decker</span>
        </a>
        <div className="nav-links">
          <a href="#first-meeting">First meeting</a>
          <a href="/demo">Sample</a>
          <a href="/privacy">Privacy</a>
          <a className="button button-small" href={CHROME_STORE}>Add to Chrome</a>
        </div>
      </nav>

      <section className="hero" id="top">
        <div className="release-line">
          <span className="live-dot" />
          Public on the Chrome Web Store
        </div>
        <div className="hero-copy">
          <h1>Close the call with the deck already made.</h1>
          <div className="hero-action">
            <p>
              Decker records a meeting tab in your Chromium browser, lets you correct the transcript, and builds the artifact the room needs next.
            </p>
            <div className="button-row">
              <a className="button" href={CHROME_STORE}>Add to Chrome</a>
              <a className="text-link" href="#first-meeting">Prepare your first meeting</a>
            </div>
            <p className="microcopy">Free and open source. Bring an OpenAI or Gemini key. No meeting bot.</p>
          </div>
        </div>

        <div className="close-room" aria-label="A Decker meeting moving from live statements to a closing deck">
          <div className="room-bar">
            <div><span className="record-dot" /> Client scope review</div>
            <div className="room-time">52:14, closing review</div>
          </div>
          <div className="room-grid">
            <div className="transcript-pane">
              <p className="panel-label">Reviewed transcript</p>
              <div className="speaker-line">
                <span>AM</span>
                <p>&quot;Phase one covers onboarding and billing. Reporting moves to the next release.&quot;</p>
              </div>
              <div className="speaker-line">
                <span>RS</span>
                <p>&quot;I own the API handoff. Friday is the review date.&quot;</p>
              </div>
              <div className="speaker-line muted-line">
                <span>?</span>
                <p>Launch approval still needs a named owner.</p>
              </div>
            </div>

            <div className="decision-rail" aria-hidden="true"><span /><span /><span /></div>

            <div className="artifact-pane">
              <div className="artifact-head"><span>Closing deck</span><span>5 slides</span></div>
              <div className="deck-paper">
                <p className="deck-kicker">Scope review, final</p>
                <h2>What the room agreed</h2>
                <dl>
                  <div><dt>In scope</dt><dd>Onboarding and billing</dd></div>
                  <div><dt>Later</dt><dd>Reporting</dd></div>
                  <div><dt>Owner</dt><dd>RS, API handoff</dd></div>
                  <div><dt>Review</dt><dd>Friday</dd></div>
                </dl>
                <p className="open-item">Open item: assign launch approval</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="statement-band">
        <p>Connect a provider</p><p>Record the browser tab</p><p>Review the transcript</p><p>Open the artifact</p>
      </section>

      <section className="first-meeting section" id="first-meeting">
        <div className="section-heading">
          <p className="eyebrow">Your first useful output</p>
          <h2>Plan ten minutes before the call.</h2>
          <p>Decker works best when the host knows what the room needs to approve or use when the meeting ends.</p>
        </div>
        <ol className="setup-list">
          {FIRST_MEETING.map(([number, title, detail]) => (
            <li key={number}><span className="step-number">{number}</span><div><h3>{title}</h3><p>{detail}</p></div></li>
          ))}
        </ol>
        <div className="setup-actions">
          <a className="button" href={CHROME_STORE}>Install Decker</a>
          <a className="button button-quiet" href={PILOT_MAIL}>Get help with one real call</a>
        </div>
      </section>

      <section className="sample-section section" id="sample">
        <div className="sample-copy">
          <p className="eyebrow">Inspect the output</p>
          <h2>A file the room can open without Decker.</h2>
          <p>Every output is an HTML file saved to Downloads. Review it, present it, or send it with the follow-up. The sample uses included demo content.</p>
          <a className="button button-paper" href="/demo">Open the sample deck</a>
        </div>
        <a className="sample-frame" href="/demo" aria-label="Open the full sample deck">
          <img src="/images/closing-deck-sample.png" alt="A sample closing deck with decisions and action items" />
          <span>Open full sample</span>
        </a>
      </section>

      <section className="outputs section">
        <div className="section-heading compact-heading"><p className="eyebrow">Choose the handoff</p><h2>Four outputs from one reviewed transcript.</h2></div>
        <div className="output-list">
          {OUTPUTS.map(([title, detail], index) => (
            <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{detail}</p></article>
          ))}
        </div>
      </section>

      <section className="trust-section section">
        <div className="trust-copy">
          <p className="eyebrow">Data path</p>
          <h2>Your browser talks directly to your provider.</h2>
          <p>Choose OpenAI or Gemini. Audio and text go to that provider with your key. Decker keeps the key and one recovery session locally and sends no automatic meeting-content telemetry to the developer.</p>
          <div className="trust-links"><a href="/privacy">Read the privacy policy</a><a href={GITHUB}>Inspect the source</a></div>
        </div>
        <div className="data-diagram" aria-label="Decker data path">
          <div><span>1</span><strong>Browser meeting</strong><small>Audio from the active eligible tab</small></div><i />
          <div><span>2</span><strong>Decker</strong><small>Local key and recovery session</small></div><i />
          <div><span>3</span><strong>OpenAI or Gemini</strong><small>Validation, transcription, and generation</small></div>
        </div>
      </section>

      <section className="pilot-section section" id="pilot">
        <p className="eyebrow">Ten assisted pilots</p>
        <div className="pilot-grid">
          <h2>Bring a real meeting. We will help you leave with the first artifact.</h2>
          <div>
            <p>This cohort is for technical founders, consultants, and small agency leads with a browser meeting scheduled in the next ten days. Setup takes about fifteen minutes, followed by a short rehearsal and one feedback call.</p>
            <a className="button" href={PILOT_MAIL}>Request a first-meeting pilot</a>
          </div>
        </div>
      </section>

      <footer>
        <div className="footer-brand"><img src="/logo.png" width="24" height="24" alt="" /><span>Decker</span></div>
        <p>Open source under the MIT License.</p>
        <div><a href={GITHUB}>GitHub</a><a href="/support">Support</a><a href="/privacy">Privacy</a></div>
      </footer>
    </main>
  );
}
