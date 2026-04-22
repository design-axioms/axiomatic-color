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
} from "../math.ts";
import type {
  BorderTargets,
  CompositionReport,
  CompositionTier,
  Context,
  SolvedBorderValues,
  SolvedTextValues,
  TextGrades,
} from "../types.ts";
import { DEAD_ZONE, TEXT_GRADES } from "../types.ts";

/**
 * Pre-solve text lightness values for a surface.
 *
 * For each grade, binary-search the foreground lightness that achieves
 * the target APCA against the surface background. When `targets` is
 * omitted, the default grades are used.
 */
export function solveTextValues(
  ctx: Context,
  surfaceLightness: number,
  chroma: number,
  targets: TextGrades = TEXT_GRADES,
): SolvedTextValues {
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
    high: solveGrade(targets.high),
    strong: solveGrade(targets.strong),
    subtle: solveGrade(targets.subtle),
    subtlest: solveGrade(targets.subtlest),
  };
}

/**
 * Pre-solve border lightness values for a surface.
 *
 * Same approach as text: binary-search per tier. Same direction logic
 * (dark borders on light surfaces, light borders on dark surfaces).
 */
export function solveBorderValues(
  ctx: Context,
  surfaceLightness: number,
  chroma: number,
  targets: BorderTargets,
): SolvedBorderValues {
  const margin = safetyMarginForChroma(chroma);

  const usesDarkForeground =
    (ctx.polarity === "page" && ctx.mode === "light") ||
    (ctx.polarity === "inverted" && ctx.mode === "dark");
  const [fgMin, fgMax] = usesDarkForeground ? [0, 0.5] : [0.5, 1];

  function solveTier(target: number): number {
    const adjustedTarget = target + margin;
    const ceiling = textCeiling(surfaceLightness);
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
    decorative: solveTier(targets.decorative),
    interactive: solveTier(targets.interactive),
    critical: solveTier(targets.critical),
  };
}

/**
 * Validate that a surface can achieve a set of contrast targets.
 * Returns a list of target names that cannot be met (the "noisy no").
 */
export function validateTargets(
  surfaceLightness: number,
  chroma: number,
  targets: { readonly [name: string]: number },
): string[] {
  const ceiling = textCeiling(surfaceLightness);
  const margin = safetyMarginForChroma(chroma);
  const failures: string[] = [];

  for (const [name, target] of Object.entries(targets)) {
    if (ceiling < target + margin) {
      failures.push(name);
    }
  }

  return failures;
}

/**
 * Validate text contrast grades for a surface.
 */
export function validateTextContrast(surfaceLightness: number, chroma: number): string[] {
  return validateTargets(surfaceLightness, chroma, { ...TEXT_GRADES });
}

/**
 * Test whether a lightness value falls in the APCA dead zone
 * (L ≈ 0.46–0.82), where neither polarity can produce adequate text
 * contrast. Surfaces here get a diagnostic but are not rejected.
 */
export function isInDeadZone(lightness: number): boolean {
  return lightness >= DEAD_ZONE.min && lightness <= DEAD_ZONE.max;
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
