/**
 * Solver validator.
 *
 * After the planner places surfaces, the validator checks that:
 * 1. Each surface can achieve its text contrast targets
 * 2. Hue-aware safety margins are met
 * 3. Composition relationships are classified (guarantee vs enhancement)
 *
 * Architecture note (§2): the solver validates, it doesn't compute
 * every runtime value. Dark-surface text uses a runtime polynomial;
 * light-surface text is pre-solved here.
 */

import {
  binarySearchLightness,
  contrastForPair,
  roundLightness,
  safetyMarginForChroma,
  textCeiling,
} from "../math.js";
import type {
  CompositionReport,
  CompositionTier,
  Context,
  SolvedSurface,
} from "../types.js";
import { TEXT_GRADES } from "../types.js";

/**
 * Pre-solve text lightness values for a surface.
 *
 * For each grade, binary-search the foreground lightness that achieves
 * the target APCA against the surface background.
 */
export function solveTextValues(
  ctx: Context,
  surfaceLightness: number,
  chroma: number,
): SolvedSurface["textValues"] {
  const margin = safetyMarginForChroma(chroma);

  // Determine the foreground search range based on polarity
  const usesDarkText =
    (ctx.polarity === "page" && ctx.mode === "light") ||
    (ctx.polarity === "inverted" && ctx.mode === "dark");
  const [fgMin, fgMax] = usesDarkText ? [0, 0.5] : [0.5, 1];

  function solveGrade(target: number): number {
    const adjustedTarget = target + margin;
    const ceiling = textCeiling(surfaceLightness);

    // If the ceiling can't reach the adjusted target, solve for ceiling
    const effectiveTarget = Math.min(adjustedTarget, ceiling - 0.5);

    return roundLightness(
      binarySearchLightness(
        fgMin,
        fgMax,
        (fg) => contrastForPair(fg, surfaceLightness),
        effectiveTarget,
      ),
    );
  }

  return {
    high: solveGrade(TEXT_GRADES.high),
    strong: solveGrade(TEXT_GRADES.strong),
    subtle: solveGrade(TEXT_GRADES.subtle),
    subtlest: solveGrade(TEXT_GRADES.subtlest),
  };
}

/**
 * Validate that a surface can achieve the required text contrast grades.
 * Returns a list of grades that cannot be met.
 */
export function validateTextContrast(
  surfaceLightness: number,
  chroma: number,
): string[] {
  const ceiling = textCeiling(surfaceLightness);
  const margin = safetyMarginForChroma(chroma);
  const failures: string[] = [];

  for (const [name, target] of Object.entries(TEXT_GRADES)) {
    if (ceiling < target + margin) {
      failures.push(name);
    }
  }

  return failures;
}

/**
 * Classify the composition relationship between two surfaces.
 *
 * Per §6 (Three-Tier Composition Contract):
 * - Cross-polarity pairs → "guarantee" (massive APCA gap)
 * - Same-polarity pairs → "enhancement" (small lightness stagger)
 */
export function classifyComposition(
  surfaceA: { slug: string; lightness: number; polarity: string },
  surfaceB: { slug: string; lightness: number; polarity: string },
): CompositionReport {
  const interContrast = contrastForPair(surfaceA.lightness, surfaceB.lightness);
  const tier: CompositionTier =
    surfaceA.polarity !== surfaceB.polarity ? "guarantee" : "enhancement";

  return {
    surfaceA: surfaceA.slug,
    surfaceB: surfaceB.slug,
    interContrast,
    tier,
  };
}
