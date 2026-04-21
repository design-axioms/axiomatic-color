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

import type { SolvedSurface, SolverOutput, SurfaceRole } from "../types.ts";
import { converter, formatHex, parse } from "culori";

const toOklch = converter("oklch");

interface GeneratorOptions {
  prefix?: string;
  selector?: string;
  keyColors?: Record<string, string>;
  /**
   * When set, also emit a class-triggered copy of the high-contrast
   * overrides that matches any ancestor with this class. Intended for
   * demo/preview simulation — a docs demo can apply the class to
   * visualize HC mode without changing OS settings. Leave unset in
   * production CSS; rely on the media query alone.
   */
  highContrastSimulationClass?: string;
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

  // High-contrast overrides — re-solve with tighter targets/scale.
  // Must come BEFORE forced-colors so forced-colors wins the cascade
  // for users who have both (per MDN: `prefers-contrast: custom` matches
  // forced-colors users).
  const hcSection = generateHighContrast(output, prefix);
  if (hcSection) sections.push(hcSection);
  if (options.highContrastSimulationClass) {
    const simSection = generateHighContrastSimulation(
      output,
      prefix,
      options.highContrastSimulationClass,
    );
    if (simSection) sections.push(simSection);
  }

  // Forced-colors overrides — cede colors to OS palette per surface role
  sections.push(generateForcedColors(output, prefix));

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
  color-scheme: light;
  --${prefix}-hue: 0;
  --${prefix}-chroma: 0;${keyColorLines}
}

/* Hue/chroma properties — inheriting */
@property --${prefix}-hue {
  syntax: "<number>";
  inherits: true;
  initial-value: 0;
}

@property --${prefix}-chroma {
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
  const C = `var(--${prefix}-chroma)`;
  const taper = `calc(${C} * (1 - abs(2 * ${L} - 1)))`;
  return `oklch(${L} ${taper} var(--${prefix}-hue))`;
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
  // Atmosphere (hue/chroma) is never emitted on surface classes.
  // It inherits purely via CSS cascade, or is set explicitly via
  // hue utility classes (.hue-brand, etc.). Configured hue/chroma
  // on a surface affects solver math (safety margins) but not CSS output.

  // Inverted surfaces swap branches so that light-dark() picks the
  // opposite mode's values. Combined with color-scheme flipping,
  // this makes nesting work: children inherit color-scheme and
  // resolve their own light-dark() to the correct branch.
  const [lb, db] =
    light.polarity === "inverted" ? [dark, light] : [light, dark];

  const colorScheme =
    light.polarity === "inverted" ? `\n  color-scheme: dark;` : "";

  return `.surface-${slug} {
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
  // .text-link defaults to the strongest tier so links stay readable
  // even before forced-colors overrides LinkText.
  // .text-disabled defaults to subtlest and is remapped to GrayText
  // under forced-colors.
  return `/* Text utilities — consume nearest surface context */
.text-high { color: var(--${prefix}-text-high); }
.text-strong { color: var(--${prefix}-text-strong); }
.text-subtle { color: var(--${prefix}-text-subtle); }
.text-subtlest { color: var(--${prefix}-text-subtlest); }
.text-link { color: var(--${prefix}-text-link, var(--${prefix}-text-strong)); text-decoration: underline; }
.text-disabled { color: var(--${prefix}-text-disabled, var(--${prefix}-text-subtlest)); }`;
}

function generateBorderUtilities(prefix: string): string {
  return `/* Border utilities — consume nearest surface context */
.border-decorative { border-color: var(--${prefix}-border-decorative); }
.border-interactive { border-color: var(--${prefix}-border-interactive); }
.border-critical { border-color: var(--${prefix}-border-critical); }`;
}

/**
 * System color mapping per surface role under `forced-colors: active`.
 *
 * When forced-colors is on, the OS supplies a restricted palette
 * (CSS system color keywords). We cede our solved oklch() values and
 * map each surface to the appropriate system keyword based on its role.
 *
 * `alert` uses a cascade fallback: declare Canvas/CanvasText first, then
 * override with Mark/MarkText — browsers that support Mark use it,
 * older ones keep the Canvas baseline.
 */
function forcedColorsForRole(role: SurfaceRole): {
  bg: string;
  fg: readonly string[];
  border?: string;
} {
  switch (role) {
    case "interactive":
      return {
        bg: "ButtonFace",
        fg: ["ButtonText"],
        border: "ButtonBorder",
      };
    case "alert":
      // Baseline + enhancement. Browsers that support Mark will apply
      // the second declaration; older ones keep the Canvas baseline.
      return {
        bg: "Canvas",
        fg: ["CanvasText", "Mark"],
      };
    case "link":
      return {
        bg: "Canvas",
        fg: ["LinkText"],
      };
    case "surface":
    default:
      return {
        bg: "Canvas",
        fg: ["CanvasText"],
      };
  }
}

/**
 * Emit high-contrast overrides under
 * `@media (prefers-contrast: more), (prefers-contrast: custom)`.
 *
 * For each surface with HC companion values (light + dark both present),
 * write a rule that updates --axm-surface / --axm-text-* / --axm-border-*
 * to the HC-solved values.
 *
 * CRITICAL: inverted surfaces require the same branch swap as the base
 * surface class. Without it, HC values land in the wrong light-dark()
 * branch for inverted surfaces, breaking polarity under HC mode.
 *
 * Returns null if no surface has HC companion values — nothing to emit.
 */
function generateHighContrast(
  output: SolverOutput,
  prefix: string,
): string | null {
  const slugs = new Set<string>();
  for (const s of output.light.surfaces) {
    if (s.lightnessHighContrast !== undefined) slugs.add(s.slug);
  }
  for (const s of output.dark.surfaces) {
    if (s.lightnessHighContrast !== undefined) slugs.add(s.slug);
  }
  if (slugs.size === 0) return null;

  const lines: string[] = [
    "/* High contrast — re-solved with tighter targets/scale */",
    "@media (prefers-contrast: more), (prefers-contrast: custom) {",
  ];

  for (const slug of slugs) {
    const light = output.light.surfaces.find((s) => s.slug === slug);
    const dark = output.dark.surfaces.find((s) => s.slug === slug);
    if (!light || !dark) continue;
    if (
      light.lightnessHighContrast === undefined ||
      dark.lightnessHighContrast === undefined ||
      !light.textValuesHighContrast ||
      !dark.textValuesHighContrast
    ) {
      continue;
    }

    // Branch swap for inverted polarity, matching generateSurfaceClass.
    // Without this, HC values land in the wrong light-dark() branch and
    // inverted surfaces invert the wrong way under HC.
    const [lb, db] =
      light.polarity === "inverted" ? [dark, light] : [light, dark];

    const lbL = lb.lightnessHighContrast!;
    const dbL = db.lightnessHighContrast!;
    const lbText = lb.textValuesHighContrast!;
    const dbText = db.textValuesHighContrast!;
    const lbBorders = lb.borderValuesHighContrast;
    const dbBorders = db.borderValuesHighContrast;

    const body: string[] = [];
    body.push(
      `    --${prefix}-surface: ${lightDarkColor(lbL, dbL, prefix)};`,
    );
    body.push(
      `    --${prefix}-text-high: ${lightDarkColor(lbText.high, dbText.high, prefix)};`,
    );
    body.push(
      `    --${prefix}-text-strong: ${lightDarkColor(lbText.strong, dbText.strong, prefix)};`,
    );
    body.push(
      `    --${prefix}-text-subtle: ${lightDarkColor(lbText.subtle, dbText.subtle, prefix)};`,
    );
    body.push(
      `    --${prefix}-text-subtlest: ${lightDarkColor(lbText.subtlest, dbText.subtlest, prefix)};`,
    );
    if (lbBorders && dbBorders) {
      body.push(
        `    --${prefix}-border-decorative: ${lightDarkColor(lbBorders.decorative, dbBorders.decorative, prefix)};`,
      );
      body.push(
        `    --${prefix}-border-interactive: ${lightDarkColor(lbBorders.interactive, dbBorders.interactive, prefix)};`,
      );
      body.push(
        `    --${prefix}-border-critical: ${lightDarkColor(lbBorders.critical, dbBorders.critical, prefix)};`,
      );
    }

    lines.push(`  .surface-${slug} {`);
    lines.push(...body);
    lines.push("  }");
  }

  lines.push("}");
  return lines.join("\n");
}

/**
 * Emit a class-triggered HC variant for demo/preview simulation.
 *
 * Produces selectors like `.hc-simulate .surface-page { ... }` so a docs
 * demo can add a class to the root and visualize HC mode. Uses the same
 * values and branch-swap as the media-query block.
 */
function generateHighContrastSimulation(
  output: SolverOutput,
  prefix: string,
  simClass: string,
): string | null {
  const slugs = new Set<string>();
  for (const s of output.light.surfaces) {
    if (s.lightnessHighContrast !== undefined) slugs.add(s.slug);
  }
  for (const s of output.dark.surfaces) {
    if (s.lightnessHighContrast !== undefined) slugs.add(s.slug);
  }
  if (slugs.size === 0) return null;

  const lines: string[] = [
    `/* High contrast simulation — class-triggered for demo preview */`,
  ];

  for (const slug of slugs) {
    const light = output.light.surfaces.find((s) => s.slug === slug);
    const dark = output.dark.surfaces.find((s) => s.slug === slug);
    if (
      !light ||
      !dark ||
      light.lightnessHighContrast === undefined ||
      dark.lightnessHighContrast === undefined ||
      !light.textValuesHighContrast ||
      !dark.textValuesHighContrast
    ) {
      continue;
    }
    const [lb, db] =
      light.polarity === "inverted" ? [dark, light] : [light, dark];
    const lbL = lb.lightnessHighContrast!;
    const dbL = db.lightnessHighContrast!;
    const lbText = lb.textValuesHighContrast!;
    const dbText = db.textValuesHighContrast!;
    const lbBorders = lb.borderValuesHighContrast;
    const dbBorders = db.borderValuesHighContrast;

    const body: string[] = [];
    body.push(`  --${prefix}-surface: ${lightDarkColor(lbL, dbL, prefix)};`);
    body.push(
      `  --${prefix}-text-high: ${lightDarkColor(lbText.high, dbText.high, prefix)};`,
    );
    body.push(
      `  --${prefix}-text-strong: ${lightDarkColor(lbText.strong, dbText.strong, prefix)};`,
    );
    body.push(
      `  --${prefix}-text-subtle: ${lightDarkColor(lbText.subtle, dbText.subtle, prefix)};`,
    );
    body.push(
      `  --${prefix}-text-subtlest: ${lightDarkColor(lbText.subtlest, dbText.subtlest, prefix)};`,
    );
    if (lbBorders && dbBorders) {
      body.push(
        `  --${prefix}-border-decorative: ${lightDarkColor(lbBorders.decorative, dbBorders.decorative, prefix)};`,
      );
      body.push(
        `  --${prefix}-border-interactive: ${lightDarkColor(lbBorders.interactive, dbBorders.interactive, prefix)};`,
      );
      body.push(
        `  --${prefix}-border-critical: ${lightDarkColor(lbBorders.critical, dbBorders.critical, prefix)};`,
      );
    }

    // Match three ways so the class can sit on <html>, on the same
    // element as the surface, or (via :host-context) on an ancestor of
    // a shadow-root host.
    lines.push(
      `.${simClass} .surface-${slug}, .${simClass}.surface-${slug}, :host-context(.${simClass}) .surface-${slug} {`,
    );
    lines.push(...body);
    lines.push(`}`);
  }

  return lines.join("\n");
}

function generateForcedColors(output: SolverOutput, prefix: string): string {
  const lines: string[] = [
    "/* Forced colors — cede to OS palette per surface role */",
    "@media (forced-colors: active) {",
  ];

  // One rule per surface slug. Use the light-mode solved surface as
  // the source of role (role is mode-invariant).
  const slugs = new Set<string>();
  for (const s of output.light.surfaces) slugs.add(s.slug);
  for (const s of output.dark.surfaces) slugs.add(s.slug);

  for (const slug of slugs) {
    const surface = output.light.surfaces.find((s) => s.slug === slug);
    if (!surface) continue;

    const mapping = forcedColorsForRole(surface.role);

    const body: string[] = [];
    body.push(`    --${prefix}-surface: ${mapping.bg};`);

    // Text tokens all map to the role's primary fg. For alert-role the
    // fg array has two entries (e.g. [CanvasText, Mark]) — the second
    // overrides the first via cascade, so browsers that support Mark
    // use it and others keep the Canvas baseline.
    for (const fg of mapping.fg) {
      body.push(`    --${prefix}-text-high: ${fg};`);
      body.push(`    --${prefix}-text-strong: ${fg};`);
      body.push(`    --${prefix}-text-subtle: ${fg};`);
      body.push(`    --${prefix}-text-subtlest: ${fg};`);
    }

    // Role-independent: links always get LinkText, disabled always GrayText.
    body.push(`    --${prefix}-text-link: LinkText;`);
    body.push(`    --${prefix}-text-disabled: GrayText;`);

    // Border tokens: decorative + critical use the same text color so
    // they contrast against Canvas; interactive uses ButtonBorder when
    // applicable, else CanvasText.
    const borderPrimary = mapping.border ?? "CanvasText";
    body.push(`    --${prefix}-border-decorative: CanvasText;`);
    body.push(`    --${prefix}-border-interactive: ${borderPrimary};`);
    body.push(`    --${prefix}-border-critical: CanvasText;`);

    lines.push(`  .surface-${slug} {`);
    lines.push(...body);
    lines.push("  }");
  }

  lines.push("}");
  return lines.join("\n");
}

/** Parse a key color to oklch hue and chroma. */
export function parseKeyColor(
  color: string,
): { hue: number; chroma: number } | null {
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
  --${prefix}-hue: var(--${prefix}-key-${name}-hue);
  --${prefix}-chroma: var(--${prefix}-key-${name}-chroma);
}`);
  }
  return lines.join("\n\n");
}
