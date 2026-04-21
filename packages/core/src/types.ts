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
 */
export interface PolarityScale {
  readonly light: ModeScale;
  readonly dark: ModeScale;
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
  readonly borderTargets?: {
    readonly decorative: number;
    readonly interactive: number;
    readonly critical: number;
  };
  readonly options?: {
    readonly prefix?: string;
    readonly selector?: string;
  };
}

// --- Solver Output ---

/**
 * Solved values for a single surface in a single mode.
 */
export interface SolvedSurface {
  readonly slug: string;
  readonly polarity: Polarity;
  readonly lightness: number;
  readonly textValues: {
    readonly high: number;
    readonly strong: number;
    readonly subtle: number;
    readonly subtlest: number;
  };
  readonly borderValues?: {
    readonly decorative: number;
    readonly interactive: number;
    readonly critical: number;
  };
  readonly diagnostics?: {
    readonly unmetTextGrades: readonly string[];
    readonly unmetBorderTiers: readonly string[];
  };
  readonly hue?: number;
  readonly chroma?: number;
  readonly states?: Record<string, { readonly lightness: number }>;
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
