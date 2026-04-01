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
  SolvedMode,
  SolvedSurface,
  SolverConfig,
  SolverOutput,
} from "../types.js";
import { converter, parse } from "culori";
import { planSurfacePlacements } from "./planner.js";
import {
  classifyComposition,
  solveBorderValues,
  solveTextValues,
  validateTargets,
} from "./validator.js";

const toOklch = converter("oklch");

/**
 * Run the solver for a single mode, producing all surface solutions.
 */
function solveMode(mode: Mode, config: SolverConfig): SolvedMode {
  const surfaces: SolvedSurface[] = [];
  const composition: CompositionReport[] = [];

  // Solve each polarity ladder independently (§8)
  for (const polarity of ["page", "inverted"] as const) {
    const anchors = config.anchors[polarity][mode];
    const groups = config.groups.filter((g) =>
      g.surfaces.some((s) => s.polarity === polarity),
    );

    // Filter each group to only surfaces of this polarity
    const filteredGroups = groups
      .map((g) => ({
        ...g,
        surfaces: g.surfaces.filter((s) => s.polarity === polarity),
      }))
      .filter((g) => g.surfaces.length > 0);

    const ctx: Context = { polarity, mode };
    const placements = planSurfacePlacements(ctx, anchors, filteredGroups);

    // Build solved surfaces
    for (const group of filteredGroups) {
      for (const surface of group.surfaces) {
        const planned = placements.get(surface.slug);
        if (!planned) continue;

        const chroma = surface.targetChroma ?? 0;
        const textValues = solveTextValues(ctx, planned.lightness, chroma);

        // Solve borders
        const borderValues = config.borderTargets
          ? solveBorderValues(
              ctx,
              planned.lightness,
              chroma,
              config.borderTargets,
            )
          : undefined;

        // Solve states
        const states: Record<string, { lightness: number }> = {};
        if (surface.states) {
          for (const state of surface.states) {
            const statePlanned = placements.get(
              `${surface.slug}-${state.name}`,
            );
            if (statePlanned) {
              states[state.name] = { lightness: statePlanned.lightness };
            }
          }
        }

        // Diagnostics — flag unmet targets (the "noisy no")
        const unmetTextGrades = validateTargets(planned.lightness, chroma, {
          high: 100,
          strong: 95,
          subtle: 90,
          subtlest: 75,
        });
        const unmetBorderTiers = config.borderTargets
          ? validateTargets(planned.lightness, chroma, config.borderTargets)
          : [];
        const hasDiagnostics =
          unmetTextGrades.length > 0 || unmetBorderTiers.length > 0;

        const solved: SolvedSurface = {
          slug: surface.slug,
          polarity,
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
        };
        surfaces.push(solved);
      }
    }
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

  const keyColor = config.anchors.keyColors?.[hue];
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
