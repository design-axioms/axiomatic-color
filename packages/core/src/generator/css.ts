/**
 * CSS generator.
 *
 * Takes SolverOutput and produces CSS using `light-dark()` (§1).
 * Each surface class writes local tokens; text/border utilities
 * consume the nearest ancestor surface's context.
 *
 * Architecture decisions encoded here:
 * - `light-dark()` for mode switching (§1)
 * - Surface classes reset local context (§7, §10)
 * - Atmosphere (hue/chroma) inherits independently of lightness (§9)
 * - Taper as single calc() expression (§5)
 */

import type { SolvedSurface, SolverOutput } from "../types.js";

interface GeneratorOptions {
  prefix?: string;
  selector?: string;
}

/**
 * Generate the complete CSS for a solved color system.
 */
export function generateCSS(
  output: SolverOutput,
  options: GeneratorOptions = {},
): string {
  const prefix = options.prefix ?? "axm";
  const selector = options.selector ?? ":root";

  const sections: string[] = [];

  // Root: color-scheme + registered properties
  sections.push(generateRoot(selector, prefix));

  // Engine: computation layer
  sections.push(generateEngine(prefix));

  // Surface classes
  sections.push(generateSurfaces(output, prefix));

  // Text utilities
  sections.push(generateTextUtilities(prefix));

  // Border utilities
  sections.push(generateBorderUtilities(prefix));

  return sections.join("\n\n");
}

function generateRoot(selector: string, prefix: string): string {
  return `/* Root — color-scheme drives light-dark() */
${selector} {
  color-scheme: light;
}

/* Atmosphere properties — inheriting */
@property --${prefix}-atm-hue {
  syntax: "<number>";
  inherits: true;
  initial-value: 0;
}

@property --${prefix}-atm-chroma {
  syntax: "<number>";
  inherits: true;
  initial-value: 0;
}`;
}

function generateEngine(_prefix: string): string {
  return `/* Engine — computation layer */
/* Surface paint: oklch(lightness, tapered-chroma, hue) */
/* Taper: min(chroma, chroma × (1 - |2L - 1|)) — §5 safe bicone */
/* Text: inherits from nearest surface context */`;
}

function generateSurfaces(output: SolverOutput, prefix: string): string {
  const lines: string[] = ["/* Surface classes */"];

  // Collect all unique surface slugs
  const slugs = new Set<string>();
  for (const s of output.light.surfaces) slugs.add(s.slug);
  for (const s of output.dark.surfaces) slugs.add(s.slug);

  for (const slug of slugs) {
    const light = output.light.surfaces.find((s) => s.slug === slug);
    const dark = output.dark.surfaces.find((s) => s.slug === slug);

    if (!light || !dark) continue;

    lines.push(generateSurfaceClass(slug, light, dark, prefix));

    // State variants
    if (light.states && dark.states) {
      for (const stateName of Object.keys(light.states)) {
        const lightState = light.states[stateName];
        const darkState = dark.states?.[stateName];
        if (lightState && darkState) {
          lines.push(
            generateStateClass(
              slug,
              stateName,
              lightState.lightness,
              darkState.lightness,
              prefix,
            ),
          );
        }
      }
    }
  }

  return lines.join("\n\n");
}

/**
 * Helper: emit an oklch() color string from lightness + atmosphere vars.
 * Atmosphere (hue/chroma) is referenced via custom properties so it
 * inherits independently of lightness (§9).
 * Chroma is tapered near lightness extremes via safe bicone (§5):
 *   min(C, C × (1 - |2L - 1|))
 */
function oklchColor(lightness: number, prefix: string): string {
  const L = lightness.toFixed(4);
  const C = `var(--${prefix}-atm-chroma)`;
  const taper = `calc(${C} * (1 - abs(2 * ${L} - 1)))`;
  return `oklch(${L} ${taper} var(--${prefix}-atm-hue))`;
}

/**
 * Helper: emit a light-dark() expression wrapping two complete oklch() colors.
 * light-dark() only accepts <color> values, not bare numbers.
 */
function lightDarkColor(lightL: number, darkL: number, prefix: string): string {
  return `light-dark(${oklchColor(lightL, prefix)}, ${oklchColor(darkL, prefix)})`;
}

function generateSurfaceClass(
  slug: string,
  light: SolvedSurface,
  dark: SolvedSurface,
  prefix: string,
): string {
  // Atmosphere
  const hue = light.hue ?? 0;
  const chroma = light.chroma ?? 0;

  return `.surface-${slug} {
  --${prefix}-atm-hue: ${hue};
  --${prefix}-atm-chroma: ${chroma};
  --${prefix}-surface: ${lightDarkColor(light.lightness, dark.lightness, prefix)};
  --${prefix}-text-high: ${lightDarkColor(light.textValues.high, dark.textValues.high, prefix)};
  --${prefix}-text-strong: ${lightDarkColor(light.textValues.strong, dark.textValues.strong, prefix)};
  --${prefix}-text-subtle: ${lightDarkColor(light.textValues.subtle, dark.textValues.subtle, prefix)};
  --${prefix}-text-subtlest: ${lightDarkColor(light.textValues.subtlest, dark.textValues.subtlest, prefix)};
  background: var(--${prefix}-surface);
  transition: background 0.3s ease;
}`;
}

function generateStateClass(
  slug: string,
  state: string,
  lightL: number,
  darkL: number,
  prefix: string,
): string {
  // Use pseudo-class for hover/active, explicit class for others
  const selector =
    state === "hover"
      ? `.surface-${slug}:hover`
      : state === "active"
        ? `.surface-${slug}:active`
        : `.surface-${slug}.${state}`;

  return `${selector} {
  --${prefix}-surface: ${lightDarkColor(lightL, darkL, prefix)};
}`;
}

function generateTextUtilities(prefix: string): string {
  return `/* Text utilities — consume nearest surface context */
.text-high { color: var(--${prefix}-text-high); }
.text-strong { color: var(--${prefix}-text-strong); }
.text-subtle { color: var(--${prefix}-text-subtle); }
.text-subtlest { color: var(--${prefix}-text-subtlest); }`;
}

function generateBorderUtilities(_prefix: string): string {
  return `/* Border utilities — placeholder, full implementation TBD */
/* Border targets: decorative (10), interactive (30), critical (80) APCA */`;
}
