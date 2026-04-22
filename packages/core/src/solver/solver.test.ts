import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../defaults.ts";
import { generateCSS } from "../generator/css.ts";
import { contrastForPair, contrastWithChroma } from "../math.ts";
import type { SolverConfig } from "../types.ts";
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

  it("border values achieve their APCA targets", () => {
    for (const surface of output.light.surfaces) {
      // Decorative (10) — should always be achievable
      const decorativeApca = contrastForPair(surface.borderValues!.decorative, surface.lightness);
      expect(decorativeApca).toBeGreaterThan(8);

      // Interactive (30)
      const interactiveApca = contrastForPair(surface.borderValues!.interactive, surface.lightness);
      expect(interactiveApca).toBeGreaterThan(25);
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
      /\.surface-workspace \{[\s\S]*?box-shadow: inset 0 0 0 1px var\(--axm-border-decorative\);/,
    );
    expect(css).toMatch(
      /\.surface-card \{[\s\S]*?box-shadow: inset 0 0 0 1px var\(--axm-border-decorative\);/,
    );
    expect(css).toMatch(
      /\.surface-action \{[\s\S]*?box-shadow: inset 0 0 0 1px var\(--axm-border-decorative\);/,
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
      /\.surface-workspace \{[\s\S]*?border: 1px solid var\(--axm-border-decorative\);/,
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

  it("CSS output matches golden master for rich config", () => {
    const css = generateCSS(output, RICH_CONFIG.options);
    expect(css).toMatchSnapshot();
  });
});
