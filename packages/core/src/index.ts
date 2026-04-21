/**
 * @design-axioms/color — Axiomatic Color System
 *
 * Guarantees contrast correctness for text, borders, and interactive
 * elements on semantic surfaces, using APCA as the contrast metric.
 */

export { DEFAULT_CONFIG } from "./defaults.ts";
export { deriveHcScale } from "./deriveHcScale.ts";
export {
  formatOklchHex,
  generateCSS,
  generateHTML,
  parseKeyColor,
} from "./generator/index.ts";
export { solve } from "./solver/index.ts";

export type {
  BorderTargets,
  CompositionReport,
  CompositionTier,
  Context,
  Mode,
  ModeScale,
  Oklch,
  Polarity,
  PolarityScale,
  Scale,
  SolvedBorderValues,
  SolvedMode,
  SolvedSurface,
  SolvedTextValues,
  SolverConfig,
  SolverOutput,
  SurfaceConfig,
  SurfaceDiagnostics,
  SurfaceRole,
  SurfaceSpec,
  SurfaceState,
  Surfaces,
  TextGrades,
} from "./types.ts";

export type { DeriveHcOptions } from "./deriveHcScale.ts";

export {
  DEAD_ZONE,
  SAFETY_MARGINS,
  TEXT_GRADES,
  TEXT_GRADES_HIGH_CONTRAST,
} from "./types.ts";
export { contrastForPair } from "./math.ts";
