/// <reference lib="dom" />

/**
 * <color-slider> custom element.
 *
 * A styled range input with oklch gradient track and colored thumb.
 * Works in any context — Vue templates, vanilla HTML, shadow DOM.
 *
 * Attributes:
 *   type    — "hue" or "chroma" (determines gradient shape)
 *   value   — current numeric value
 *   hue     — current hue angle (used for chroma gradient and thumb color)
 *   chroma  — current chroma (used for thumb color)
 *   min     — range minimum (default: 0)
 *   max     — range maximum (default: 360 for hue, 0.4 for chroma)
 *   step    — range step (default: 1 for hue, 0.005 for chroma)
 *
 * Events:
 *   input   — fires on value change, detail: { value: number }
 */

const sheet = new CSSStyleSheet();
sheet.replaceSync(`
  :host {
    display: inline-flex;
    align-items: center;
  }

  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    width: 120px;
    height: 0.5rem;
    border-radius: 0.25rem;
    background: var(--_track);
    outline: none;
  }

  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    background: var(--_thumb);
    border: 2px solid white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    cursor: pointer;
  }

  input[type="range"]::-moz-range-thumb {
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    background: var(--_thumb);
    border: 2px solid white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    cursor: pointer;
  }
`);

const HUE_GRADIENT = `linear-gradient(to right, ${[0, 60, 120, 180, 240, 300, 360].map((h) => `oklch(0.7 0.15 ${h})`).join(", ")})`;

function chromaGradient(hue: number): string {
  return `linear-gradient(to right, oklch(0.6 0 ${hue}), oklch(0.6 0.15 ${hue}), oklch(0.6 0.3 ${hue}))`;
}

function thumbColor(hue: number, chroma: number): string {
  return `oklch(0.6 ${chroma} ${hue})`;
}

export class ColorSlider extends HTMLElement {
  static observedAttributes = [
    "type",
    "value",
    "hue",
    "chroma",
    "min",
    "max",
    "step",
  ];

  #input: HTMLInputElement;
  #shadow: ShadowRoot;

  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: "open" });
    this.#shadow.adoptedStyleSheets = [sheet];

    this.#input = document.createElement("input");
    this.#input.type = "range";
    this.#shadow.appendChild(this.#input);

    this.#input.addEventListener("input", (e) => {
      e.stopPropagation();
      const val = parseFloat(this.#input.value);
      this.setAttribute("value", String(val));
      this.dispatchEvent(
        new CustomEvent("input", { detail: { value: val }, bubbles: true }),
      );
    });
  }

  connectedCallback(): void {
    this.#syncAttributes();
    this.#updateStyles();
  }

  attributeChangedCallback(): void {
    this.#syncAttributes();
    this.#updateStyles();
  }

  get value(): number {
    return parseFloat(this.#input.value);
  }

  set value(v: number) {
    this.#input.value = String(v);
    this.setAttribute("value", String(v));
    this.#updateStyles();
  }

  #syncAttributes(): void {
    const type = this.getAttribute("type") ?? "hue";
    const defaults =
      type === "hue"
        ? { min: "0", max: "360", step: "1" }
        : { min: "0", max: "0.4", step: "0.005" };

    this.#input.min = this.getAttribute("min") ?? defaults.min;
    this.#input.max = this.getAttribute("max") ?? defaults.max;
    this.#input.step = this.getAttribute("step") ?? defaults.step;
    this.#input.value =
      this.getAttribute("value") ?? (type === "hue" ? "0" : "0.1");
  }

  #updateStyles(): void {
    const type = this.getAttribute("type") ?? "hue";
    const hue = parseFloat(this.getAttribute("hue") ?? "0");
    const chroma = parseFloat(this.getAttribute("chroma") ?? "0.15");

    const track = type === "hue" ? HUE_GRADIENT : chromaGradient(hue);
    const thumb = thumbColor(hue, chroma);

    this.#input.style.setProperty("--_track", track);
    this.#input.style.setProperty("--_thumb", thumb);
  }
}

export function registerColorSlider(name = "color-slider"): void {
  if (!customElements.get(name)) {
    customElements.define(name, ColorSlider);
  }
}
