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
  clamp01,
  clampTo,
  contrastForPair,
  roundLightness,
  safetyMarginForChroma,
  textCeiling,
  textLightnessForContext,
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
 * Search from the surface toward its foreground extreme. A subtle border can
 * be only a few shades away from the surface, on either side of L = 0.5.
 *
 * CSS emits four decimal places of lightness. If rounding lands below the
 * requested contrast, advance to the first emitted shade that meets it.
 * Very low positive targets can reach APCA's first nonzero step.
 */
export function solveBorderValues(
  ctx: Context,
  surfaceLightness: number,
  chroma: number,
  targets: BorderTargets,
): SolvedBorderValues {
  const margin = safetyMarginForChroma(chroma);

  const extreme = textLightnessForContext(ctx);
  const usesDarkForeground = extreme === 0;
  const clampedSurface = clamp01(surfaceLightness);
  const [fgMin, fgMax] = usesDarkForeground ? [0, clampedSurface] : [clampedSurface, 1];
  const ceiling = contrastForPair(extreme, clampedSurface);
  const stepAway = usesDarkForeground ? -0.0001 : 0.0001;

  function solveTier(target: number): number {
    const adjustedTarget = target + margin;
    if (adjustedTarget <= 0 || ceiling <= 0) {
      return roundLightness(clampedSurface);
    }
    if (adjustedTarget >= ceiling) {
      return extreme;
    }

    const raw = binarySearchLightness(
      fgMin,
      fgMax,
      (fg) => contrastForPair(fg, clampedSurface),
      adjustedTarget,
    );
    let candidate = clampTo(roundLightness(raw), fgMin, fgMax);

    while (contrastForPair(candidate, clampedSurface) < adjustedTarget) {
      const next = roundLightness(candidate + stepAway);
      if (next === candidate || next < fgMin || next > fgMax) break;
      candidate = next;
    }

    return candidate;
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
  ceiling = textCeiling(surfaceLightness),
): string[] {
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
 * Validate border tiers against the attainable contrast in the surface's
 * chosen foreground direction, matching `solveBorderValues`.
 */
export function validateBorderTargets(
  ctx: Context,
  surfaceLightness: number,
  chroma: number,
  targets: BorderTargets,
): string[] {
  return validateTargets(
    surfaceLightness,
    chroma,
    { ...targets },
    contrastForPair(textLightnessForContext(ctx), surfaceLightness),
  );
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
