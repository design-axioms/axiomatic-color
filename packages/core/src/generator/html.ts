/**
 * HTML demo generator.
 *
 * Produces a self-contained HTML page that visualizes the solved color system.
 * Mode toggle is one line of JS flipping color-scheme on :root — light-dark()
 * handles the rest.
 */

import type { SolvedSurface, SolverConfig, SolverOutput } from "../types.ts";
import { contrastForPair } from "../math.ts";
import { generateCSS } from "./css.ts";

// --- Public API ---

export function generateHTML(
  output: SolverOutput,
  config: SolverConfig,
): string {
  const keyColors = config.keyColors;
  const css = generateCSS(output, {
    ...config.options,
    ...(keyColors ? { keyColors } : {}),
  });
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
  unmetGrades: readonly string[];
}

function buildSwatchData(
  output: SolverOutput,
  config: SolverConfig,
): SwatchInfo[] {
  const labels = new Map<string, string>();
  for (const polarity of ["page", "inverted"] as const) {
    const bucket = config.surfaces[polarity];
    if (!bucket) continue;
    for (const [slug, spec] of Object.entries(bucket)) {
      const label = typeof spec === "number" ? slug : spec.label ?? slug;
      labels.set(slug, label);
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

  return {
    lightness: surface.lightness,
    apca,
    unmetGrades: surface.diagnostics?.unmetTextGrades ?? [],
  };
}

// --- HTML sections ---

function headerHTML(): string {
  return `  <header class="demo-header">
    <h1 class="text-high">Axiomatic Color System</h1>
    <div class="demo-controls">
      <label class="demo-color-label text-subtle">
        Key Color
        <input type="color" id="key-color" value="#6e56cf" class="demo-color-input">
      </label>
      <button id="mode-toggle" class="surface-action text-high demo-toggle">☮ Dark Mode</button>
    </div>
    <div class="demo-sliders text-subtle">
      <label class="demo-slider-label">
        Hue <output id="hue-val">288</output>
        <input type="range" id="hue-slider" min="0" max="360" step="1" value="288" class="demo-slider">
      </label>
      <label class="demo-slider-label">
        Chroma <output id="chroma-val">0.17</output>
        <input type="range" id="chroma-slider" min="0" max="0.4" step="0.005" value="0.17" class="demo-slider">
      </label>
      <div class="demo-swatch-preview" id="swatch-preview"></div>
    </div>
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
    high: "High (100 target)",
    strong: "Strong (95 target)",
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
    .map((g) => {
      const lightUnmet = s.light.unmetGrades.includes(g);
      const darkUnmet = s.dark.unmetGrades.includes(g);
      const lightVal = s.light.apca[g]!.toFixed(1);
      const darkVal = s.dark.apca[g]!.toFixed(1);
      const lightCell = lightUnmet
        ? `<span class="swatch-unmet">${lightVal} ⚠</span>`
        : lightVal;
      const darkCell = darkUnmet
        ? `<span class="swatch-unmet">${darkVal} ⚠</span>`
        : darkVal;
      return `            <tr><td>${g}</td><td>${lightCell}</td><td>${darkCell}</td></tr>`;
    })
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

.demo-controls { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }

.demo-color-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 500;
}
.demo-color-input {
  width: 2.25rem;
  height: 2.25rem;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  background: none;
  padding: 0;
}
.demo-color-input::-webkit-color-swatch-wrapper { padding: 0; }
.demo-color-input::-webkit-color-swatch { border: none; border-radius: 0.375rem; }

.demo-sliders {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex-wrap: wrap;
  margin-top: 0.25rem;
}
.demo-slider-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}
.demo-slider-label output {
  min-width: 2.5rem;
  text-align: right;
}
.demo-slider {
  width: 120px;
  accent-color: oklch(0.6 0.15 var(--axm-hue, 0));
}
#hue-slider {
  -webkit-appearance: none;
  appearance: none;
  height: 0.5rem;
  border-radius: 0.25rem;
  background: linear-gradient(to right,
    oklch(0.7 0.15 0),
    oklch(0.7 0.15 60),
    oklch(0.7 0.15 120),
    oklch(0.7 0.15 180),
    oklch(0.7 0.15 240),
    oklch(0.7 0.15 300),
    oklch(0.7 0.15 360));
}
#hue-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background: oklch(0.6 0.15 var(--axm-hue, 0));
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  cursor: pointer;
}
#chroma-slider {
  -webkit-appearance: none;
  appearance: none;
  height: 0.5rem;
  border-radius: 0.25rem;
  background: linear-gradient(to right,
    oklch(0.6 0 var(--axm-hue, 0)),
    oklch(0.6 0.1 var(--axm-hue, 0)),
    oklch(0.6 0.2 var(--axm-hue, 0)),
    oklch(0.6 0.3 var(--axm-hue, 0)),
    oklch(0.6 0.4 var(--axm-hue, 0)));
}
#chroma-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background: oklch(0.6 var(--axm-chroma, 0) var(--axm-hue, 0));
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  cursor: pointer;
}
.demo-swatch-preview {
  width: 2rem;
  height: 2rem;
  border-radius: 0.375rem;
  background: oklch(0.6 0.15 0);
  flex-shrink: 0;
}

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
.swatch-unmet { opacity: 0.7; }

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
  // Mode toggle
  var dark = false;
  var btn = document.getElementById('mode-toggle');
  btn.addEventListener('click', function() {
    dark = !dark;
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    btn.textContent = dark ? '☀ Light Mode' : '☮ Dark Mode';
  });

  // Atmosphere state
  var currentHue = 288;
  var currentChroma = 0.17;

  var colorInput = document.getElementById('key-color');
  var hueSlider = document.getElementById('hue-slider');
  var chromaSlider = document.getElementById('chroma-slider');
  var hueVal = document.getElementById('hue-val');
  var chromaVal = document.getElementById('chroma-val');
  var preview = document.getElementById('swatch-preview');

  function applyAtmosphere(h, c) {
    currentHue = h;
    currentChroma = c;
    var surfaces = document.querySelectorAll('[class*="surface-"]');
    surfaces.forEach(function(el) {
      el.style.setProperty('--axm-hue', h);
      el.style.setProperty('--axm-chroma', c);
    });
    hueVal.textContent = Math.round(h);
    chromaVal.textContent = parseFloat(c).toFixed(2);
    preview.style.background = 'oklch(0.6 ' + c + ' ' + h + ')';
  }

  // Hex picker → update sliders + atmosphere
  colorInput.addEventListener('input', function(e) {
    var oklch = hexToOklch(e.target.value);
    hueSlider.value = oklch.h;
    chromaSlider.value = oklch.c;
    applyAtmosphere(parseFloat(oklch.h), parseFloat(oklch.c));
  });

  // Sliders → update atmosphere + sync hex picker
  hueSlider.addEventListener('input', function() {
    applyAtmosphere(parseFloat(hueSlider.value), currentChroma);
    colorInput.value = oklchToHex(0.6, currentChroma, currentHue);
  });
  chromaSlider.addEventListener('input', function() {
    applyAtmosphere(currentHue, parseFloat(chromaSlider.value));
    colorInput.value = oklchToHex(0.6, currentChroma, currentHue);
  });

  // Initialize preview
  applyAtmosphere(currentHue, currentChroma);

  // Minimal hex → OKLch converter (no dependencies)
  function hexToOklch(hex) {
    // Hex → sRGB [0,1]
    var r = parseInt(hex.slice(1,3), 16) / 255;
    var g = parseInt(hex.slice(3,5), 16) / 255;
    var b = parseInt(hex.slice(5,7), 16) / 255;

    // sRGB → linear
    r = r <= 0.04045 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    g = g <= 0.04045 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    b = b <= 0.04045 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

    // Linear sRGB → LMS (Oklab M1)
    var l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
    var m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
    var s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

    // Cube root
    l = Math.cbrt(l); m = Math.cbrt(m); s = Math.cbrt(s);

    // LMS’ → OKLab (M2)
    var L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
    var A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
    var B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;

    // OKLab → OKLch
    var C = Math.sqrt(A * A + B * B);
    var H = Math.atan2(B, A) * 180 / Math.PI;
    if (H < 0) H += 360;
    if (C < 0.001) H = 0; // Achromatic: avoid meaningless hue

    return { l: L, c: C.toFixed(4), h: H.toFixed(4) };
  }

  // OKLch → hex (reverse direction for slider → picker sync)
  function oklchToHex(L, C, H) {
    var hRad = H * Math.PI / 180;
    var a = C * Math.cos(hRad);
    var b = C * Math.sin(hRad);

    // OKLab → LMS' (inverse M2)
    var l = L + 0.3963377774 * a + 0.2158037573 * b;
    var m = L - 0.1055613458 * a - 0.0638541728 * b;
    var s = L - 0.0894841775 * a - 1.2914855480 * b;

    // Cube
    l = l*l*l; m = m*m*m; s = s*s*s;

    // LMS → linear sRGB (inverse M1)
    var r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    var g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    var bb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

    // Linear → sRGB gamma
    function gamma(x) { return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1/2.4) - 0.055; }
    r = Math.round(Math.max(0, Math.min(1, gamma(r))) * 255);
    g = Math.round(Math.max(0, Math.min(1, gamma(g))) * 255);
    bb = Math.round(Math.max(0, Math.min(1, gamma(bb))) * 255);

    return '#' + ((1 << 24) + (r << 16) + (g << 8) + bb).toString(16).slice(1);
  }
})();`;
}

// --- Utility ---

function escapeHTML(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
