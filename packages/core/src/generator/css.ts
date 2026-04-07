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
import { converter, formatHex, parse } from "culori";

const toOklch = converter("oklch");

interface GeneratorOptions {
  prefix?: string;
  selector?: string;
  keyColors?: Record<string, string>;
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

  const keyColors = options.keyColors;

  // Root: color-scheme + registered properties + key color primitives
  sections.push(generateRoot(selector, prefix, keyColors));

  // Engine: computation layer
  sections.push(generateEngine(prefix));

  // Surface classes
  sections.push(generateSurfaces(output, prefix));

  // Text utilities
  sections.push(generateTextUtilities(prefix));

  // Border utilities
  sections.push(generateBorderUtilities(prefix));

  // Hue utilities — atmosphere modifiers from key colors
  if (keyColors) {
    sections.push(generateHueUtilities(prefix, keyColors));
  }

  return sections.join("\n\n");
}

function generateRoot(
  selector: string,
  prefix: string,
  keyColors?: Record<string, string>,
): string {
  const keyColorLines = keyColors
    ? generateKeyColorPrimitives(prefix, keyColors)
    : "";
  return `/* Root — color-scheme drives light-dark() */
${selector} {
  color-scheme: light;${keyColorLines}
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
 * The min() is omitted in output: since L ∈ [0,1], the taper factor
 * (1 - |2L - 1|) is always in [0,1], so C × t ≤ C always holds.
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
  // Atmosphere: only emit hue/chroma when configured, so unconfigured
  // surfaces inherit from their parent instead of resetting to 0.
  const hue = light.hue ?? null;
  const chroma = light.chroma ?? null;
  const atmLines = hue !== null || chroma !== null
    ? `\n  --${prefix}-atm-hue: ${hue ?? 0};\n  --${prefix}-atm-chroma: ${chroma ?? 0};`
    : "";

  // Inverted surfaces swap branches so that light-dark() picks the
  // opposite mode's values. Combined with color-scheme flipping,
  // this makes nesting work: children inherit color-scheme and
  // resolve their own light-dark() to the correct branch.
  const [lb, db] = light.polarity === "inverted" ? [dark, light] : [light, dark];

  const colorScheme = light.polarity === "inverted"
    ? `\n  color-scheme: dark;`
    : "";

  return `.surface-${slug} {${atmLines}
  --${prefix}-surface: ${lightDarkColor(lb.lightness, db.lightness, prefix)};
  --${prefix}-text-high: ${lightDarkColor(lb.textValues.high, db.textValues.high, prefix)};
  --${prefix}-text-strong: ${lightDarkColor(lb.textValues.strong, db.textValues.strong, prefix)};
  --${prefix}-text-subtle: ${lightDarkColor(lb.textValues.subtle, db.textValues.subtle, prefix)};
  --${prefix}-text-subtlest: ${lightDarkColor(lb.textValues.subtlest, db.textValues.subtlest, prefix)};${
    lb.borderValues && db.borderValues
      ? `
  --${prefix}-border-decorative: ${lightDarkColor(lb.borderValues.decorative, db.borderValues.decorative, prefix)};
  --${prefix}-border-interactive: ${lightDarkColor(lb.borderValues.interactive, db.borderValues.interactive, prefix)};
  --${prefix}-border-critical: ${lightDarkColor(lb.borderValues.critical, db.borderValues.critical, prefix)};`
      : ""
  }
  background: var(--${prefix}-surface);
  transition: background 0.3s ease;${colorScheme}
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

function generateBorderUtilities(prefix: string): string {
  return `/* Border utilities — consume nearest surface context */
.border-decorative { border-color: var(--${prefix}-border-decorative); }
.border-interactive { border-color: var(--${prefix}-border-interactive); }
.border-critical { border-color: var(--${prefix}-border-critical); }`;
}

/** Parse a key color to oklch hue and chroma. */
export function parseKeyColor(color: string): { hue: number; chroma: number } | null {
  const parsed = parse(color);
  if (!parsed) return null;
  const oklch = toOklch(parsed);
  return {
    hue: (oklch as unknown as { h?: number }).h ?? 0,
    chroma: (oklch as unknown as { c?: number }).c ?? 0,
  };
}

/** Convert oklch components to a hex string. */
export function formatOklchHex(l: number, c: number, h: number): string {
  return formatHex({ mode: "oklch", l, c, h }) ?? "#000000";
}

/** Generate key color primitive variables for the root block. */
function generateKeyColorPrimitives(
  prefix: string,
  keyColors: Record<string, string>,
): string {
  const lines: string[] = [];
  for (const [name, value] of Object.entries(keyColors)) {
    const parsed = parseKeyColor(value);
    if (!parsed) continue;
    lines.push(`  --${prefix}-key-${name}-hue: ${parsed.hue.toFixed(4)};`);
    lines.push(
      `  --${prefix}-key-${name}-chroma: ${parsed.chroma.toFixed(4)};`,
    );
  }
  return lines.length > 0 ? "\n" + lines.join("\n") : "";
}

/**
 * Generate .hue-* utility classes from key colors.
 * These override atmosphere (hue/chroma) without touching lightness.
 * Per the composition algebra: M(Sigma) -> <H_brand, C_brand, L>
 */
function generateHueUtilities(
  prefix: string,
  keyColors: Record<string, string>,
): string {
  const lines: string[] = ["/* Hue utilities — atmosphere modifiers */"];
  for (const name of Object.keys(keyColors)) {
    lines.push(`.hue-${name} {
  --${prefix}-atm-hue: var(--${prefix}-key-${name}-hue);
  --${prefix}-atm-chroma: var(--${prefix}-key-${name}-chroma);
}`);
  }
  return lines.join("\n\n");
}
