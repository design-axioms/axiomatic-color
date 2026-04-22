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
  SolvedBorderValues,
  SolvedMode,
  SolvedSurface,
  SolvedTextValues,
  SolverConfig,
  SurfaceDiagnostics,
  SurfaceSpec,
  SolverOutput,
} from "../types.ts";
import { DISTINCTION_THRESHOLD_DEFAULT, TEXT_GRADES, TEXT_GRADES_HIGH_CONTRAST } from "../types.ts";
import { contrastForPair } from "../math.ts";
import { converter, parse } from "culori";
import { normalizeSurface, planSurfacePlacements } from "./planner.ts";
import {
  classifyComposition,
  isInDeadZone,
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
  const polarityScale = config.scale[ctx.polarity];
  const scale = polarityScale[ctx.mode];
  const placements = planSurfacePlacements(ctx, scale, surfaceSpecs);

  // High-contrast solve setup: use the HC scale if present, otherwise
  // reuse the base scale and rely on target bumps alone.
  const hcScaleForMode = polarityScale.highContrast?.[ctx.mode];
  const hcTextGrades = config.accessibility?.textGrades ?? TEXT_GRADES_HIGH_CONTRAST;
  const hcBorderTargets = config.accessibility?.borderTargets ?? config.borderTargets;
  const hasHcStory = hcScaleForMode !== undefined || config.accessibility !== undefined;
  const hcPlacements = hcScaleForMode
    ? planSurfacePlacements(ctx, hcScaleForMode, surfaceSpecs)
    : placements;

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
      ? validateTargets(planned.lightness, chroma, { ...config.borderTargets })
      : [];
    const hasDiagnostics = unmetTextGrades.length > 0 || unmetBorderTiers.length > 0;

    // High-contrast companions.
    let hcLightness: number | undefined;
    let hcTextValues: SolvedTextValues | undefined;
    let hcBorderValues: SolvedBorderValues | undefined;
    let hcDiagnostics: SurfaceDiagnostics | undefined;

    if (hasHcStory) {
      const hcPlanned = hcPlacements.get(slug);
      if (hcPlanned) {
        hcLightness = hcPlanned.lightness;
        hcTextValues = solveTextValues(ctx, hcLightness, chroma, hcTextGrades);
        hcBorderValues = hcBorderTargets
          ? solveBorderValues(ctx, hcLightness, chroma, hcBorderTargets)
          : undefined;

        const hcUnmetTextGrades = validateTargets(hcLightness, chroma, {
          ...hcTextGrades,
        });
        const hcUnmetBorderTiers = hcBorderTargets
          ? validateTargets(hcLightness, chroma, { ...hcBorderTargets })
          : [];
        const hcInDeadZone = isInDeadZone(hcLightness);
        if (hcUnmetTextGrades.length > 0 || hcUnmetBorderTiers.length > 0 || hcInDeadZone) {
          hcDiagnostics = {
            unmetTextGrades: hcUnmetTextGrades,
            unmetBorderTiers: hcUnmetBorderTiers,
            ...(hcInDeadZone ? { highContrastInDeadZone: true } : {}),
          };
        }
      }
    }

    solved.push({
      slug,
      polarity: ctx.polarity,
      role: surface.role ?? "surface",
      lightness: planned.lightness,
      textValues,
      ...(borderValues ? { borderValues } : {}),
      ...(hasDiagnostics
        ? {
            diagnostics: {
              unmetTextGrades,
              unmetBorderTiers,
            },
          }
        : {}),
      ...(surface.hue ? { hue: resolveHue(surface.hue, config) } : {}),
      ...(surface.targetChroma !== undefined ? { chroma: surface.targetChroma } : {}),
      ...(Object.keys(states).length > 0 ? { states } : {}),
      ...(hcLightness !== undefined ? { lightnessHighContrast: hcLightness } : {}),
      ...(hcTextValues ? { textValuesHighContrast: hcTextValues } : {}),
      ...(hcBorderValues ? { borderValuesHighContrast: hcBorderValues } : {}),
      ...(hcDiagnostics ? { diagnosticsHighContrast: hcDiagnostics } : {}),
    });
  }

  return solved;
}

/**
 * Decide whether each surface needs distinction and annotate it.
 *
 * Rule (§6 tier-1): a surface S needs distinction when, within its own
 * polarity, at least one other surface O has both:
 *   - APCA(S.L, O.L) below threshold (perceptibility floor), AND
 *   - neither S nor O has atmosphere to distinguish it (targetChroma > 0).
 *
 * Outermost surfaces (position 0 in their polarity) never carry
 * distinction — they have nothing outside them to be distinguished from.
 *
 * Returns a new array with `needsDistinction` and
 * `needsDistinctionHighContrast` populated.
 */
function annotateDistinction(
  surfaces: readonly SolvedSurface[],
  threshold: number,
  minPositions: Map<string, number>,
): SolvedSurface[] {
  const byPolarity = new Map<Polarity, SolvedSurface[]>();
  for (const s of surfaces) {
    const list = byPolarity.get(s.polarity) ?? [];
    list.push(s);
    byPolarity.set(s.polarity, list);
  }

  function needsFor(
    subject: SolvedSurface,
    siblings: readonly SolvedSurface[],
    lightnessOf: (s: SolvedSurface) => number | undefined,
  ): boolean {
    const lightness = lightnessOf(subject);
    if (lightness === undefined) return false;
    // Outermost in polarity — nothing to distinguish against
    if ((minPositions.get(subject.slug) ?? 0) === 0) return false;
    const subjectAtm = (subject.chroma ?? 0) > 0;
    for (const other of siblings) {
      if (other.slug === subject.slug) continue;
      const otherL = lightnessOf(other);
      if (otherL === undefined) continue;
      const otherAtm = (other.chroma ?? 0) > 0;
      // Atmosphere rescues any pair where either side has chroma —
      // a colored surface is already perceptually distinct from a
      // neutral one (or from another colored surface with a different
      // hue).
      if (subjectAtm || otherAtm) continue;
      const gap = contrastForPair(lightness, otherL);
      if (gap < threshold) return true;
    }
    return false;
  }

  return surfaces.map((s): SolvedSurface => {
    const siblings = byPolarity.get(s.polarity) ?? [];
    const base = needsFor(s, siblings, (x) => x.lightness);
    const hc = needsFor(s, siblings, (x) => x.lightnessHighContrast);
    return {
      ...s,
      ...(base ? { needsDistinction: true } : {}),
      ...(hc ? { needsDistinctionHighContrast: true } : {}),
    };
  });
}

/**
 * Collect the minimum position of each slug within its polarity.
 * Used to identify "outermost" surfaces (position 0 in their polarity),
 * which never carry distinction.
 */
function minPositionBySlug(config: SolverConfig): Map<string, number> {
  const result = new Map<string, number>();
  for (const polarity of ["page", "inverted"] as const satisfies readonly Polarity[]) {
    const bucket = config.surfaces[polarity];
    if (!bucket) continue;
    for (const [slug, spec] of Object.entries(bucket)) {
      const surface = normalizeSurface(spec);
      const current = result.get(slug);
      if (current === undefined || surface.position < current) {
        result.set(slug, surface.position);
      }
    }
  }
  return result;
}

/**
 * Run the solver for a single mode, producing all surface solutions.
 */
function solveMode(mode: Mode, config: SolverConfig): SolvedMode {
  const composition: CompositionReport[] = [];
  const raw: SolvedSurface[] = [];

  // Solve each polarity bucket independently (§3)
  for (const polarity of ["page", "inverted"] as const satisfies readonly Polarity[]) {
    const bucket = config.surfaces[polarity];
    if (!bucket) continue;
    const ctx: Context = { polarity, mode };
    raw.push(...solvePolarity(ctx, config, bucket));
  }

  // Annotate distinction after all surfaces in the mode are solved.
  // Disabled mechanism means "do nothing" — caller wants to handle it.
  const threshold = config.distinction?.threshold ?? DISTINCTION_THRESHOLD_DEFAULT;
  const shouldAnnotate = config.distinction?.mechanism !== "none";
  const surfaces = shouldAnnotate
    ? annotateDistinction(raw, threshold, minPositionBySlug(config))
    : raw;

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
