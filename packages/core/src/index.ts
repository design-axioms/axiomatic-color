/**
 * @design-axioms/color — Axiomatic Color System
 *
 * Guarantees contrast correctness for text, borders, and interactive
 * elements on semantic surfaces, using APCA as the contrast metric.
 */

export { DEFAULT_CONFIG } from "./defaults.ts";
export {
  formatOklchHex,
  generateCSS,
  generateHTML,
  parseKeyColor,
} from "./generator/index.ts";
export { solve } from "./solver/index.ts";

export type {
  CompositionReport,
  CompositionTier,
  Context,
  Mode,
  ModeScale,
  Oklch,
  Polarity,
  PolarityScale,
  Scale,
  SolvedMode,
  SolvedSurface,
  SolverConfig,
  SolverOutput,
  SurfaceConfig,
  SurfaceSpec,
  SurfaceState,
  Surfaces,
  TextGrades,
} from "./types.ts";

export { SAFETY_MARGINS, TEXT_GRADES } from "./types.ts";
export { contrastForPair } from "./math.ts";
