import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../defaults.ts";
import { generateCSS } from "../generator/css.ts";
import { contrastForPair, contrastWithChroma, safetyMarginForChroma } from "../math.ts";
import type {
  BorderTargets,
  Mode,
  SolvedBorderValues,
  SolvedSurface,
  SolverConfig,
} from "../types.ts";
import { solve } from "./index.ts";

/**
 * Rich config fixture — exercises multiple key colors, status surfaces
 * with independent hues, and a wider surface ladder than the default.
 */
const RICH_CONFIG: SolverConfig = {
  scale: {
    page: {
      light: [0.975, 0.955, 0.92, 0.88, 0.82, 0.75, 0.65, 0.55, 0.4, 0.25],
      dark: [0.1, 0.15, 0.22, 0.3, 0.38, 0.48, 0.58, 0.68, 0.78, 0.88],
      highContrast: {
        light: [0.99, 0.982, 0.968, 0.952, 0.928, 0.9, 0.86, 0.82, 0.76, 0.7],
        dark: [0.04, 0.06, 0.088, 0.12, 0.152, 0.192, 0.232, 0.272, 0.312, 0.352],
      },
    },
    inverted: {
      light: [0.1, 0.08, 0.06, 0.04, 0.02],
      dark: [0.9, 0.92, 0.94, 0.96, 0.98],
      // Inverted HC scale lets us verify the branch swap under HC.
      highContrast: {
        light: [0.04, 0.03, 0.02, 0.01, 0],
        dark: [0.96, 0.97, 0.98, 0.99, 1],
      },
    },
  },
  surfaces: {
    page: {
      page: { position: 0, label: "Page" },
      workspace: { position: 1, label: "Workspace" },
      card: {
        position: 2,
        label: "Card",
        states: {
          hover: { positionOffset: 1 },
          active: { positionOffset: 2 },
        },
      },
      input: { position: 3, label: "Input" },
      "action-soft": {
        position: 4,
        label: "Soft Action",
        hue: "brand",
        targetChroma: 0.08,
        states: {
          hover: { positionOffset: 1 },
          active: { positionOffset: 2 },
        },
      },
      success: {
        position: 2,
        label: "Success",
        hue: "success",
        targetChroma: 0.08,
        role: "alert",
      },
      warning: {
        position: 2,
        label: "Warning",
        hue: "warning",
        targetChroma: 0.1,
        role: "alert",
      },
      error: {
        position: 2,
        label: "Error",
        hue: "error",
        targetChroma: 0.12,
        role: "alert",
      },
    },
    inverted: {
      spotlight: { position: 0, label: "Spotlight" },
    },
  },
  keyColors: {
    brand: "#6e56cf",
    success: "#22c55e",
    warning: "#eab308",
    error: "#ef4444",
  },
  borderTargets: { decorative: 10, interactive: 30, critical: 80 },
  options: { prefix: "axm", selector: ":root" },
};

const MAX_QUANTIZATION_OVERSHOOT = 0.75;

function assertBorderVariantFit(
  mode: Mode,
  surface: SolvedSurface,
  surfaceL: number,
  borders: SolvedBorderValues,
  unmetBorderTiers: readonly string[],
  targets: BorderTargets,
  checkProgression: boolean,
): void {
  const usesDark =
    (surface.polarity === "page" && mode === "light") ||
    (surface.polarity === "inverted" && mode === "dark");
  const extreme = usesDark ? 0 : 1;
  const ceiling = contrastForPair(extreme, surfaceL);
  const margin = safetyMarginForChroma(surface.chroma ?? 0);

  const achieved: Record<keyof BorderTargets, number> = {
    decorative: contrastForPair(borders.decorative, surfaceL),
    interactive: contrastForPair(borders.interactive, surfaceL),
    critical: contrastForPair(borders.critical, surfaceL),
  };
  const expectedUnmet: string[] = [];

  for (const tier of ["decorative", "interactive", "critical"] as const) {
    const borderL = borders[tier];
    const adjustedTarget = targets[tier] + margin;
    if (usesDark) {
      expect(borderL).toBeLessThanOrEqual(surfaceL);
    } else {
      expect(borderL).toBeGreaterThanOrEqual(surfaceL);
    }

    if (adjustedTarget <= ceiling) {
      // No undershoot: always meets target + chroma safety margin.
      expect(achieved[tier]).toBeGreaterThanOrEqual(adjustedTarget);
      // No overshoot: stays within one 8-bit sRGB gray quantization step (<= 0.67 Lc).
      expect(achieved[tier]).toBeLessThanOrEqual(adjustedTarget + MAX_QUANTIZATION_OVERSHOOT);
    } else {
      // Unmeetable in this polarity direction: saturates at the directional extreme.
      expect(borderL).toBe(extreme);
      expect(achieved[tier]).toBe(ceiling);
      expectedUnmet.push(tier);
    }
  }

  expect(unmetBorderTiers).toEqual(expectedUnmet);
  if (checkProgression) {
    expect(achieved.decorative).toBeLessThan(achieved.interactive);
    expect(achieved.interactive).toBeLessThan(achieved.critical);
  }
}

function assertSurfaceBordersFit(
  mode: Mode,
  surface: SolvedSurface,
  targets: BorderTargets,
  checkProgression = false,
): void {
  assertBorderVariantFit(
    mode,
    surface,
    surface.lightness,
    surface.borderValues!,
    surface.diagnostics?.unmetBorderTiers ?? [],
    targets,
    checkProgression,
  );
  if (surface.lightnessHighContrast !== undefined && surface.borderValuesHighContrast) {
    assertBorderVariantFit(
      mode,
      surface,
      surface.lightnessHighContrast,
      surface.borderValuesHighContrast,
      surface.diagnosticsHighContrast?.unmetBorderTiers ?? [],
      targets,
      checkProgression,
    );
  }
}

describe("solver", () => {
  const output = solve(DEFAULT_CONFIG);

  it("solves both modes independently", () => {
    expect(output.light.mode).toBe("light");
    expect(output.dark.mode).toBe("dark");
    expect(output.light.surfaces.length).toBeGreaterThan(0);
    expect(output.dark.surfaces.length).toBeGreaterThan(0);
  });

  it("places all default surfaces", () => {
    const slugs = output.light.surfaces.map((s) => s.slug);
    expect(slugs).toContain("page");
    expect(slugs).toContain("workspace");
    expect(slugs).toContain("card");
    expect(slugs).toContain("action");
    expect(slugs).toContain("spotlight");
  });

  it("places page-polarity surfaces in the light range (light mode)", () => {
    const pageSurfaces = output.light.surfaces.filter((s) => s.polarity === "page");
    for (const s of pageSurfaces) {
      expect(s.lightness).toBeGreaterThanOrEqual(0.85);
      expect(s.lightness).toBeLessThanOrEqual(1.0);
    }
  });

  it("places page-polarity surfaces in the dark range (dark mode)", () => {
    const pageSurfaces = output.dark.surfaces.filter((s) => s.polarity === "page");
    for (const s of pageSurfaces) {
      expect(s.lightness).toBeGreaterThanOrEqual(0.05);
      expect(s.lightness).toBeLessThanOrEqual(0.45);
    }
  });

  it("places inverted surfaces on the opposite ladder", () => {
    const spotlight = output.light.surfaces.find((s) => s.slug === "spotlight");
    expect(spotlight).toBeDefined();
    expect(spotlight!.polarity).toBe("inverted");
    // Inverted in light mode should be dark
    expect(spotlight!.lightness).toBeLessThan(0.2);
  });

  it("classifies cross-polarity pairs as guarantee", () => {
    const crossPol = output.light.composition.filter((c) => c.tier === "guarantee");
    expect(crossPol.length).toBeGreaterThan(0);
    for (const c of crossPol) {
      expect(c.interContrast).toBeGreaterThan(50);
    }
  });

  it("classifies same-polarity pairs as enhancement", () => {
    const samePol = output.light.composition.filter((c) => c.tier === "enhancement");
    expect(samePol.length).toBeGreaterThan(0);
  });

  it("pre-solves text values for each surface", () => {
    for (const surface of output.light.surfaces) {
      expect(surface.textValues.high).toBeDefined();
      expect(surface.textValues.strong).toBeDefined();
      expect(surface.textValues.subtle).toBeDefined();
      expect(surface.textValues.subtlest).toBeDefined();
    }
  });

  it("produces text values that achieve contrast targets", () => {
    // Check subtlest grade (75) — the one most surfaces can hit
    // Skip surfaces that already report unmet subtlest grades
    for (const surface of output.dark.surfaces) {
      if (surface.diagnostics?.unmetTextGrades.includes("subtlest")) continue;
      const achieved = contrastForPair(surface.textValues.subtlest, surface.lightness);
      // Allow some slack for safety margins and rounding
      expect(achieved).toBeGreaterThan(70);
    }
  });

  it("solves card states (hover, active)", () => {
    const card = output.light.surfaces.find((s) => s.slug === "card");
    expect(card).toBeDefined();
    expect(card!.states).toBeDefined();
    expect(card!.states!["hover"]).toBeDefined();
    expect(card!.states!["active"]).toBeDefined();
  });

  it("pre-solves border values for each surface", () => {
    for (const surface of output.light.surfaces) {
      expect(surface.borderValues).toBeDefined();
      expect(surface.borderValues!.decorative).toBeDefined();
      expect(surface.borderValues!.interactive).toBeDefined();
      expect(surface.borderValues!.critical).toBeDefined();
    }
  });

  it("border values hit their APCA targets without undershoot or overshoot across polarities, modes, and HC", () => {
    const targets = DEFAULT_CONFIG.borderTargets!;

    for (const mode of ["light", "dark"] as const) {
      for (const surface of output[mode].surfaces) {
        assertSurfaceBordersFit(mode, surface, targets, true);
      }
    }

    // Explicit regression check for the L = 0.5 clamp (previously +75.3 Lc on light page,
    // +21.8 Lc on dark page for the 10 Lc decorative target).
    const lightPage = output.light.surfaces.find((s) => s.slug === "page")!;
    const darkPage = output.dark.surfaces.find((s) => s.slug === "page")!;
    expect(lightPage.borderValues!.decorative).toBeGreaterThan(0.5);
    expect(lightPage.borderValues!.interactive).toBeGreaterThan(0.5);
    expect(darkPage.borderValues!.decorative).toBeLessThan(0.5);
  });

  it("reports unmet border tiers against attainable directional contrast in base and HC paths", () => {
    const targets = { decorative: 10, interactive: 30, critical: 80 };
    const constrained = solve({
      ...DEFAULT_CONFIG,
      scale: {
        ...DEFAULT_CONFIG.scale,
        page: {
          // On light page L = 0.5, dark foreground ceiling is ~24.0 Lc while opposite-polarity
          // textCeiling(0.5) is ~85.4 Lc. On dark page L = 0.85, light foreground ceiling is ~29.0 Lc
          // while textCeiling(0.85) is ~77.6 Lc.
          light: [0.5],
          dark: [0.85],
          highContrast: {
            light: [0.5],
            dark: [0.85],
          },
        },
        inverted: {
          light: [0.85],
          dark: [0.5],
          highContrast: {
            light: [0.85],
            dark: [0.5],
          },
        },
      },
      surfaces: {
        page: {
          page: { position: 0, label: "Page" },
        },
        inverted: {
          spotlight: { position: 0, label: "Spotlight" },
        },
      },
      borderTargets: targets,
    });

    const lightPage = constrained.light.surfaces.find((s) => s.slug === "page")!;
    expect(lightPage.borderValues!.critical).toBe(0);
    expect(contrastForPair(lightPage.borderValues!.critical, 0.5)).toBeCloseTo(24.0, 0);
    expect(lightPage.diagnostics?.unmetBorderTiers).toEqual(["interactive", "critical"]);
    expect(lightPage.diagnosticsHighContrast?.unmetBorderTiers).toEqual([
      "interactive",
      "critical",
    ]);
    assertSurfaceBordersFit("light", lightPage, targets);

    const darkPage = constrained.dark.surfaces.find((s) => s.slug === "page")!;
    expect(darkPage.borderValues!.critical).toBe(1);
    expect(darkPage.diagnostics?.unmetBorderTiers).toEqual(["interactive", "critical"]);
    expect(darkPage.diagnosticsHighContrast?.unmetBorderTiers).toEqual(["interactive", "critical"]);
    assertSurfaceBordersFit("dark", darkPage, targets);

    const lightSpotlight = constrained.light.surfaces.find((s) => s.slug === "spotlight")!;
    expect(lightSpotlight.borderValues!.critical).toBe(1);
    expect(lightSpotlight.diagnostics?.unmetBorderTiers).toEqual(["interactive", "critical"]);
    expect(lightSpotlight.diagnosticsHighContrast?.unmetBorderTiers).toEqual([
      "interactive",
      "critical",
    ]);
    assertSurfaceBordersFit("light", lightSpotlight, targets);

    const darkSpotlight = constrained.dark.surfaces.find((s) => s.slug === "spotlight")!;
    expect(darkSpotlight.borderValues!.critical).toBe(0);
    expect(darkSpotlight.diagnostics?.unmetBorderTiers).toEqual(["interactive", "critical"]);
    expect(darkSpotlight.diagnosticsHighContrast?.unmetBorderTiers).toEqual([
      "interactive",
      "critical",
    ]);
    assertSurfaceBordersFit("dark", darkSpotlight, targets);
  });

  it("handles sub-floor APCA border targets without collapsing to zero and preserves zero targets", () => {
    const subFloor = solve({
      ...DEFAULT_CONFIG,
      borderTargets: { decorative: 5, interactive: 30, critical: 80 },
    });

    // APCA-W3 clips raw contrast below loClip = 0.1 (~7.3–7.9 Lc) to 0.
    // A positive sub-floor target must land on the first non-zero quantized step,
    // never on 0 Lc and never overshooting past the APCA clip floor.
    for (const mode of ["light", "dark"] as const) {
      for (const slug of ["page", "workspace", "spotlight"] as const) {
        const surface = subFloor[mode].surfaces.find((s) => s.slug === slug)!;
        const apca = contrastForPair(surface.borderValues!.decorative, surface.lightness);
        expect(apca).toBeGreaterThanOrEqual(7.3);
        expect(apca).toBeLessThanOrEqual(8.0);
      }
    }

    const zeroTarget = solve({
      ...DEFAULT_CONFIG,
      borderTargets: { decorative: 0, interactive: 30, critical: 80 },
    });
    const lightPage = zeroTarget.light.surfaces.find((s) => s.slug === "page")!;
    const darkPage = zeroTarget.dark.surfaces.find((s) => s.slug === "page")!;
    expect(lightPage.borderValues!.decorative).toBe(lightPage.lightness);
    expect(darkPage.borderValues!.decorative).toBe(darkPage.lightness);
  });

  it("fits custom high-contrast accessibility border targets without undershoot or overshoot", () => {
    const hcTargets = { decorative: 25, interactive: 60, critical: 90 };
    const custom = solve({
      ...DEFAULT_CONFIG,
      accessibility: { borderTargets: hcTargets },
    });

    for (const mode of ["light", "dark"] as const) {
      const page = custom[mode].surfaces.find((s) => s.slug === "page")!;
      for (const tier of ["decorative", "interactive", "critical"] as const) {
        const achieved = contrastForPair(
          page.borderValuesHighContrast![tier],
          page.lightnessHighContrast!,
        );
        expect(achieved).toBeGreaterThanOrEqual(hcTargets[tier]);
        expect(achieved).toBeLessThanOrEqual(hcTargets[tier] + 0.75);
      }
    }
  });

  it("chromatic border safety margin keeps tapered borders at or above target", () => {
    const targets = DEFAULT_CONFIG.borderTargets!;
    for (const mode of ["light", "dark"] as const) {
      const action = output[mode].surfaces.find((s) => s.slug === "action")!;
      const chroma = action.chroma ?? 0;
      const hue = action.hue ?? 0;
      const surfaceTaper = chroma * (1 - Math.abs(2 * action.lightness - 1));
      for (const tier of ["decorative", "interactive", "critical"] as const) {
        const borderL = action.borderValues![tier];
        const borderTaper = chroma * (1 - Math.abs(2 * borderL - 1));
        const chromatic = contrastWithChroma(
          borderL,
          borderTaper,
          hue,
          action.lightness,
          surfaceTaper,
          hue,
        );
        expect(chromatic).toBeGreaterThanOrEqual(targets[tier]);
      }
    }
  });

  it("reports unmet text grades on constrained surfaces", () => {
    // Card/Action in light mode have ceilings below 108 — high should be flagged
    const card = output.light.surfaces.find((s) => s.slug === "card");
    expect(card!.diagnostics).toBeDefined();
    expect(card!.diagnostics!.unmetTextGrades).toContain("high");
    expect(card!.diagnostics!.unmetTextGrades).toContain("strong");
  });

  it("spotlight has fewer unmet grades than page-polarity surfaces", () => {
    // Spotlight (inverted, L~0.10) has a higher ceiling (~108) than
    // page-polarity surfaces (~101 at best). Even spotlight can't quite
    // hit the 100 target for "high", but it meets more grades overall.
    const spotlight = output.light.surfaces.find((s) => s.slug === "spotlight");
    const card = output.light.surfaces.find((s) => s.slug === "card");
    const spotlightUnmet = spotlight!.diagnostics?.unmetTextGrades ?? [];
    const cardUnmet = card!.diagnostics?.unmetTextGrades ?? [];
    expect(spotlightUnmet.length).toBeLessThan(cardUnmet.length);
  });

  it("safety margin covers taper-induced APCA delta", () => {
    // Regression test: the APCA delta between achromatic and tapered-chromatic
    // contrast must be within the safety margin budget.
    // Worst case: Action surface dark mode (tapered C=0.096, H=288 purple).
    const action = output.dark.surfaces.find((s) => s.slug === "action");
    const taperFactor = 1 - Math.abs(2 * action!.lightness - 1);
    const taperedChroma = (action!.chroma ?? 0) * taperFactor;
    const hue = action!.hue ?? 0;

    const achromatic = contrastForPair(action!.textValues.high, action!.lightness);
    const chromatic = contrastWithChroma(
      action!.textValues.high,
      0,
      0,
      action!.lightness,
      taperedChroma,
      hue,
    );

    // Delta must be less than the safety margin (3.4 pts for C=0.12)
    expect(Math.abs(achromatic - chromatic)).toBeLessThan(3.4);
  });

  it("propagates role from SurfaceConfig to SolvedSurface", () => {
    const page = output.light.surfaces.find((s) => s.slug === "page");
    const action = output.light.surfaces.find((s) => s.slug === "action");
    const spotlightAction = output.light.surfaces.find((s) => s.slug === "spotlight-action");

    expect(page!.role).toBe("surface");
    expect(action!.role).toBe("interactive");
    expect(spotlightAction!.role).toBe("interactive");
  });

  it("emits a forced-colors media block", () => {
    const css = generateCSS(output, DEFAULT_CONFIG.options);
    expect(css).toContain("@media (forced-colors: active)");
  });

  it("maps surface role to Canvas/CanvasText under forced-colors", () => {
    const css = generateCSS(output, DEFAULT_CONFIG.options);
    // .surface-page is role: "surface" → Canvas + CanvasText
    const block = css.match(/@media \(forced-colors: active\) \{[\s\S]*?\n\}/)?.[0];
    expect(block).toBeDefined();
    expect(block).toMatch(/\.surface-page \{[\s\S]*?--axm-surface: Canvas;/);
    expect(block).toMatch(/\.surface-page \{[\s\S]*?--axm-text-high: CanvasText;/);
  });

  it("maps interactive role to ButtonFace/ButtonText/ButtonBorder", () => {
    const css = generateCSS(output, DEFAULT_CONFIG.options);
    const block = css.match(/@media \(forced-colors: active\) \{[\s\S]*?\n\}/)?.[0];
    expect(block).toMatch(/\.surface-action \{[\s\S]*?--axm-surface: ButtonFace;/);
    expect(block).toMatch(/\.surface-action \{[\s\S]*?--axm-text-high: ButtonText;/);
    expect(block).toMatch(/\.surface-action \{[\s\S]*?--axm-border-interactive: ButtonBorder;/);
  });

  it("emits LinkText and GrayText tokens in every forced-colors block", () => {
    const css = generateCSS(output, DEFAULT_CONFIG.options);
    // LinkText and GrayText are role-independent: every surface gets them.
    expect(css).toMatch(/--axm-text-link: LinkText;/);
    expect(css).toMatch(/--axm-text-disabled: GrayText;/);
  });

  it("emits .text-link and .text-disabled utilities", () => {
    const css = generateCSS(output, DEFAULT_CONFIG.options);
    expect(css).toMatch(/\.text-link \{[^}]*--axm-text-link/);
    expect(css).toMatch(/\.text-disabled \{[^}]*--axm-text-disabled/);
  });

  it("emits prefers-contrast HC block for surfaces with HC scale", () => {
    const css = generateCSS(output, DEFAULT_CONFIG.options);
    // Page polarity has HC scale in defaults; inverted does not.
    expect(css).toContain("@media (prefers-contrast: more), (prefers-contrast: custom)");
    const hcBlock = css.match(/@media \(prefers-contrast[\s\S]*?\n\}/)?.[0];
    expect(hcBlock).toBeDefined();
    expect(hcBlock).toMatch(/\.surface-page \{/);
    expect(hcBlock).toMatch(/\.surface-card \{/);
    // Inverted surfaces have no HC scale, so they're not in the block.
    expect(hcBlock).not.toMatch(/\.surface-spotlight \{/);
  });

  it("HC block comes before forced-colors in emission order", () => {
    const css = generateCSS(output, DEFAULT_CONFIG.options);
    const hcIdx = css.indexOf("@media (prefers-contrast:");
    const fcIdx = css.indexOf("@media (forced-colors:");
    expect(hcIdx).toBeGreaterThan(0);
    expect(fcIdx).toBeGreaterThan(hcIdx);
  });

  it("populates lightnessHighContrast on surfaces with HC scale", () => {
    const page = output.light.surfaces.find((s) => s.slug === "page");
    const spotlight = output.light.surfaces.find((s) => s.slug === "spotlight");
    expect(page!.lightnessHighContrast).toBeDefined();
    expect(page!.textValuesHighContrast).toBeDefined();
    // Inverted has no HC scale, so no companion fields.
    expect(spotlight!.lightnessHighContrast).toBeUndefined();
  });

  it("HC scale pushes page.light toward brighter extremes", () => {
    const page = output.light.surfaces.find((s) => s.slug === "page");
    // Base light page L = 0.975; HC pushes toward 1.
    expect(page!.lightnessHighContrast!).toBeGreaterThan(page!.lightness);
  });

  it("HC scale pushes page.dark toward darker extremes", () => {
    const page = output.dark.surfaces.find((s) => s.slug === "page");
    // Base dark page L = 0.1; HC pushes toward 0.
    expect(page!.lightnessHighContrast!).toBeLessThan(page!.lightness);
  });

  it("emits class-triggered HC simulation when the option is set", () => {
    const css = generateCSS(output, {
      ...DEFAULT_CONFIG.options,
      highContrastSimulationClass: "hc-simulate",
    });
    // Descendant, same-element, and :host-context selectors are all emitted
    // in one combined selector so they can share a body.
    expect(css).toMatch(/\.hc-simulate \.surface-page/);
    expect(css).toMatch(/\.hc-simulate\.surface-page/);
    expect(css).toMatch(/:host-context\(\.hc-simulate\) \.surface-page/);
  });

  it("omits simulation block when highContrastSimulationClass is unset", () => {
    const css = generateCSS(output, DEFAULT_CONFIG.options);
    expect(css).not.toMatch(/\.hc-simulate/);
    expect(css).not.toMatch(/:host-context/);
  });

  it("emits class-triggered forced-colors simulation when the option is set", () => {
    const css = generateCSS(output, {
      ...DEFAULT_CONFIG.options,
      forcedColorsSimulationClass: "fc-simulate",
    });
    // Same three-way selector shape as HC simulation.
    expect(css).toMatch(/\.fc-simulate \.surface-page/);
    expect(css).toMatch(/\.fc-simulate\.surface-page/);
    expect(css).toMatch(/:host-context\(\.fc-simulate\) \.surface-page/);
    // Body matches the media-query block's mapping.
    const block = css.match(/\.fc-simulate \.surface-page[\s\S]*?\n\}/)?.[0];
    expect(block).toBeDefined();
    expect(block).toContain("--axm-surface: Canvas");
    expect(block).toContain("--axm-text-high: CanvasText");
    expect(block).toContain("--axm-text-link: LinkText");
    expect(block).toContain("--axm-text-disabled: GrayText");
  });

  it("omits forced-colors simulation when forcedColorsSimulationClass is unset", () => {
    const css = generateCSS(output, DEFAULT_CONFIG.options);
    expect(css).not.toMatch(/\.fc-simulate/);
  });

  it("rejects invalid simulation class names", () => {
    // Space, dot, starts with digit — all invalid CSS identifiers that
    // would break or widen the emitted selector.
    expect(() =>
      generateCSS(output, {
        ...DEFAULT_CONFIG.options,
        forcedColorsSimulationClass: "has space",
      }),
    ).toThrow(/forcedColorsSimulationClass/);
    expect(() =>
      generateCSS(output, {
        ...DEFAULT_CONFIG.options,
        highContrastSimulationClass: ".dot-prefix",
      }),
    ).toThrow(/highContrastSimulationClass/);
    expect(() =>
      generateCSS(output, {
        ...DEFAULT_CONFIG.options,
        forcedColorsSimulationClass: "1starts-with-digit",
      }),
    ).toThrow(/forcedColorsSimulationClass/);
  });

  // --- Distinction rule (§6 tier-1) ---

  it("flags same-polarity surfaces below APCA threshold as needing distinction", () => {
    const workspace = output.light.surfaces.find((s) => s.slug === "workspace");
    const card = output.light.surfaces.find((s) => s.slug === "card");
    expect(workspace!.needsDistinction).toBe(true);
    expect(card!.needsDistinction).toBe(true);
  });

  it("atmosphere does NOT rescue distinction (chroma tapers at extremes, §5)", () => {
    const action = output.light.surfaces.find((s) => s.slug === "action");
    // action has targetChroma: 0.12 at position 2 (L=0.90). The safe
    // bicone taper reduces effective chroma to ~0.024 at that lightness,
    // so it can't carry the distinction. The rule flags action just
    // like card — atmosphere is a secondary signal, not a lightness
    // substitute.
    expect(action!.chroma).toBeGreaterThan(0);
    expect(action!.needsDistinction).toBe(true);
  });

  it("outermost surface (position 0) never carries distinction", () => {
    const page = output.light.surfaces.find((s) => s.slug === "page");
    const spotlight = output.light.surfaces.find((s) => s.slug === "spotlight");
    expect(page!.needsDistinction).toBeUndefined();
    expect(spotlight!.needsDistinction).toBeUndefined();
  });

  it("emits the distinction declaration on flagged surfaces", () => {
    const css = generateCSS(output, DEFAULT_CONFIG.options);
    // Every non-outermost same-polarity surface needs distinction now.
    expect(css).toMatch(
      /\.surface-workspace \{[\s\S]*?box-shadow: inset 0 0 0 1px var\(--axm-border-decorative, currentColor\);/,
    );
    expect(css).toMatch(
      /\.surface-card \{[\s\S]*?box-shadow: inset 0 0 0 1px var\(--axm-border-decorative, currentColor\);/,
    );
    expect(css).toMatch(
      /\.surface-action \{[\s\S]*?box-shadow: inset 0 0 0 1px var\(--axm-border-decorative, currentColor\);/,
    );
    // Page rule should NOT have a box-shadow distinction line.
    const pageBlock = css.match(/\.surface-page \{[^}]+\}/)?.[0];
    expect(pageBlock).toBeDefined();
    expect(pageBlock).not.toMatch(/box-shadow:/);
  });

  it("respects per-surface overrides: false disables a would-be distinction", () => {
    const css = generateCSS(output, {
      ...DEFAULT_CONFIG.options,
      distinction: { overrides: { workspace: false } },
    });
    const workspaceBlock = css.match(/\.surface-workspace \{[^}]+\}/)?.[0];
    expect(workspaceBlock).toBeDefined();
    expect(workspaceBlock).not.toMatch(/box-shadow:/);
    // card still gets one
    expect(css).toMatch(/\.surface-card \{[\s\S]*?box-shadow: inset 0 0 0 1px/);
  });

  it("respects per-surface overrides: string emits literal CSS", () => {
    const css = generateCSS(output, {
      ...DEFAULT_CONFIG.options,
      distinction: { overrides: { card: "outline: 2px dashed red" } },
    });
    expect(css).toMatch(/\.surface-card \{[\s\S]*?outline: 2px dashed red;/);
  });

  it("mechanism: border emits a real border instead of inset shadow", () => {
    const css = generateCSS(output, {
      ...DEFAULT_CONFIG.options,
      distinction: { mechanism: "border" },
    });
    expect(css).toMatch(
      /\.surface-workspace \{[\s\S]*?border: 1px solid var\(--axm-border-decorative, currentColor\);/,
    );
    expect(css).not.toMatch(/box-shadow: inset 0 0 0 1px/);
  });

  it("mechanism: none skips all distinction emission", () => {
    const css = generateCSS(output, {
      ...DEFAULT_CONFIG.options,
      distinction: { mechanism: "none" },
    });
    expect(css).not.toMatch(/box-shadow: inset 0 0 0 1px var\(--axm-border-/);
  });
  it("mechanism: none still sets needsDistinction flags on solver output", () => {
    // Diagnostics survive even when emission is disabled so CLI validate
    // and downstream tooling can report where distinction would be needed.
    const out = solve({ ...DEFAULT_CONFIG, distinction: { mechanism: "none" } });
    const workspace = out.light.surfaces.find((s) => s.slug === "workspace");
    expect(workspace!.needsDistinction).toBe(true);
  });

  it("threshold override: Infinity makes every non-outermost surface distinct", () => {
    const cfg = {
      ...DEFAULT_CONFIG,
      distinction: { threshold: Number.POSITIVE_INFINITY },
    };
    const out = solve(cfg);
    for (const s of out.light.surfaces) {
      // page and spotlight are outermost in their polarities; they
      // stay undistinguished regardless of threshold.
      const outermost = s.slug === "page" || s.slug === "spotlight";
      if (outermost) {
        expect(s.needsDistinction).toBeUndefined();
      } else {
        expect(s.needsDistinction).toBe(true);
      }
    }
  });

  it("threshold override: 0 disables all distinction", () => {
    const cfg = { ...DEFAULT_CONFIG, distinction: { threshold: 0 } };
    const out = solve(cfg);
    for (const s of out.light.surfaces) {
      expect(s.needsDistinction).toBeUndefined();
    }
  });

  it("CSS output matches golden master", () => {
    const css = generateCSS(output, DEFAULT_CONFIG.options);
    expect(css).toMatchSnapshot();
  });
});

describe("solver (rich config)", () => {
  const output = solve(RICH_CONFIG);

  it("places all 9 surfaces", () => {
    const slugs = output.light.surfaces.map((s) => s.slug);
    expect(slugs).toContain("page");
    expect(slugs).toContain("workspace");
    expect(slugs).toContain("card");
    expect(slugs).toContain("input");
    expect(slugs).toContain("action-soft");
    expect(slugs).toContain("success");
    expect(slugs).toContain("warning");
    expect(slugs).toContain("error");
    expect(slugs).toContain("spotlight");
    expect(slugs).toHaveLength(9);
  });

  it("status surfaces have distinct hue angles", () => {
    const success = output.light.surfaces.find((s) => s.slug === "success");
    const warning = output.light.surfaces.find((s) => s.slug === "warning");
    const error = output.light.surfaces.find((s) => s.slug === "error");

    // Each should have a resolved hue from its key color
    expect(success!.hue).toBeDefined();
    expect(warning!.hue).toBeDefined();
    expect(error!.hue).toBeDefined();

    // All three hues should be distinct
    const hues = new Set([success!.hue, warning!.hue, error!.hue]);
    expect(hues.size).toBe(3);
  });

  it("action-soft has brand hue with chroma", () => {
    const actionSoft = output.light.surfaces.find((s) => s.slug === "action-soft");
    expect(actionSoft!.hue).toBeDefined();
    expect(actionSoft!.chroma).toBe(0.08);
  });

  it("safety margin covers yellow hue (warning surface)", () => {
    // Yellow hues have stronger HK effects — verify margin is sufficient
    const warning = output.dark.surfaces.find((s) => s.slug === "warning");
    const taperFactor = 1 - Math.abs(2 * warning!.lightness - 1);
    const taperedChroma = (warning!.chroma ?? 0) * taperFactor;
    const hue = warning!.hue ?? 0;

    const achromatic = contrastForPair(warning!.textValues.subtlest, warning!.lightness);
    const chromatic = contrastWithChroma(
      warning!.textValues.subtlest,
      0,
      0,
      warning!.lightness,
      taperedChroma,
      hue,
    );

    // Safety margin for C=0.10 is 3.0 pts
    expect(Math.abs(achromatic - chromatic)).toBeLessThan(3.0);
  });

  it("HC block replicates inverted-polarity branch swap", () => {
    const css = generateCSS(output, RICH_CONFIG.options);
    // The spotlight surface is inverted. Its HC values under light-dark()
    // must be swapped so the first slot holds the dark L (since
    // color-scheme: dark is set on inverted surfaces).
    //
    // In RICH_CONFIG: inverted.highContrast.light[0] = 0.04 (dark L for
    // inverted in light mode), and inverted.highContrast.dark[0] = 0.96
    // (light L for inverted in dark mode). After branch swap, the CSS
    // should emit light-dark(0.96..., 0.04...) for --axm-surface.
    const hcBlock = css.match(/@media \(prefers-contrast[\s\S]*?\n\}/)?.[0];
    expect(hcBlock).toBeDefined();
    const spotlight = hcBlock!.match(/\.surface-spotlight \{[^}]+\}/)?.[0];
    expect(spotlight).toBeDefined();
    // First argument of light-dark() for --axm-surface should be the
    // DARK lightness (0.96, from the dark HC scale), not 0.04.
    expect(spotlight).toMatch(
      /--axm-surface: light-dark\(oklch\(0\.9600[\s\S]*?,[\s\S]*?oklch\(0\.0400/,
    );
  });

  it("alert role emits Canvas then Mark cascade fallback", () => {
    const css = generateCSS(output, RICH_CONFIG.options);
    // Isolate the forced-colors block first — there are two .surface-success
    // rules in the CSS (normal + forced-colors).
    const forcedBlock = css.match(/@media \(forced-colors: active\) \{[\s\S]*?\n\}/)?.[0];
    expect(forcedBlock).toBeDefined();
    const successBlock = forcedBlock!.match(/\.surface-success \{[^}]+\}/)?.[0];
    expect(successBlock).toBeDefined();
    // Both CanvasText (baseline) and Mark (enhancement) should appear
    // as text-high values, in that order.
    const canvasIdx = successBlock!.indexOf("--axm-text-high: CanvasText");
    const markIdx = successBlock!.indexOf("--axm-text-high: Mark");
    expect(canvasIdx).toBeGreaterThanOrEqual(0);
    expect(markIdx).toBeGreaterThan(canvasIdx);
  });

  it("fits all rich-config border values without undershoot or overshoot", () => {
    const targets = RICH_CONFIG.borderTargets!;
    for (const mode of ["light", "dark"] as const) {
      for (const surface of output[mode].surfaces) {
        assertSurfaceBordersFit(mode, surface, targets);
      }
    }
  });

  it("CSS output matches golden master for rich config", () => {
    const css = generateCSS(output, RICH_CONFIG.options);
    expect(css).toMatchSnapshot();
  });
});
