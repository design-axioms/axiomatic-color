/**
 * Core type definitions for the Axiomatic Color System.
 *
 * Architecture decisions encoded here:
 * - Mode is binary (light/dark), not continuous — driven by `light-dark()`
 * - Polarity selects between two independent lightness scales
 * - Context = Polarity × Mode — the minimal input for all color math
 * - Surfaces have semantic identity, not positional (no nesting depth)
 * - A surface's lightness is its scale position — no optimization, no spreading
 */

// --- Primitives ---

export type Mode = "light" | "dark";
export type Polarity = "page" | "inverted";

/**
 * The minimal context for all color math operations.
 * Polarity selects the lightness scale; mode selects the branch.
 */
export interface Context {
  readonly polarity: Polarity;
  readonly mode: Mode;
}

/** Oklch color components. */
export interface Oklch {
  readonly l: number; // 0–1
  readonly c: number; // 0–~0.4
  readonly h: number; // 0–360
}

// --- Text Grades ---

/**
 * APCA contrast targets for text grades.
 * These are the system's Tier 1 guarantees.
 */
export interface TextGrades {
  readonly high: number; // 100 — high contrast, achievable on primary reading surfaces
  readonly strong: number; // 95  — body text
  readonly subtle: number; // 90  — secondary text
  readonly subtlest: number; // 75  — tertiary/hint text
}

export const TEXT_GRADES: TextGrades = {
  high: 100,
  strong: 95,
  subtle: 90,
  subtlest: 75,
} as const;

/**
 * High-contrast default targets.
 *
 * The library defaults are conservative: `high` stays capped at 100 (the
 * APCA practical ceiling), and each lower grade bumps up one tier. Users
 * with stricter accessibility needs can override via
 * `config.accessibility.textGrades`.
 */
export const TEXT_GRADES_HIGH_CONTRAST: TextGrades = {
  high: 100,
  strong: 100,
  subtle: 95,
  subtlest: 90,
} as const;

/**
 * APCA dead zone — the lightness range where neither polarity can
 * produce adequate text contrast. Surfaces placed here get diagnostics.
 */
export const DEAD_ZONE = { min: 0.46, max: 0.82 } as const;

/**
 * Default APCA threshold for cross-surface distinction.
 *
 * Derived from APCA's "essential non-text content" guidance (Lc 45):
 * above this, a surface edge is reliably perceivable for the same
 * population our text targets are calibrated for. Below it, the
 * library emits a distinction mechanism so adjacent surfaces remain
 * structurally distinguishable.
 *
 * See architecture §6.
 */
export const DISTINCTION_THRESHOLD_DEFAULT = 45;

// --- Safety Margins ---

/**
 * Hue-dependent safety margins per chroma level.
 * The solver adds these to APCA targets to guarantee
 * the target is met at worst-case hue (Helmholtz-Kohlrausch).
 */
export interface SafetyMargin {
  readonly chroma: number;
  readonly margin: number; // APCA points to add
}

export const SAFETY_MARGINS: readonly SafetyMargin[] = [
  { chroma: 0.05, margin: 2 },
  { chroma: 0.1, margin: 3 },
  { chroma: 0.15, margin: 4 },
  { chroma: 0.2, margin: 5 },
] as const;

// --- Scale ---

/**
 * A lightness scale for one mode (light or dark).
 *
 * Surface positions index directly into this array. The array length
 * defines the number of available positions; surfaces choose which ones
 * to occupy.
 *
 * Architecture (§3): each polarity has its own independent scale.
 * The page scale and inverted scale can have different lengths and
 * spacing — they are context resets, not two ends of the same line.
 */
export type ModeScale = readonly number[];

/**
 * A polarity's scale across both modes.
 * Both modes must have the same length — a surface at position N must
 * exist in both light and dark.
 *
 * `highContrast` is an optional parallel scale used under
 * `prefers-contrast: more | custom`. When present, the solver produces
 * a second set of solved values against it; when absent, HC mode falls
 * back to bumping targets on the base scale.
 */
export interface PolarityScale {
  readonly light: ModeScale;
  readonly dark: ModeScale;
  readonly highContrast?: {
    readonly light: ModeScale;
    readonly dark: ModeScale;
  };
}

/**
 * Full scale configuration.
 * Two independent polarity scales (§3).
 */
export interface Scale {
  readonly page: PolarityScale;
  readonly inverted: PolarityScale;
}

// --- Surfaces ---

/**
 * Interaction state offset, expressed as a step along the scale.
 *
 * Positive = move toward higher-index (darker-in-light, lighter-in-dark).
 * Negative = move toward lower-index.
 *
 * Example: on a page surface at position 2, `positionOffset: 1` resolves
 * to `scale.page.light[3]` / `scale.page.dark[3]`.
 */
export interface SurfaceState {
  readonly positionOffset: number;
}

/**
 * Semantic role of a surface.
 *
 * Drives accessibility regimes (forced-colors, prefers-contrast) without
 * re-authoring the rest of the config. The role is what tells the
 * generator which system color to cede to under `forced-colors: active`.
 *
 * - "surface" — standard content surface (Canvas / CanvasText)
 * - "interactive" — button-like (ButtonFace / ButtonText / ButtonBorder)
 * - "alert" — status/notification (prefers Mark/MarkText, falls back to Canvas)
 * - "link" — hyperlink (LinkText)
 *
 * Default is "surface".
 */
export type SurfaceRole = "surface" | "interactive" | "alert" | "link";

/**
 * Configuration for a single semantic surface.
 *
 * Key principle (§7): a surface's lightness is determined by its semantic
 * identity (slug + polarity + scale position), not by DOM nesting.
 */
export interface SurfaceConfig {
  readonly position: number;
  readonly label?: string;
  readonly description?: string;
  readonly hue?: string; // key color name
  readonly targetChroma?: number;
  readonly role?: SurfaceRole;
  readonly states?: { readonly [stateName: string]: SurfaceState };
}

/**
 * A surface is either a bare position (shorthand) or a full config.
 * Shorthand `{ card: 2 }` is equivalent to `{ card: { position: 2 } }`.
 */
export type SurfaceSpec = number | SurfaceConfig;

/**
 * Surfaces grouped by polarity.
 *
 * The outer keys (`page` / `inverted`) encode polarity as a structural
 * fact rather than a per-surface tag (§3: polarity is a context reset).
 * Surface slugs are the inner keys and should be unique across both
 * buckets.
 */
export interface Surfaces {
  readonly page: { readonly [slug: string]: SurfaceSpec };
  readonly inverted: { readonly [slug: string]: SurfaceSpec };
}

// --- Composition Classification ---

/**
 * Three-tier composition contract (§6).
 *
 * The solver classifies each surface relationship:
 * - guarantee: cross-polarity, massive APCA gap
 * - enhancement: same-polarity lightness stagger (real but not load-bearing)
 */
export type CompositionTier = "guarantee" | "enhancement";

export interface CompositionReport {
  readonly surfaceA: string;
  readonly surfaceB: string;
  readonly interContrast: number;
  readonly tier: CompositionTier;
}

// --- Solver Config ---

/**
 * Border contrast targets per tier.
 */
export interface BorderTargets {
  readonly decorative: number;
  readonly interactive: number;
  readonly critical: number;
}

/**
 * Mechanism for distinguishing adjacent same-polarity surfaces whose
 * lightness gap falls below the perceptibility threshold.
 *
 * - `inset` — inset box-shadow, no layout shift
 * - `border` — actual CSS border, affects box size
 * - `none` — skip distinction entirely (users who want their own)
 */
export type DistinctionMechanism = "inset" | "border" | "none";

/**
 * Which border token to source the distinction color from.
 */
export type DistinctionToken = "decorative" | "interactive";

/**
 * Per-surface override for the distinction rule.
 *
 * - `true` — force distinction even if the rule wouldn't emit it
 * - `false` — skip distinction even if the rule would emit it
 * - a string — emit this literal CSS snippet instead of the default
 *   mechanism (advanced escape hatch, e.g. `"outline: 2px solid red"`).
 */
export type DistinctionOverride = boolean | string;

/**
 * Configuration for cross-surface distinction (§6 tier-1 guarantee).
 *
 * The library emits a distinction mechanism on each surface whose
 * worst-case same-polarity sibling falls below `threshold` APCA.
 *
 * Atmosphere (`targetChroma > 0`) does not rescue a pair: atmosphere
 * tapers at lightness extremes (§5), so a colored surface at high
 * lightness delivers very little actual chroma and can't carry a
 * lightness-space distinction job. Distinguishability is a lightness
 * concern; atmosphere is a secondary signal layered on top.
 */
export interface DistinctionConfig {
  /** APCA threshold below which distinction is required. Default: 45. */
  readonly threshold?: number;
  /** How to render distinction. Default: "inset". */
  readonly mechanism?: DistinctionMechanism;
  /** Which border token to source the color from. Default: "decorative". */
  readonly token?: DistinctionToken;
  /** Per-surface overrides keyed by slug. */
  readonly overrides?: { readonly [slug: string]: DistinctionOverride };
}

/**
 * Full configuration for the solver.
 */
export interface SolverConfig {
  readonly scale: Scale;
  readonly surfaces: Surfaces;
  readonly keyColors?: Record<string, string>;
  readonly hueShift?: {
    readonly curve: {
      readonly p1: [number, number];
      readonly p2: [number, number];
    };
    readonly maxRotation: number;
  };
  readonly borderTargets?: BorderTargets;
  /** Cross-surface distinction (§6 tier-1). Library defaults apply if unset. */
  readonly distinction?: DistinctionConfig;
  /**
   * Accessibility target overrides applied under high-contrast conditions.
   *
   * Library defaults cap `high` at 100 (the ceiling) and bump the
   * remaining grades up one tier. Users with AAA-style requirements can
   * override these to push harder.
   */
  readonly accessibility?: {
    readonly textGrades?: TextGrades;
    readonly borderTargets?: BorderTargets;
  };
  readonly options?: {
    readonly prefix?: string;
    readonly selector?: string;
  };
}

// --- Solver Output ---

/**
 * Pre-solved text lightness values, keyed by grade.
 */
export interface SolvedTextValues {
  readonly high: number;
  readonly strong: number;
  readonly subtle: number;
  readonly subtlest: number;
}

/**
 * Pre-solved border lightness values, keyed by tier.
 */
export interface SolvedBorderValues {
  readonly decorative: number;
  readonly interactive: number;
  readonly critical: number;
}

/**
 * Diagnostics for a single solved surface.
 */
export interface SurfaceDiagnostics {
  readonly unmetTextGrades: readonly string[];
  readonly unmetBorderTiers: readonly string[];
  /** True when the surface's HC lightness falls in the APCA dead zone. */
  readonly highContrastInDeadZone?: boolean;
}

/**
 * Solved values for a single surface in a single mode.
 *
 * The `*HighContrast` fields are populated only when the config has a
 * high-contrast scale (or when HC target bumps are meaningful against
 * the base scale). Consumers that don't render under prefers-contrast
 * can ignore them.
 */
export interface SolvedSurface {
  readonly slug: string;
  readonly polarity: Polarity;
  readonly role: SurfaceRole;
  readonly lightness: number;
  readonly textValues: SolvedTextValues;
  readonly borderValues?: SolvedBorderValues;
  readonly diagnostics?: SurfaceDiagnostics;
  readonly hue?: number;
  readonly chroma?: number;
  readonly states?: Record<string, { readonly lightness: number }>;

  /**
   * True when the surface needs a distinction mechanism emitted in base
   * mode (its worst same-polarity sibling falls below the APCA threshold).
   *
   * Outermost surfaces (position 0 in their polarity) never carry
   * distinction — they have no outer container to be distinguished from.
   */
  readonly needsDistinction?: boolean;

  // --- High contrast companions ---
  readonly lightnessHighContrast?: number;
  readonly textValuesHighContrast?: SolvedTextValues;
  readonly borderValuesHighContrast?: SolvedBorderValues;
  readonly diagnosticsHighContrast?: SurfaceDiagnostics;
  /** Like `needsDistinction`, computed against HC lightness values. */
  readonly needsDistinctionHighContrast?: boolean;
}

/**
 * Complete solver output for one mode.
 */
export interface SolvedMode {
  readonly mode: Mode;
  readonly surfaces: readonly SolvedSurface[];
  readonly composition: readonly CompositionReport[];
}

/**
 * Complete solver output — both modes, independently solved.
 * Per architecture §1: light and dark are separate, complete solutions.
 */
export interface SolverOutput {
  readonly light: SolvedMode;
  readonly dark: SolvedMode;
}
