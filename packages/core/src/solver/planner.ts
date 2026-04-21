/**
 * Surface placement planner.
 *
 * Scale-based: each surface gets its lightness directly from the scale
 * at its declared position. No spreading, no contrast math, no clamping.
 *
 * Architecture note (§2): the planner places surfaces on the scale.
 * The validator (separate step) checks that the placement achieves
 * all contrast targets.
 */

import type { Context, ModeScale, SurfaceConfig, SurfaceSpec } from "../types.ts";

export interface PlannedSurface {
  readonly slug: string;
  readonly lightness: number;
  readonly position: number;
  /** True if the surface's position was out-of-bounds and clamped. */
  readonly clamped: boolean;
}

/**
 * Normalize a SurfaceSpec (bare number or config object) to a full config.
 */
export function normalizeSurface(spec: SurfaceSpec): SurfaceConfig {
  return typeof spec === "number" ? { position: spec } : spec;
}

/**
 * Look up the lightness at a scale position.
 *
 * If position is out of bounds, clamps to the nearest valid index and
 * reports it. Out-of-bounds positions are a config bug — the solver
 * still produces a value so downstream code doesn't crash.
 */
function lightnessAt(
  scale: ModeScale,
  position: number,
): { lightness: number; position: number; clamped: boolean } {
  if (scale.length === 0) {
    return { lightness: 0.5, position, clamped: true };
  }
  const maxIndex = scale.length - 1;
  const clampedIndex = Math.max(0, Math.min(maxIndex, position));
  const clamped = clampedIndex !== position;
  return {
    lightness: scale[clampedIndex]!,
    position: clampedIndex,
    clamped,
  };
}

/**
 * Place all surfaces in a polarity bucket on the scale for a given context.
 *
 * Returns a map of slug → planned lightness. Does NOT validate text
 * contrast or composition — that's the validator's job.
 */
export function planSurfacePlacements(
  _ctx: Context,
  scale: ModeScale,
  surfaces: { readonly [slug: string]: SurfaceSpec },
): Map<string, PlannedSurface> {
  const result = new Map<string, PlannedSurface>();

  for (const [slug, spec] of Object.entries(surfaces)) {
    const surface = normalizeSurface(spec);
    const placed = lightnessAt(scale, surface.position);

    result.set(slug, {
      slug,
      lightness: placed.lightness,
      position: placed.position,
      clamped: placed.clamped,
    });

    // Solve states — each state is a position offset from the base
    if (surface.states) {
      for (const [stateName, state] of Object.entries(surface.states)) {
        const stateSlug = `${slug}-${stateName}`;
        const statePos = surface.position + state.positionOffset;
        const statePlaced = lightnessAt(scale, statePos);
        result.set(stateSlug, {
          slug: stateSlug,
          lightness: statePlaced.lightness,
          position: statePlaced.position,
          clamped: statePlaced.clamped,
        });
      }
    }
  }

  return result;
}
