/**
 * HTML demo generator.
 *
 * Produces a self-contained HTML page that visualizes the solved color system.
 * Mode toggle is one line of JS flipping color-scheme on :root — light-dark()
 * handles the rest.
 */

import type { SolvedSurface, SolverConfig, SolverOutput } from "../types.js";
import { contrastForPair } from "../math.js";
import { generateCSS } from "./css.js";

// --- Public API ---

export function generateHTML(
  output: SolverOutput,
  config: SolverConfig,
): string {
  const css = generateCSS(output, config.options);
  const prefix = config.options?.prefix ?? "axm";
  const swatches = buildSwatchData(output, config);

  return [
    "<!DOCTYPE html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    "<title>Axiomatic Color System — Demo</title>",
    "<style>",
    css,
    "",
    layoutCSS(prefix),
    "</style>",
    "</head>",
    '<body class="surface-page">',
    '<div class="demo">',
    headerHTML(),
    swatchSectionHTML(swatches),
    compositionHTML(),
    cssSourceHTML(css),
    "</div>",
    "<script>",
    toggleScript(),
    "</script>",
    "</body>",
    "</html>",
    "",
  ].join("\n");
}

// --- Swatch data ---

interface SwatchInfo {
  slug: string;
  label: string;
  polarity: string;
  light: ModeInfo;
  dark: ModeInfo;
}

interface ModeInfo {
  lightness: number;
  apca: Record<string, number>;
}

function buildSwatchData(
  output: SolverOutput,
  config: SolverConfig,
): SwatchInfo[] {
  const labels = new Map<string, string>();
  for (const group of config.groups) {
    for (const surface of group.surfaces) {
      labels.set(surface.slug, surface.label);
    }
  }

  const result: SwatchInfo[] = [];
  const seen = new Set<string>();

  for (const lightSurface of output.light.surfaces) {
    if (seen.has(lightSurface.slug)) continue;
    seen.add(lightSurface.slug);

    const darkSurface = output.dark.surfaces.find(
      (s) => s.slug === lightSurface.slug,
    );
    if (!darkSurface) continue;

    result.push({
      slug: lightSurface.slug,
      label: labels.get(lightSurface.slug) ?? lightSurface.slug,
      polarity: lightSurface.polarity,
      light: modeInfo(lightSurface),
      dark: modeInfo(darkSurface),
    });
  }

  return result;
}

function modeInfo(surface: SolvedSurface): ModeInfo {
  const grades = ["high", "strong", "subtle", "subtlest"] as const;
  const apca: Record<string, number> = {};

  for (const grade of grades) {
    apca[grade] = contrastForPair(surface.textValues[grade], surface.lightness);
  }

  return { lightness: surface.lightness, apca };
}

// --- HTML sections ---

function headerHTML(): string {
  return `  <header class="demo-header">
    <h1 class="text-high">Axiomatic Color System</h1>
    <button id="mode-toggle" class="surface-action text-high demo-toggle">☾ Dark Mode</button>
  </header>`;
}

function swatchSectionHTML(swatches: SwatchInfo[]): string {
  const cards = swatches.map((s) => swatchCardHTML(s)).join("\n");

  return `  <section class="demo-section">
    <h2 class="text-strong">Surface Swatches</h2>
    <div class="swatch-grid">
${cards}
    </div>
  </section>`;
}

function swatchCardHTML(s: SwatchInfo): string {
  const grades = ["high", "strong", "subtle", "subtlest"] as const;
  const gradeLabels: Record<string, string> = {
    high: "High (108 target)",
    strong: "Strong (105 target)",
    subtle: "Subtle (90 target)",
    subtlest: "Subtlest (75 target)",
  };

  const textSamples = grades
    .map(
      (g) =>
        `          <p class="text-${g}">${gradeLabels[g]} — sample text</p>`,
    )
    .join("\n");

  const metaRows = grades
    .map(
      (g) =>
        `            <tr><td>${g}</td><td>${s.light.apca[g]!.toFixed(1)}</td><td>${s.dark.apca[g]!.toFixed(1)}</td></tr>`,
    )
    .join("\n");

  return `      <div class="swatch surface-${s.slug}">
        <div class="swatch-header">
          <span class="swatch-name text-high">${escapeHTML(s.label)}</span>
          <span class="swatch-badge text-subtle">${s.polarity}</span>
        </div>
        <div class="swatch-samples">
${textSamples}
        </div>
        <div class="swatch-meta text-subtle">
          <div class="swatch-lightness">L: ${s.light.lightness.toFixed(4)} / D: ${s.dark.lightness.toFixed(4)}</div>
          <table class="swatch-table">
            <tr><th>Grade</th><th>Light</th><th>Dark</th></tr>
${metaRows}
          </table>
        </div>
      </div>`;
}

function compositionHTML(): string {
  return `  <section class="demo-section">
    <h2 class="text-strong">Composition</h2>
    <p class="text-subtle comp-intro">The body is the page surface. Below: workspace → card → action nesting.</p>
    <div class="surface-workspace comp-panel">
      <p class="text-subtle comp-label">Workspace</p>
      <div class="surface-card comp-card border-decorative">
        <h3 class="text-high">Card Title</h3>
        <p class="text-strong">Body text on a card surface — strong grade for comfortable reading.</p>
        <p class="text-subtle">Secondary details use the subtle grade.</p>
        <p class="text-subtlest">Tertiary hint text at the subtlest grade.</p>
        <button class="surface-action comp-button border-interactive text-high">Action Button</button>
      </div>
      <div class="surface-card comp-card border-decorative">
        <h3 class="text-high">Another Card</h3>
        <p class="text-strong">Cards are siblings, not nested. Same lightness, same text contrast.</p>
      </div>
    </div>
    <div class="surface-spotlight comp-spotlight">
      <h3 class="text-high">Spotlight</h3>
      <p class="text-strong">Inverted polarity — massive APCA gap from page surfaces.</p>
      <p class="text-subtle">Secondary text on inverted surface.</p>
    </div>
    <div class="comp-border-showcase">
      <h3 class="text-strong">Border Tiers</h3>
      <div class="comp-border-row">
        <div class="surface-card comp-border-box border-decorative">
          <span class="text-subtle">Decorative (10)</span>
        </div>
        <div class="surface-card comp-border-box border-interactive">
          <span class="text-subtle">Interactive (30)</span>
        </div>
        <div class="surface-card comp-border-box border-critical">
          <span class="text-subtle">Critical (80)</span>
        </div>
      </div>
    </div>
  </section>`;
}

function cssSourceHTML(css: string): string {
  return `  <details class="demo-section demo-source surface-spotlight">
    <summary class="text-strong">Generated CSS Source</summary>
    <pre class="text-subtle"><code>${escapeHTML(css)}</code></pre>
  </details>`;
}

// --- Demo layout CSS ---

function layoutCSS(_prefix: string): string {
  return `/* === Demo layout (not part of the color system) === */
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  min-height: 100vh;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

[class*="text-"] { transition: color 0.3s ease; }

.demo { max-width: 960px; margin: 0 auto; padding: 2rem 1.5rem; }

/* Header */
.demo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}
.demo-header h1 { font-size: 1.5rem; font-weight: 700; letter-spacing: -0.02em; }

.demo-toggle {
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font: inherit;
  font-size: 0.9375rem;
  font-weight: 500;
}

/* Sections */
.demo-section { margin-bottom: 3rem; }
.demo-section > h2 { margin-bottom: 1.25rem; font-size: 1.125rem; font-weight: 600; }

/* Swatch grid */
.swatch-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
}
.swatch { border-radius: 0.75rem; overflow: hidden; }

.swatch-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 1.25rem 1.25rem 0;
}
.swatch-name { font-size: 1.125rem; font-weight: 600; }
.swatch-badge {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 500;
}

.swatch-samples { padding: 0.75rem 1.25rem 1rem; }
.swatch-samples p { font-size: 0.9375rem; line-height: 1.6; }

.swatch-meta {
  padding: 0.75rem 1.25rem;
  font-size: 0.75rem;
  border-top: 1px solid rgba(128, 128, 128, 0.2);
}
.swatch-lightness { margin-bottom: 0.375rem; font-variant-numeric: tabular-nums; }
.swatch-table { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }
.swatch-table th { text-align: left; font-weight: 500; padding: 0.125rem 0; }
.swatch-table td { padding: 0.125rem 0; }
.swatch-table td:not(:first-child),
.swatch-table th:not(:first-child) { text-align: right; }

/* Composition */
.comp-intro { margin-bottom: 1rem; }
.comp-label { margin-bottom: 1rem; font-size: 0.8125rem; text-transform: uppercase; letter-spacing: 0.05em; }
.comp-panel { padding: 1.5rem; border-radius: 0.75rem; }
.comp-card { padding: 1.5rem; border-radius: 0.5rem; margin-bottom: 1rem; }
.comp-card:last-child { margin-bottom: 0; }
.comp-card h3 { margin-bottom: 0.5rem; font-size: 1.0625rem; }
.comp-card p { margin-bottom: 0.375rem; }
.comp-button {
  margin-top: 0.75rem;
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font: inherit;
  font-weight: 500;
}
.comp-spotlight {
  padding: 1.5rem;
  border-radius: 0.75rem;
  margin-top: 1.25rem;
}
.comp-spotlight h3 { margin-bottom: 0.5rem; }
.comp-spotlight p { margin-bottom: 0.25rem; }

/* Border showcase */
.comp-border-showcase { margin-top: 1.5rem; }
.comp-border-showcase h3 { margin-bottom: 0.75rem; }
.comp-border-row { display: flex; gap: 1rem; flex-wrap: wrap; }
.comp-border-box {
  flex: 1;
  min-width: 140px;
  padding: 1.25rem;
  border-radius: 0.5rem;
  text-align: center;
}

/* Border utility layout support */
.border-decorative { border: 1px solid; }
.border-interactive { border: 2px solid; }
.border-critical { border: 2px solid; }

/* CSS source */
.demo-source { border-radius: 0.75rem; padding: 0; overflow: hidden; }
.demo-source summary { cursor: pointer; padding: 1rem 1.25rem; font-weight: 500; }
.demo-source pre {
  padding: 0 1.25rem 1.25rem;
  overflow-x: auto;
  font-size: 0.8125rem;
  line-height: 1.6;
  font-family: ui-monospace, "Cascadia Code", "SF Mono", Menlo, monospace;
  white-space: pre-wrap;
  word-break: break-all;
}`;
}

// --- Toggle script ---

function toggleScript(): string {
  return `(function() {
  var dark = false;
  var btn = document.getElementById('mode-toggle');
  btn.addEventListener('click', function() {
    dark = !dark;
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    btn.textContent = dark ? '☀ Light Mode' : '☾ Dark Mode';
  });
})();`;
}

// --- Utility ---

function escapeHTML(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
