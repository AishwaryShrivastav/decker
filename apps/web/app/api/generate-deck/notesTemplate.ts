export interface ChartData {
  type: "bar" | "pie" | "line" | "doughnut";
  title?: string;
  labels: string[];
  values: number[];
}

export interface NotesSection {
  heading: string;
  items: string[];
  chart?: ChartData;
  mermaid?: string;
}

export interface NotesData {
  title: string;
  subtitle?: string;
  sections: NotesSection[];
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function isValidChart(c: ChartData): boolean {
  return (
    Array.isArray(c.labels) &&
    Array.isArray(c.values) &&
    c.labels.length > 0 &&
    c.labels.length === c.values.length &&
    c.values.every((v) => typeof v === "number" && !Number.isNaN(v))
  );
}

export function buildNotesHtml(notes: NotesData): string {
  const sectionsHtml = notes.sections
    .map((s, idx) => {
      let chartHtml = "";
      if (s.chart && isValidChart(s.chart)) {
        const chartId = `notes-chart-${idx}`;
        const chartConfig = JSON.stringify(s.chart).replace(/</g, "\\u003c");
        chartHtml = `
      <div class="notes-chart" data-chart-id="${chartId}">
        <script type="application/json" id="${chartId}-config">${chartConfig}</script>
        <div class="chart-wrapper"><canvas id="${chartId}"></canvas></div>
      </div>`;
      }
      let mermaidHtml = "";
      if (s.mermaid && s.mermaid.trim()) {
        const mermaidId = `notes-mermaid-${idx}`;
        const mermaidB64 = Buffer.from(s.mermaid.trim(), "utf8").toString("base64");
        mermaidHtml = `
      <div class="notes-mermaid" data-mermaid-id="${mermaidId}" data-mermaid-b64="${mermaidB64}">
        <div class="mermaid-placeholder">Loading diagram…</div>
      </div>`;
      }
      return `
    <section class="notes-section">
      <h2 class="notes-heading">${escapeHtml(s.heading)}</h2>
      ${s.items.length > 0 ? `<ul class="notes-list">\n        ${s.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("\n        ")}\n      </ul>` : ""}
      ${chartHtml}
      ${mermaidHtml}
    </section>`;
    })
    .join("\n");

  const hasCharts = notes.sections.some((s) => s.chart && isValidChart(s.chart));
  const hasMermaid = notes.sections.some((s) => s.mermaid && s.mermaid.trim());

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(notes.title)}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Instrument+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
    <style>
      :root {
        --bg: #0f0f14;
        --surface: #1a1a24;
        --text: #e8e6e3;
        --text-muted: #9a9a9f;
        --accent: #c9a959;
        --accent-soft: rgba(201, 169, 89, 0.15);
        --border: #2a2a36;
      }

      * {
        box-sizing: border-box;
      }

      html {
        scroll-behavior: smooth;
      }

      body {
        margin: 0;
        padding: 0;
        font-family: "Instrument Sans", -apple-system, BlinkMacSystemFont, sans-serif;
        background: var(--bg);
        color: var(--text);
        line-height: 1.65;
        min-height: 100vh;
        background-image:
          radial-gradient(ellipse 80% 50% at 50% -20%, var(--accent-soft), transparent),
          linear-gradient(180deg, var(--bg) 0%, var(--surface) 50%, var(--bg) 100%);
      }

      .notes-container {
        max-width: 680px;
        margin: 0 auto;
        padding: 48px 24px 80px;
      }

      .notes-header {
        margin-bottom: 48px;
        padding-bottom: 32px;
        border-bottom: 1px solid var(--border);
      }

      .notes-title {
        font-family: "DM Serif Display", Georgia, serif;
        font-size: 2.25rem;
        font-weight: 400;
        margin: 0 0 8px;
        color: var(--text);
        letter-spacing: -0.02em;
      }

      .notes-subtitle {
        font-size: 0.95rem;
        color: var(--text-muted);
        margin: 0;
        font-weight: 500;
      }

      .notes-section {
        margin-bottom: 40px;
      }

      .notes-heading {
        font-family: "DM Serif Display", Georgia, serif;
        font-size: 1.35rem;
        font-weight: 400;
        margin: 0 0 16px;
        color: var(--accent);
        letter-spacing: -0.01em;
      }

      .notes-list {
        margin: 0;
        padding-left: 1.35em;
        list-style: none;
      }

      .notes-list li {
        position: relative;
        margin-bottom: 10px;
        padding-left: 0.5em;
        font-size: 1rem;
        color: var(--text);
      }

      .notes-list li::before {
        content: "";
        position: absolute;
        left: -1.1em;
        top: 0.65em;
        width: 6px;
        height: 6px;
        background: var(--accent);
        border-radius: 50%;
        opacity: 0.8;
      }

      .notes-list li:last-child {
        margin-bottom: 0;
      }

      .notes-chart { margin: 24px 0; }
      .notes-chart .chart-wrapper { max-width: 100%; height: 260px; }
      .notes-mermaid { margin: 24px 0; }
      .notes-mermaid .mermaid-placeholder { font-size: 0.9rem; color: var(--text-muted); }

      @media (min-width: 600px) {
        .notes-container {
          padding: 64px 32px 96px;
        }

        .notes-title {
          font-size: 2.6rem;
        }

        .notes-header {
          margin-bottom: 56px;
          padding-bottom: 40px;
        }

        .notes-section {
          margin-bottom: 48px;
        }

        .notes-heading {
          font-size: 1.5rem;
        }

        .notes-list li {
          font-size: 1.05rem;
        }
      }
    </style>
  </head>
  <body>
    <main class="notes-container">
      <header class="notes-header">
        <h1 class="notes-title">${escapeHtml(notes.title)}</h1>
        ${notes.subtitle ? `<p class="notes-subtitle">${escapeHtml(notes.subtitle)}</p>` : ""}
      </header>
      ${sectionsHtml}
    </main>
    ${hasCharts ? '<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>' : ""}
    ${hasMermaid ? '<script src="https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js"></script>' : ""}
    ${hasCharts || hasMermaid ? `
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        if (typeof mermaid !== 'undefined') mermaid.initialize({ startOnLoad: false, theme: 'dark' });
        document.querySelectorAll('.notes-chart').forEach(function(el) {
          var id = el.getAttribute('data-chart-id');
          var configEl = document.getElementById(id + '-config');
          if (configEl && typeof Chart !== 'undefined') {
            try {
              var cfg = JSON.parse(configEl.textContent);
              var ctx = document.getElementById(id);
              if (ctx) new Chart(ctx.getContext('2d'), {
                type: cfg.type || 'bar',
                data: { labels: cfg.labels || [], datasets: [{ label: cfg.title || '', data: cfg.values || [], backgroundColor: ['#c9a959','#a78b4a','#8b7340','#6d5a33','#4f4226','#312819'] }] },
                options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: cfg.type === 'pie' || cfg.type === 'doughnut' } } }
              });
            } catch (e) {}
          }
        });
        document.querySelectorAll('.notes-mermaid').forEach(function(el) {
          var b64 = el.getAttribute('data-mermaid-b64');
          if (b64 && typeof mermaid !== 'undefined') {
            try {
              var code = atob(b64);
              var wrap = document.createElement('div');
              wrap.className = 'mermaid';
              wrap.textContent = code;
              el.innerHTML = '';
              el.appendChild(wrap);
              mermaid.run({ nodes: [wrap] }).catch(function() { el.innerHTML = '<pre>' + code + '</pre>'; });
            } catch (e) {}
          }
        });
      });
    </script>` : ""}
  </body>
</html>`;
}
