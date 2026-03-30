/**
 * Core APCA math primitives.
 *
 * All contrast computation goes through this module. The functions here
 * are pure and stateless — they take lightness values and return APCA
 * contrast or solved lightness values.
 */

import { APCAcontrast, sRGBtoY } from "apca-w3";
import { clampChroma, converter } from "culori";

import type { Context, SafetyMargin } from "./types.js";
import { SAFETY_MARGINS } from "./types.js";

const toRgb = converter("rgb");

// --- Color conversion ---

/**
 * Convert an Oklch lightness (0–1) to an sRGB triplet (0–255 each).
 * Achromatic (C=0, H=0).
 */
export function toRgbTriplet(lightness: number): [number, number, number] {
  const rgb = toRgb({ mode: "oklch", l: clamp01(lightness), c: 0, h: 0 });
  const ch = (v: number): number =>
    Math.round(Math.max(0, Math.min(1, v)) * 255);
  return [ch(rgb.r), ch(rgb.g), ch(rgb.b)];
}

// --- APCA contrast ---

/**
 * APCA contrast between two achromatic lightness values.
 * Returns absolute value (always positive).
 */
export function contrastForPair(
  foreground: number,
  background: number,
): number {
  const fgY = sRGBtoY(toRgbTriplet(foreground));
  const bgY = sRGBtoY(toRgbTriplet(background));
  const c = APCAcontrast(fgY, bgY);
  const numeric = typeof c === "number" ? c : Number(c);

  if (!Number.isFinite(numeric)) {
    throw new Error(
      `APCA returned non-finite for fg=${foreground}, bg=${background}`,
    );
  }

  return Math.abs(numeric);
}

/**
 * APCA contrast between two chromatic Oklch colors.
 * Used for hue-aware safety margin validation.
 */
export function contrastWithChroma(
  fgL: number,
  fgC: number,
  fgH: number,
  bgL: number,
  bgC: number,
  bgH: number,
): number {
  const fgOklch = clampChroma(
    { mode: "oklch", l: fgL, c: fgC, h: fgH },
    "oklch",
  );
  const bgOklch = clampChroma(
    { mode: "oklch", l: bgL, c: bgC, h: bgH },
    "oklch",
  );
  const fgRgb = toRgb(fgOklch);
  const bgRgb = toRgb(bgOklch);
  const ch = (v: number): number =>
    Math.round(Math.max(0, Math.min(1, v)) * 255);
  const fgY = sRGBtoY([ch(fgRgb.r), ch(fgRgb.g), ch(fgRgb.b)]);
  const bgY = sRGBtoY([ch(bgRgb.r), ch(bgRgb.g), ch(bgRgb.b)]);
  const c = APCAcontrast(fgY, bgY);
  return Math.abs(typeof c === "number" ? c : Number(c));
}

// --- Text ceiling ---

/**
 * Best achievable APCA contrast for text on a surface at given lightness.
 * Tests both black and white foreground and returns the maximum.
 */
export function textCeiling(surfaceL: number): number {
  const withBlack = contrastForPair(0, surfaceL);
  const withWhite = contrastForPair(1, surfaceL);
  return Math.max(withBlack, withWhite);
}

/**
 * Whether dark text (L=0) produces better contrast than white text (L=1)
 * on a surface at the given lightness.
 */
export function prefersDarkText(surfaceL: number): boolean {
  return contrastForPair(0, surfaceL) > contrastForPair(1, surfaceL);
}

/**
 * The text lightness (0 or 1) that produces best contrast for a context.
 * Page polarity + light mode → dark text. Page + dark → light text.
 * Inverted flips both.
 */
export function textLightnessForContext(ctx: Context): number {
  if (ctx.polarity === "page") {
    return ctx.mode === "light" ? 0 : 1;
  }
  return ctx.mode === "light" ? 1 : 0;
}

// --- Safety margins ---

/**
 * Look up the hue-dependent safety margin for a given chroma level.
 * Returns the margin in APCA points.
 * For chroma values between defined thresholds, interpolates linearly.
 */
export function safetyMarginForChroma(chroma: number): number {
  if (chroma <= 0) return 0;

  const margins = SAFETY_MARGINS;

  // Below minimum defined chroma — extrapolate from first entry
  const first = margins[0]!;
  if (chroma <= first.chroma) {
    return (chroma / first.chroma) * first.margin;
  }

  // Above maximum defined chroma — extrapolate from last entry
  const last = margins[margins.length - 1]!;
  if (chroma >= last.chroma) {
    return last.margin + ((chroma - last.chroma) / 0.05) * 1;
  }

  // Interpolate between surrounding entries
  for (let i = 0; i < margins.length - 1; i++) {
    const lo = margins[i] as SafetyMargin;
    const hi = margins[i + 1] as SafetyMargin;
    if (chroma >= lo.chroma && chroma <= hi.chroma) {
      const t = (chroma - lo.chroma) / (hi.chroma - lo.chroma);
      return lo.margin + t * (hi.margin - lo.margin);
    }
  }

  return last.margin;
}

// --- Binary search ---

/**
 * Binary search to find a lightness value that achieves a target APCA contrast.
 */
export function binarySearchLightness(
  min: number,
  max: number,
  evaluate: (candidate: number) => number,
  target: number,
  epsilon = 0.005,
  maxIterations = 40,
): number {
  let low = min;
  let high = max;

  const valAtMin = evaluate(min);
  const valAtMax = evaluate(max);
  const slope = Math.sign(valAtMax - valAtMin) || 1;

  for (let i = 0; i < maxIterations; i++) {
    const mid = (low + high) / 2;
    const val = evaluate(mid);
    const delta = val - target;

    if (Math.abs(delta) <= epsilon) return mid;

    if (delta * slope > 0) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return (low + high) / 2;
}

// --- Utilities ---

export function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export function clampTo(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export function roundLightness(value: number, precision = 4): number {
  return Number(value.toFixed(precision));
}
