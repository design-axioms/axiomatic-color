/**
 * Authoring-time helper for deriving a high-contrast scale from a base scale.
 *
 * This runs at config-authoring time (not runtime). It returns explicit
 * light / dark arrays that the author inlines into their config under
 * `scale.<polarity>.highContrast`.
 *
 * Why not at runtime? Linear interpolation corrupts bipolar scales:
 * pushing dark-mode positions "harder" means pushing toward L=0, but
 * pushing light-mode positions "harder" means pushing toward L=1. A
 * single `pushFactor` can't express both directions without the author
 * reasoning about polarity — so the helper keeps polarity implicit and
 * outputs a concrete scale the author can review.
 */

import type { ModeScale, PolarityScale } from "./types.ts";

export interface DeriveHcOptions {
  /**
   * Strength of the push toward each mode's extreme. 0 is no push
   * (returns the base scale unchanged), 1 pushes fully to the extreme.
   * Default: 0.6. Conservative values (0.3–0.7) produce scales that
   * stay out of the dead zone without hitting pure black or white.
   */
  readonly factor?: number;
}

/**
 * Push each lightness value toward its mode's extreme.
 *
 * Light-mode values push toward L=1 (brighter).
 * Dark-mode values push toward L=0 (darker).
 *
 * Values already at the extreme barely move; mid-range values move the
 * most. The formula is `L + factor * (extreme - L)`.
 */
function pushToExtreme(
  scale: ModeScale,
  factor: number,
  direction: "lighter" | "darker",
): number[] {
  const extreme = direction === "lighter" ? 1 : 0;
  return scale.map((l) => {
    const pushed = l + factor * (extreme - l);
    return Math.round(pushed * 10000) / 10000;
  });
}

/**
 * Derive a high-contrast scale from a base polarity scale.
 *
 * The result is a plain object with `light` and `dark` arrays. Inline it
 * into your config under `scale.<polarity>.highContrast`:
 *
 * ```ts
 * const pageHc = deriveHcScale(myConfig.scale.page, { factor: 0.6 });
 * // scale: { page: { ...base, highContrast: pageHc } }
 * ```
 */
export function deriveHcScale(
  scale: PolarityScale,
  options: DeriveHcOptions = {},
): { light: number[]; dark: number[] } {
  const factor = options.factor ?? 0.6;
  return {
    light: pushToExtreme(scale.light, factor, "lighter"),
    dark: pushToExtreme(scale.dark, factor, "darker"),
  };
}
