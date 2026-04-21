/**
 * Solver entry point.
 *
 * Orchestrates: plan placements → validate → solve text → classify composition.
 * Produces a complete SolverOutput with both modes independently solved (§1).
 */

import type {
  CompositionReport,
  Context,
  Mode,
  Polarity,
  SolvedMode,
  SolvedSurface,
  SolverConfig,
  SurfaceSpec,
  SolverOutput,
} from "../types.ts";
import { TEXT_GRADES } from "../types.ts";
import { converter, parse } from "culori";
import { normalizeSurface, planSurfacePlacements } from "./planner.ts";
import {
  classifyComposition,
  solveBorderValues,
  solveTextValues,
  validateTargets,
} from "./validator.ts";

const toOklch = converter("oklch");

/**
 * Solve all surfaces for a single polarity bucket in a single mode.
 */
function solvePolarity(
  ctx: Context,
  config: SolverConfig,
  surfaceSpecs: { readonly [slug: string]: SurfaceSpec },
): SolvedSurface[] {
  const scale = config.scale[ctx.polarity][ctx.mode];
  const placements = planSurfacePlacements(ctx, scale, surfaceSpecs);
  const solved: SolvedSurface[] = [];

  for (const [slug, spec] of Object.entries(surfaceSpecs)) {
    const surface = normalizeSurface(spec);
    const planned = placements.get(slug);
    if (!planned) continue;

    const chroma = surface.targetChroma ?? 0;
    const textValues = solveTextValues(ctx, planned.lightness, chroma);

    const borderValues = config.borderTargets
      ? solveBorderValues(ctx, planned.lightness, chroma, config.borderTargets)
      : undefined;

    // Solve states — each state moves along the scale by a position offset
    const states: Record<string, { lightness: number }> = {};
    if (surface.states) {
      for (const stateName of Object.keys(surface.states)) {
        const statePlanned = placements.get(`${slug}-${stateName}`);
        if (statePlanned) {
          states[stateName] = { lightness: statePlanned.lightness };
        }
      }
    }

    // Diagnostics — flag unmet targets (the "noisy no")
    const unmetTextGrades = validateTargets(planned.lightness, chroma, {
      ...TEXT_GRADES,
    });
    const unmetBorderTiers = config.borderTargets
      ? validateTargets(planned.lightness, chroma, config.borderTargets)
      : [];
    const hasDiagnostics =
      unmetTextGrades.length > 0 || unmetBorderTiers.length > 0;

    solved.push({
      slug,
      polarity: ctx.polarity,
      role: surface.role ?? "surface",
      lightness: planned.lightness,
      textValues,
      ...(borderValues ? { borderValues } : {}),
      ...(hasDiagnostics
        ? { diagnostics: { unmetTextGrades, unmetBorderTiers } }
        : {}),
      ...(surface.hue ? { hue: resolveHue(surface.hue, config) } : {}),
      ...(surface.targetChroma !== undefined
        ? { chroma: surface.targetChroma }
        : {}),
      ...(Object.keys(states).length > 0 ? { states } : {}),
    });
  }

  return solved;
}

/**
 * Run the solver for a single mode, producing all surface solutions.
 */
function solveMode(mode: Mode, config: SolverConfig): SolvedMode {
  const composition: CompositionReport[] = [];
  const surfaces: SolvedSurface[] = [];

  // Solve each polarity bucket independently (§3)
  for (const polarity of [
    "page",
    "inverted",
  ] as const satisfies readonly Polarity[]) {
    const bucket = config.surfaces[polarity];
    if (!bucket) continue;
    const ctx: Context = { polarity, mode };
    surfaces.push(...solvePolarity(ctx, config, bucket));
  }

  // Classify composition for all surface pairs
  for (let i = 0; i < surfaces.length; i++) {
    for (let j = i + 1; j < surfaces.length; j++) {
      const a = surfaces[i]!;
      const b = surfaces[j]!;
      composition.push(classifyComposition(a, b));
    }
  }

  return { mode, surfaces, composition };
}

/**
 * Resolve a hue reference (key color name or numeric string) to a hue angle.
 */
function resolveHue(hue: string, config: SolverConfig): number {
  const num = Number(hue);
  if (Number.isFinite(num)) return num;

  const keyColor = config.keyColors?.[hue];
  if (!keyColor) return 0;

  const parsed = parse(keyColor);
  if (!parsed) return 0;

  const oklch = toOklch(parsed);
  return (oklch as unknown as { h?: number }).h ?? 0;
}

/**
 * Solve the complete color system for a given configuration.
 *
 * Returns independently-solved light and dark modes (§1).
 */
export function solve(config: SolverConfig): SolverOutput {
  return {
    light: solveMode("light", config),
    dark: solveMode("dark", config),
  };
}
