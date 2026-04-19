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
  Anchors,
  CompositionReport,
  CompositionTier,
  Context,
  Mode,
  ModeAnchors,
  Oklch,
  Polarity,
  PolarityAnchors,
  SolvedMode,
  SolvedSurface,
  SolverConfig,
  SolverOutput,
  SurfaceConfig,
  SurfaceGroup,
  SurfaceState,
  TextGrades,
} from "./types.ts";

export { SAFETY_MARGINS, TEXT_GRADES } from "./types.ts";
export { contrastForPair } from "./math.ts";
