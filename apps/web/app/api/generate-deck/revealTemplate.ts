export interface ChartData {
  type: "bar" | "pie" | "line" | "doughnut";
  title?: string;
  labels: string[];
  values: number[];
}

export interface Slide {
  title: string;
  bullets: string[];
  notes?: string;
  chart?: ChartData;
  mermaid?: string;
}

export interface DeckData {
  title: string;
  subtitle?: string;
  slides: Slide[];
}

const THEME_COLORS: Record<string, string> = {
  dark: "#1a1a2e",
  green: "#0d3d2e",
  blue: "#0d2847",
  light: "#f8fafc",
};

/** Reveal.js built-in themes (see https://revealjs.com/themes/) */
const REVEAL_THEMES = [
  "black", "white", "league", "beige", "night", "serif",
  "simple", "solarized", "moon", "dracula", "sky", "blood",
] as const;

function isRevealTheme(value: string | undefined): value is (typeof REVEAL_THEMES)[number] {
  return !!value && REVEAL_THEMES.includes(value as (typeof REVEAL_THEMES)[number]);
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

export function buildRevealHtml(deck: DeckData, themeOrColor?: string): string {
  const useRevealTheme = isRevealTheme(themeOrColor);
  const revealTheme = useRevealTheme ? themeOrColor : "night";

  const bgHex = themeOrColor && THEME_COLORS[themeOrColor]
    ? THEME_COLORS[themeOrColor]
    : THEME_COLORS.dark;
  const isLight = themeOrColor === "light" || (useRevealTheme && ["white", "beige", "simple", "serif", "solarized"].includes(revealTheme));
  const textColor = isLight ? "#1e293b" : "#e0e0e0";
  const subColor = isLight ? "#64748b" : "#9ca3af";
  const headingColor = isLight ? "#0f172a" : "#c4b5fd";

  const slideHtml = deck.slides
    .map((slide, idx) => {
      const bulletsHtml =
        slide.bullets.length > 0
          ? `<ul>${slide.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("\n")}</ul>`
          : "";

      const notesHtml = slide.notes
        ? `<aside class="notes">${escapeHtml(slide.notes)}</aside>`
        : "";

      let chartHtml = "";
      if (slide.chart && isValidChart(slide.chart)) {
        const chartId = `chart-${idx}`;
        const chartConfig = JSON.stringify(slide.chart).replace(/</g, "\\u003c");
        chartHtml = `
      <div class="slide-chart" data-chart-id="${chartId}">
        <script type="application/json" id="${chartId}-config">${chartConfig}</script>
        <div class="chart-wrapper"><canvas id="${chartId}"></canvas></div>
      </div>`;
      }

      let mermaidHtml = "";
      if (slide.mermaid && slide.mermaid.trim()) {
        const mermaidId = `mermaid-${idx}`;
        const mermaidB64 = Buffer.from(slide.mermaid.trim(), "utf8").toString("base64");
        mermaidHtml = `
      <div class="slide-mermaid" data-mermaid-id="${mermaidId}" data-mermaid-b64="${mermaidB64}">
        <div class="mermaid-placeholder">Loading diagram…</div>
      </div>`;
      }

      return `    <section>
      <h2>${escapeHtml(slide.title)}</h2>
      ${bulletsHtml}
      ${chartHtml}
      ${mermaidHtml}
      ${notesHtml}
    </section>`;
    })
    .join("\n");

  const hasCharts = deck.slides.some((s) => s.chart && isValidChart(s.chart));
  const hasMermaid = deck.slides.some((s) => s.mermaid && s.mermaid.trim());

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(deck.title)}</title>
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reset.css"
    />
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.css"
    />
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/theme/${revealTheme}.css"
    />
    <style>
      .reveal ul { list-style: disc; padding-left: 1.2em; }
      .reveal li { margin: 0.4em 0; font-size: 0.9em; }
      .reveal .title-slide h1 { font-size: 2em; }
      .reveal .title-slide p { font-size: 1.1em; margin-top: 0.5em; }
      .reveal .slide-chart { margin: 1em 0; }
      .reveal .chart-wrapper { max-width: 400px; margin: 0 auto; }
      .reveal .slide-mermaid { margin: 1em 0; }
      .reveal .mermaid-placeholder { font-size: 0.8em; color: var(--r-link-color, #42affa); }
      ${useRevealTheme ? "" : `
      .reveal { background-color: ${bgHex}; }
      .reveal .slides { background-color: ${bgHex}; }
      .reveal .slides section { background-color: ${bgHex}; }
      .reveal h1, .reveal h2 { color: ${headingColor}; }
      .reveal li { color: ${textColor}; }
      .reveal .title-slide p { color: ${subColor}; }
      .reveal .controls { color: ${textColor}; }
      .reveal .progress { background: ${isLight ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)"}; }
      `}
    </style>
  </head>
  <body>
    <div class="reveal">
      <div class="slides">
        <!-- Title slide -->
        <section class="title-slide">
          <h1>${escapeHtml(deck.title)}</h1>
          ${deck.subtitle ? `<p>${escapeHtml(deck.subtitle)}</p>` : ""}
        </section>

${slideHtml}

      </div>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.js"></script>
    ${hasCharts ? '<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>' : ""}
    ${hasMermaid ? '<script src="https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js"></script>' : ""}
    <script>
      Reveal.initialize({
        hash: true,
        transition: "slide",
        backgroundTransition: "fade",
        controls: true,
        progress: true,
        center: true,
      });
      ${hasCharts || hasMermaid ? `
      (function() {
        var chartCache = {};
        var mermaidRendered = {};
        function initSlideVisuals(slideEl) {
          if (!slideEl) return;
          var chartEl = slideEl.querySelector('.slide-chart');
          if (chartEl && typeof Chart !== 'undefined') {
            var id = chartEl.getAttribute('data-chart-id');
            if (!chartCache[id]) {
              var configEl = document.getElementById(id + '-config');
              if (configEl) {
                try {
                  var cfg = JSON.parse(configEl.textContent);
                  var ctx = document.getElementById(id);
                  if (ctx && ctx.getContext) {
                    chartCache[id] = new Chart(ctx.getContext('2d'), {
                      type: cfg.type || 'bar',
                      data: {
                        labels: cfg.labels || [],
                        datasets: [{ label: cfg.title || '', data: cfg.values || [], backgroundColor: ['#6366f1','#8b5cf6','#a855f7','#c084fc','#d8b4fe','#e9d5ff'] }]
                      },
                      options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: cfg.type === 'pie' || cfg.type === 'doughnut' } } }
                    });
                  }
                } catch (e) {}
              }
            }
          }
          var mermaidEl = slideEl.querySelector('.slide-mermaid');
          if (mermaidEl && typeof mermaid !== 'undefined' && !mermaidRendered[mermaidEl.getAttribute('data-mermaid-id')]) {
            var mid = mermaidEl.getAttribute('data-mermaid-id');
            var b64 = mermaidEl.getAttribute('data-mermaid-b64');
            if (b64) {
              try {
                var code = atob(b64);
                var wrap = document.createElement('div');
                wrap.className = 'mermaid';
                wrap.textContent = code;
                mermaidEl.innerHTML = '';
                mermaidEl.appendChild(wrap);
                mermaid.run({ nodes: [wrap] }).then(function() { mermaidRendered[mid] = true; }).catch(function() { mermaidEl.innerHTML = '<pre>' + code + '</pre>'; });
              } catch (e) {}
            }
          }
        }
        Reveal.on('slidechanged', function(e) { initSlideVisuals(e.currentSlide); });
        Reveal.on('ready', function() { initSlideVisuals(Reveal.getCurrentSlide()); });
        if (typeof mermaid !== 'undefined') mermaid.initialize({ startOnLoad: false, theme: 'dark' });
      })();
      ` : ""}
    </script>
  </body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
