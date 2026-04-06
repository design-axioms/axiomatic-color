/// <reference lib="dom" />

/**
 * <color-slider> custom element.
 *
 * A styled range input with oklch gradient track and colored thumb.
 * Works in any context — Vue templates, vanilla HTML, shadow DOM.
 *
 * Attributes:
 *   type      — "hue" or "chroma" (determines gradient shape)
 *   value     — current numeric value
 *   hue       — current hue angle (used for chroma gradient and thumb color)
 *   chroma    — current chroma (used for thumb color)
 *   min       — range minimum (default: 0)
 *   max       — range maximum (default: 360 for hue, 0.4 for chroma)
 *   step      — range step (default: 1 for hue, 0.005 for chroma)
 *   muted     — use muted gradient (lighter, lower chroma)
 *   landmarks — JSON array of {value, color, name?} for track markers
 *
 * Events:
 *   input          — fires on value change, detail: { value: number }
 *   landmark-click — fires when a landmark is clicked, detail: { value, color, name? }
 */

const sheet = new CSSStyleSheet();
sheet.replaceSync(`
  :host {
    display: inline-flex;
    align-items: center;
    position: relative;
  }

  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 0.5rem;
    border-radius: 0.25rem;
    background: var(--_track);
    outline: none;
    margin: 0;
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
    position: relative;
    z-index: 1;
  }

  input[type="range"]::-moz-range-thumb {
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    background: var(--_thumb);
    border: 2px solid white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    cursor: pointer;
    position: relative;
    z-index: 1;
  }

  .landmark {
    position: absolute;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    border: 1.5px solid white;
    box-shadow: 0 0 0 0.5px rgba(0,0,0,0.2);
    top: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    cursor: pointer;
  }
`);

function hueGradient(muted: boolean): string {
  const l = muted ? 0.85 : 0.7;
  const c = muted ? 0.06 : 0.15;
  return `linear-gradient(to right, ${[0, 60, 120, 180, 240, 300, 360].map((h) => `oklch(${l} ${c} ${h})`).join(", ")})`;
}

function chromaGradient(hue: number, muted: boolean): string {
  const l = muted ? 0.82 : 0.6;
  const maxC = muted ? 0.12 : 0.3;
  return `linear-gradient(to right, oklch(${l} 0 ${hue}), oklch(${l} ${maxC / 2} ${hue}), oklch(${l} ${maxC} ${hue}))`;
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
    "muted",
    "landmarks",
  ];

  #input: HTMLInputElement;
  #shadow: ShadowRoot;
  #landmarks: HTMLElement[] = [];

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
    const muted = this.hasAttribute("muted");

    const track = type === "hue" ? hueGradient(muted) : chromaGradient(hue, muted);
    const thumb = thumbColor(hue, chroma);

    this.#input.style.setProperty("--_track", track);
    this.#input.style.setProperty("--_thumb", thumb);

    this.#updateLandmarks();
  }

  #updateLandmarks(): void {
    const raw = this.getAttribute("landmarks");
    if (!raw) {
      for (const el of this.#landmarks) el.remove();
      this.#landmarks = [];
      return;
    }

    let items: { value: number; color: string; name?: string }[];
    try {
      items = JSON.parse(raw);
    } catch {
      return;
    }

    const min = parseFloat(this.#input.min);
    const max = parseFloat(this.#input.max);
    const range = max - min;

    // Reconcile DOM: add/remove to match count
    while (this.#landmarks.length < items.length) {
      const dot = document.createElement("span");
      dot.className = "landmark";
      dot.addEventListener("click", (e) => {
        e.stopPropagation();
        const idx = this.#landmarks.indexOf(dot);
        if (idx >= 0 && items[idx]) {
          this.dispatchEvent(
            new CustomEvent("landmark-click", {
              detail: items[idx],
              bubbles: true,
            }),
          );
        }
      });
      this.#shadow.appendChild(dot);
      this.#landmarks.push(dot);
    }
    while (this.#landmarks.length > items.length) {
      this.#landmarks.pop()!.remove();
    }

    // Position each landmark using the same percentage the input uses
    for (let i = 0; i < items.length; i++) {
      const item = items[i]!;
      const dot = this.#landmarks[i]!;
      const pct = ((item.value - min) / range) * 100;
      // The input thumb center at X% sits at: thumbRadius + X% * (inputWidth - 2*thumbRadius)
      // As a CSS calc: calc(0.5rem + pct% * (100% - 1rem))
      dot.style.left = `calc(0.5rem + ${pct / 100} * (100% - 1rem))`;
      dot.style.background = item.color;
      dot.title = item.name ?? "";
      dot.style.pointerEvents = "auto";
    }
  }
}

export function registerColorSlider(name = "color-slider"): void {
  if (!customElements.get(name)) {
    customElements.define(name, ColorSlider);
  }
}
