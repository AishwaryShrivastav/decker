export interface Slide {
  title: string;
  bullets: string[];
  notes?: string;
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

export function buildRevealHtml(deck: DeckData, backgroundColor?: string): string {
  const bgHex = backgroundColor && THEME_COLORS[backgroundColor]
    ? THEME_COLORS[backgroundColor]
    : THEME_COLORS.dark;
  const isLight = backgroundColor === "light";
  const textColor = isLight ? "#1e293b" : "#e0e0e0";
  const subColor = isLight ? "#64748b" : "#9ca3af";
  const headingColor = isLight ? "#0f172a" : "#c4b5fd";
  const slideHtml = deck.slides
    .map((slide) => {
      const bulletsHtml =
        slide.bullets.length > 0
          ? `<ul>${slide.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("\n")}</ul>`
          : "";

      const notesHtml = slide.notes
        ? `<aside class="notes">${escapeHtml(slide.notes)}</aside>`
        : "";

      return `    <section>
      <h2>${escapeHtml(slide.title)}</h2>
      ${bulletsHtml}
      ${notesHtml}
    </section>`;
    })
    .join("\n");

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
      href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/theme/night.css"
    />
    <style>
      .reveal { background-color: ${bgHex}; }
      .reveal .slides { background-color: ${bgHex}; }
      .reveal .slides section { background-color: ${bgHex}; }
      .reveal h1, .reveal h2 { color: ${headingColor}; }
      .reveal ul { list-style: disc; padding-left: 1.2em; }
      .reveal li { margin: 0.4em 0; font-size: 0.9em; color: ${textColor}; }
      .reveal .title-slide h1 { font-size: 2em; }
      .reveal .title-slide p { color: ${subColor}; font-size: 1.1em; margin-top: 0.5em; }
      .reveal .controls { color: ${textColor}; }
      .reveal .progress { background: ${isLight ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)"}; }
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
    <script>
      Reveal.initialize({
        hash: true,
        transition: "slide",
        backgroundTransition: "fade",
        controls: true,
        progress: true,
        center: true,
      });
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
