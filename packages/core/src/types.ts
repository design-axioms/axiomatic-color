/**
 * Core type definitions for the Axiomatic Color System.
 *
 * Architecture decisions encoded here:
 * - Mode is binary (light/dark), not continuous — driven by `light-dark()`
 * - Polarity selects between two independent lightness ladders
 * - Context = Polarity × Mode — the minimal input for all color math
 * - Surfaces have semantic identity, not positional (no nesting depth)
 */

// --- Primitives ---

export type Mode = "light" | "dark";
export type Polarity = "page" | "inverted";

/**
 * The minimal context for all color math operations.
 * Polarity selects the lightness ladder; mode selects the branch.
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
  readonly high: number; // 108 — maximum legibility
  readonly strong: number; // 105 — body text
  readonly subtle: number; // 90  — secondary text
  readonly subtlest: number; // 75  — tertiary/hint text
}

export const TEXT_GRADES: TextGrades = {
  high: 108,
  strong: 105,
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

// --- Anchors ---

/**
 * A single mode's anchor endpoints.
 * Surfaces are placed between start and end on the lightness axis.
 */
export interface ModeAnchors {
  readonly start: number; // lightness (0–1)
  readonly end: number; // lightness (0–1)
}

/**
 * Anchor configuration for one polarity (page or inverted).
 * Each polarity has independent light/dark anchor sets.
 */
export interface PolarityAnchors {
  readonly light: ModeAnchors;
  readonly dark: ModeAnchors;
}

/**
 * Full anchor configuration.
 * Two independent polarity ladders, per architecture decision §8.
 */
export interface Anchors {
  readonly page: PolarityAnchors;
  readonly inverted: PolarityAnchors;
  readonly keyColors?: Record<string, string>;
}

// --- Surfaces ---

/** Interaction state offset for a surface. */
export interface SurfaceState {
  readonly name: string;
  readonly offset: number; // APCA contrast offset from base
}

/**
 * Configuration for a single semantic surface.
 *
 * Key principle (§7): a surface's lightness is determined by its semantic
 * identity (slug + polarity + group position), not by DOM nesting.
 */
export interface SurfaceConfig {
  readonly slug: string;
  readonly label: string;
  readonly description?: string;
  readonly polarity: Polarity;
  readonly contrastOffset?: { readonly light?: number; readonly dark?: number };
  readonly hue?: string; // key color name or number
  readonly targetChroma?: number;
  readonly states?: readonly SurfaceState[];
}

/**
 * A group of surfaces placed together on the lightness ladder.
 * Groups are ordered — earlier groups are closer to the start anchor.
 */
export interface SurfaceGroup {
  readonly name: string;
  readonly surfaces: readonly SurfaceConfig[];
  readonly gapBefore?: number;
}

// --- Composition Classification ---

/**
 * Three-tier composition contract (§6).
 *
 * The solver classifies each surface relationship:
 * - guarantee: cross-polarity, massive APCA gap
 * - enhancement: same-polarity lightness stagger (real but not load-bearing)
 * - unclassified: no direct relationship (different branches of the tree)
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
  readonly anchors: Anchors;
  readonly groups: readonly SurfaceGroup[];
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
