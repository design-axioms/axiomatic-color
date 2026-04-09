import "@fontsource/geist-sans/400.css";
import "@fontsource/geist-sans/500.css";
import "@fontsource/geist-sans/600.css";
import "@fontsource/geist-sans/700.css";
import "@fontsource/geist-mono/400.css";
import "@fontsource/geist-mono/500.css";
import "@fontsource/geist-mono/600.css";
import {
  solve,
  DEFAULT_CONFIG,
  generateCSS,
  createThemeBuilder,
  registerColorSlider,
} from "@design-axioms/color/browser";

// Register <color-slider> custom element
registerColorSlider();

// Solve and inject system CSS
const output = solve(DEFAULT_CONFIG);
const css = generateCSS(output, DEFAULT_CONFIG.options);

const style = document.createElement("style");
style.textContent = css;
document.head.appendChild(style);

// ThemeBuilder handles polarity flips for spotlight
const builder = createThemeBuilder();

// Mode toggle
let dark = false;
const btn = document.getElementById("mode-toggle")!;
btn.addEventListener("click", () => {
  dark = !dark;
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
  btn.textContent = dark ? "☀ Light Mode" : "● Dark Mode";
});

// Atmosphere sliders
const hueSlider = document.querySelector<HTMLElement>("#hue-slider")!;
const chromaSlider = document.querySelector<HTMLElement>("#chroma-slider")!;
const hueVal = document.getElementById("hue-val")!;
const chromaVal = document.getElementById("chroma-val")!;

function applyAtmosphere(h: number, c: number): void {
  const surfaces = document.querySelectorAll<HTMLElement>(
    '[class*="surface-"]',
  );
  for (const el of surfaces) {
    el.style.setProperty("--axm-atm-hue", String(h));
    el.style.setProperty("--axm-atm-chroma", String(c));
  }
  hueVal.textContent = String(Math.round(h));
  chromaVal.textContent = c.toFixed(2);

  // Sync slider attributes so gradients update
  hueSlider.setAttribute("hue", String(h));
  hueSlider.setAttribute("chroma", String(c));
  chromaSlider.setAttribute("hue", String(h));
  chromaSlider.setAttribute("chroma", String(c));
}

hueSlider.addEventListener("input", (e: Event) => {
  const h = (e as CustomEvent).detail.value;
  hueSlider.setAttribute("value", String(h));
  applyAtmosphere(h, parseFloat(chromaSlider.getAttribute("value") ?? "0.17"));
});
chromaSlider.addEventListener("input", (e: Event) => {
  const c = (e as CustomEvent).detail.value;
  chromaSlider.setAttribute("value", String(c));
  applyAtmosphere(parseFloat(hueSlider.getAttribute("value") ?? "288"), c);
});

// Initialize
applyAtmosphere(288, 0.17);
