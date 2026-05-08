/**
 * Builds a self-contained meeting document HTML from structured doc data.
 * Clean dark-themed single-page document — no Reveal.js, no heavy deps.
 * Only external dependency: Google Fonts (Inter).
 */

export interface DocTopic {
  title: string;
  summary: string;
  keyDecision?: string | null;
  subtopics: string[];
  actionItems?: string[];
}

export interface MeetingDocData {
  title: string;
  subtitle?: string;
  summary?: string;
  topics: DocTopic[];
  overallActionItems?: string[];
}

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

export function buildMeetingDoc(data: MeetingDocData): string {
  const now = new Date();
  const dateStr = `${now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;
  const topicCount = data.topics.length;

  const tocItems = data.topics
    .map(
      (t, i) =>
        `<li><a href="#topic-${i + 1}" class="toc-link"><span class="toc-num">${pad2(i + 1)}</span><span>${esc(t.title)}</span></a></li>`
    )
    .join("\n          ");

  const allActions = [
    ...data.topics.flatMap((t) => (t.actionItems ?? []).map((a) => ({ topic: t.title, action: a }))),
    ...(data.overallActionItems ?? []).map((a) => ({ topic: null, action: a })),
  ];

  const topicSections = data.topics
    .map((topic, i) => {
      const idx = i + 1;

      const summaryHtml = topic.summary
        ? `<p class="topic-summary">${esc(topic.summary)}</p>`
        : "";

      const decisionHtml = topic.keyDecision
        ? `<div class="decision-card">
              <span class="decision-label">Key Decision</span>
              <p class="decision-text">${esc(topic.keyDecision)}</p>
            </div>`
        : "";

      const subtopicsHtml =
        topic.subtopics.length > 0
          ? `<ul class="subtopics">
              ${topic.subtopics.map((s) => `<li>${esc(s)}</li>`).join("\n              ")}
            </ul>`
          : "";

      const actionsHtml =
        (topic.actionItems ?? []).length > 0
          ? `<div class="topic-actions">
              <span class="actions-label">Action Items</span>
              <ul class="action-list">
                ${(topic.actionItems ?? []).map((a) => `<li>${esc(a)}</li>`).join("\n                ")}
              </ul>
            </div>`
          : "";

      return `    <section id="topic-${idx}" class="topic-section">
        <div class="topic-header">
          <span class="topic-num">${pad2(idx)}</span>
          <h2 class="topic-title">${esc(topic.title)}</h2>
        </div>
        ${summaryHtml}
        ${decisionHtml}
        ${subtopicsHtml}
        ${actionsHtml}
      </section>`;
    })
    .join("\n\n");

  const actionTableHtml =
    allActions.length > 0
      ? `    <section class="actions-section">
        <h2 class="section-heading">All Action Items</h2>
        <table class="actions-table">
          <thead>
            <tr><th>Action</th><th>Topic</th></tr>
          </thead>
          <tbody>
            ${allActions
              .map(
                (a) =>
                  `<tr><td>${esc(a.action)}</td><td class="topic-ref">${a.topic ? esc(a.topic) : "—"}</td></tr>`
              )
              .join("\n            ")}
          </tbody>
        </table>
      </section>`
      : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(data.title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #080c18;
      --surface: #0d1224;
      --surface2: rgba(255,255,255,0.04);
      --border: rgba(255,255,255,0.07);
      --accent: #818cf8;
      --accent-dim: rgba(99,102,241,0.15);
      --accent-border: rgba(99,102,241,0.35);
      --text: #e2e8f0;
      --text-muted: #64748b;
      --text-dim: #94a3b8;
      --decision: #34d399;
      --decision-dim: rgba(52,211,153,0.1);
      --decision-border: rgba(52,211,153,0.3);
      --font: 'Inter', -apple-system, system-ui, sans-serif;
      --mono: 'JetBrains Mono', 'Fira Code', monospace;
      --max-w: 860px;
      --sidebar: 260px;
    }

    html { scroll-behavior: smooth; }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font);
      line-height: 1.65;
      min-height: 100vh;
    }

    /* ── LAYOUT ── */
    .layout {
      display: grid;
      grid-template-columns: var(--sidebar) 1fr;
      grid-template-rows: auto 1fr;
      min-height: 100vh;
    }

    /* ── HEADER ── */
    .site-header {
      grid-column: 1 / -1;
      padding: 2.5rem 3rem;
      border-bottom: 1px solid var(--border);
      background: linear-gradient(135deg, #080c18 0%, #0d1224 100%);
    }

    .header-meta {
      font-family: var(--mono);
      font-size: 0.7rem;
      color: var(--text-muted);
      letter-spacing: 0.06em;
      text-transform: uppercase;
      margin-bottom: 0.6rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .header-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 2px 10px;
      border: 1px solid var(--accent-border);
      border-radius: 99px;
      color: var(--accent);
      background: var(--accent-dim);
      font-size: 0.65rem;
      letter-spacing: 0.08em;
    }

    .site-title {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text);
      letter-spacing: -0.03em;
      line-height: 1.2;
      margin-bottom: 0.5rem;
    }

    .site-subtitle {
      font-size: 0.95rem;
      color: var(--text-dim);
      font-weight: 300;
    }

    .executive-summary {
      margin-top: 1.5rem;
      padding: 1rem 1.25rem;
      background: var(--surface2);
      border: 1px solid var(--border);
      border-left: 3px solid var(--accent);
      border-radius: 0 8px 8px 0;
      font-size: 0.9rem;
      color: var(--text-dim);
      max-width: var(--max-w);
    }

    /* ── SIDEBAR ── */
    .sidebar {
      padding: 2rem 1.5rem;
      border-right: 1px solid var(--border);
      background: var(--surface);
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
    }

    .sidebar-label {
      font-family: var(--mono);
      font-size: 0.65rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 1rem;
    }

    .toc-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .toc-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      text-decoration: none;
      color: var(--text-dim);
      font-size: 0.82rem;
      transition: background 0.15s, color 0.15s;
    }

    .toc-link:hover {
      background: var(--surface2);
      color: var(--text);
    }

    .toc-num {
      font-family: var(--mono);
      font-size: 0.65rem;
      color: var(--accent);
      flex-shrink: 0;
    }

    /* ── MAIN CONTENT ── */
    .main-content {
      padding: 2.5rem 3rem;
      max-width: var(--max-w);
    }

    /* ── TOPIC SECTION ── */
    .topic-section {
      margin-bottom: 3.5rem;
      padding-bottom: 3rem;
      border-bottom: 1px solid var(--border);
    }

    .topic-section:last-of-type {
      border-bottom: none;
    }

    .topic-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }

    .topic-num {
      font-family: var(--mono);
      font-size: 0.7rem;
      font-weight: 500;
      color: var(--accent);
      background: var(--accent-dim);
      border: 1px solid var(--accent-border);
      padding: 3px 10px;
      border-radius: 6px;
      flex-shrink: 0;
    }

    .topic-title {
      font-size: 1.35rem;
      font-weight: 600;
      color: var(--text);
      letter-spacing: -0.02em;
      line-height: 1.3;
    }

    .topic-summary {
      font-size: 0.9rem;
      color: var(--text-dim);
      line-height: 1.7;
      margin-bottom: 1.25rem;
    }

    /* Decision card */
    .decision-card {
      background: var(--decision-dim);
      border: 1px solid var(--decision-border);
      border-radius: 8px;
      padding: 1rem 1.25rem;
      margin-bottom: 1.25rem;
    }

    .decision-label {
      display: block;
      font-family: var(--mono);
      font-size: 0.62rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--decision);
      margin-bottom: 0.4rem;
    }

    .decision-text {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text);
    }

    /* Subtopics */
    .subtopics {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1.25rem;
    }

    .subtopics li {
      position: relative;
      padding: 0.55rem 0.9rem 0.55rem 1rem;
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: 6px;
      font-size: 0.85rem;
      color: var(--text);
      line-height: 1.5;
    }

    .subtopics li::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: linear-gradient(180deg, var(--accent) 0%, #a5b4fc 100%);
      border-radius: 3px 0 0 3px;
    }

    /* Topic action items */
    .topic-actions {
      margin-top: 0.25rem;
    }

    .actions-label {
      display: block;
      font-family: var(--mono);
      font-size: 0.62rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 0.5rem;
    }

    .action-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .action-list li {
      font-size: 0.82rem;
      color: var(--text-dim);
      padding: 0.3rem 0.6rem;
      background: rgba(255,255,255,0.02);
      border-radius: 4px;
    }

    .action-list li::before {
      content: '→ ';
      color: var(--accent);
    }

    /* ── ALL ACTIONS TABLE ── */
    .actions-section {
      margin-top: 1rem;
    }

    .section-heading {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 1.25rem;
      letter-spacing: -0.01em;
    }

    .actions-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }

    .actions-table th {
      text-align: left;
      padding: 0.6rem 0.9rem;
      background: var(--surface2);
      border: 1px solid var(--border);
      font-weight: 500;
      color: var(--text-dim);
      font-family: var(--mono);
      font-size: 0.68rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .actions-table td {
      padding: 0.65rem 0.9rem;
      border: 1px solid var(--border);
      color: var(--text);
      vertical-align: top;
    }

    .actions-table tr:hover td {
      background: var(--surface2);
    }

    .topic-ref {
      color: var(--text-muted);
      font-size: 0.8rem;
      white-space: nowrap;
    }

    /* ── FOOTER ── */
    .site-footer {
      grid-column: 1 / -1;
      padding: 1.5rem 3rem;
      border-top: 1px solid var(--border);
      text-align: center;
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .site-footer a {
      color: var(--accent);
      text-decoration: none;
    }

    /* ── RESPONSIVE ── */
    @media (max-width: 768px) {
      .layout {
        grid-template-columns: 1fr;
      }
      .sidebar {
        display: none;
      }
      .main-content {
        padding: 1.5rem;
      }
      .site-header {
        padding: 1.5rem;
      }
      .site-title {
        font-size: 1.5rem;
      }
    }
  </style>
</head>
<body>
  <div class="layout">
    <!-- Header -->
    <header class="site-header">
      <div class="header-meta">
        <span>${esc(dateStr)}</span>
        <span class="header-badge">⚡ Decker · AI Generated</span>
        <span>${topicCount} topic${topicCount !== 1 ? "s" : ""}</span>
      </div>
      <h1 class="site-title">${esc(data.title)}</h1>
      ${data.subtitle ? `<p class="site-subtitle">${esc(data.subtitle)}</p>` : ""}
      ${data.summary ? `<p class="executive-summary">${esc(data.summary)}</p>` : ""}
    </header>

    <!-- Sidebar TOC -->
    <aside class="sidebar">
      <div class="sidebar-label">Topics</div>
      <ol class="toc-list">
        ${tocItems}
      </ol>
    </aside>

    <!-- Main content -->
    <main class="main-content">
${topicSections}

${actionTableHtml}
    </main>

    <!-- Footer -->
    <footer class="site-footer">
      Generated with <a href="https://decker.so" target="_blank">Decker</a> · ${esc(dateStr)}
    </footer>
  </div>
</body>
</html>`;
}
