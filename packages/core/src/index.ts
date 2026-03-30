/**
 * @design-axioms/color — Axiomatic Color System
 *
 * Guarantees contrast correctness for text, borders, and interactive
 * elements on semantic surfaces, using APCA as the contrast metric.
 */

export { DEFAULT_CONFIG } from "./defaults.js";
export { generateCSS, generateHTML } from "./generator/index.js";
export { solve } from "./solver/index.js";

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
} from "./types.js";

export { SAFETY_MARGINS, TEXT_GRADES } from "./types.js";
