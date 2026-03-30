/**
 * Surface placement planner.
 *
 * Distributes surfaces across the lightness range for a given context,
 * respecting group ordering, contrast offsets, and anchor bounds.
 *
 * Architecture note (§2): the planner places surfaces on the ladder.
 * The validator (separate step) checks that the placement achieves
 * all contrast targets.
 */

import { binarySearchLightness, clampTo, contrastForPair } from "../math.js";
import type { Context, ModeAnchors, SurfaceGroup } from "../types.js";

/**
 * Solve background lightness for a target APCA contrast against the
 * start anchor, within the allowed lightness bounds.
 */
function solveBackgroundForContrast(
  ctx: Context,
  targetContrast: number,
  minBg: number,
  maxBg: number,
): number {
  // Reference point is the start anchor (brightest for light page, darkest for dark page)
  const refL =
    ctx.mode === "light"
      ? ctx.polarity === "page"
        ? 1.0
        : 0.0
      : ctx.polarity === "page"
        ? 0.0
        : 1.0;

  return binarySearchLightness(
    minBg,
    maxBg,
    (candidate) => contrastForPair(refL, candidate),
    targetContrast,
  );
}

interface PlannedSurface {
  slug: string;
  lightness: number;
  targetContrast: number;
  clamped: boolean;
}

/**
 * Place all surfaces on the lightness ladder for a given context.
 *
 * Returns a map of slug → planned lightness. Does NOT validate
 * text contrast or composition — that's the validator's job.
 */
export function planSurfacePlacements(
  ctx: Context,
  anchors: ModeAnchors,
  groups: readonly SurfaceGroup[],
): Map<string, PlannedSurface> {
  const result = new Map<string, PlannedSurface>();
  if (groups.length === 0) return result;

  const [minBg, maxBg] = [
    Math.min(anchors.start, anchors.end),
    Math.max(anchors.start, anchors.end),
  ];

  const startContrast = contrastForPair(
    ctx.mode === "light" ? 1 : 0,
    anchors.start,
  );
  const endContrast = contrastForPair(
    ctx.mode === "light" ? 1 : 0,
    anchors.end,
  );

  const totalGroups = groups.length;
  const delta =
    totalGroups > 1 ? (endContrast - startContrast) / (totalGroups - 1) : 0;

  const minContrast = Math.min(startContrast, endContrast);
  const maxContrast = Math.max(startContrast, endContrast);

  groups.forEach((group, groupIndex) => {
    const gap = group.gapBefore ?? 0;
    const adjustedIndex = groupIndex + gap;
    const groupBase = startContrast + delta * adjustedIndex;

    group.surfaces.forEach((surface, surfaceIndex) => {
      const intraStep = delta * 0.2;
      const stagger = surfaceIndex * intraStep;
      const offset = surface.contrastOffset?.[ctx.mode] ?? 0;
      const target = groupBase + stagger + offset;
      const clamped = clampTo(target, minContrast, maxContrast);
      const wasClamped = Math.abs(target - clamped) > 0.01;

      const lightness = solveBackgroundForContrast(ctx, clamped, minBg, maxBg);

      result.set(surface.slug, {
        slug: surface.slug,
        lightness,
        targetContrast: clamped,
        clamped: wasClamped,
      });

      // Solve states
      if (surface.states) {
        for (const state of surface.states) {
          const stateTarget = clampTo(
            clamped + state.offset,
            minContrast,
            maxContrast,
          );
          const stateL = solveBackgroundForContrast(
            ctx,
            stateTarget,
            minBg,
            maxBg,
          );
          result.set(`${surface.slug}-${state.name}`, {
            slug: `${surface.slug}-${state.name}`,
            lightness: stateL,
            targetContrast: stateTarget,
            clamped: Math.abs(clamped + state.offset - stateTarget) > 0.01,
          });
        }
      }
    });
  });

  return result;
}
