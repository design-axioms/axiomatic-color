import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../defaults.js";
import { generateCSS } from "../generator/css.js";
import { contrastForPair, contrastWithChroma } from "../math.js";
import type { SolverConfig } from "../types.js";
import { solve } from "./index.js";

/**
 * Rich config fixture — exercises multiple key colors, status surfaces
 * with independent hues, and a wider surface ladder than the default.
 */
const RICH_CONFIG: SolverConfig = {
  anchors: {
    page: {
      light: { start: 1.0, end: 0.9 },
      dark: { start: 0.1, end: 0.4 },
    },
    inverted: {
      light: { start: 0.1, end: 0.0 },
      dark: { start: 0.9, end: 1.0 },
    },
    keyColors: {
      brand: "#6e56cf",
      success: "#22c55e",
      warning: "#eab308",
      error: "#ef4444",
    },
  },
  groups: [
    {
      name: "Base",
      surfaces: [
        { slug: "page", label: "Page", polarity: "page" },
        { slug: "workspace", label: "Workspace", polarity: "page" },
      ],
    },
    {
      name: "Content",
      surfaces: [
        {
          slug: "card",
          label: "Card",
          polarity: "page",
          contrastOffset: { light: 15, dark: 15 },
          states: [
            { name: "hover", offset: -5 },
            { name: "active", offset: -10 },
          ],
        },
        {
          slug: "input",
          label: "Input",
          polarity: "page",
          contrastOffset: { light: 10, dark: 10 },
        },
        {
          slug: "action-soft",
          label: "Soft Action",
          polarity: "page",
          hue: "brand",
          targetChroma: 0.08,
          contrastOffset: { light: 20, dark: 20 },
          states: [
            { name: "hover", offset: -5 },
            { name: "active", offset: -10 },
          ],
        },
      ],
    },
    {
      name: "Status",
      surfaces: [
        {
          slug: "success",
          label: "Success",
          polarity: "page",
          hue: "success",
          targetChroma: 0.08,
        },
        {
          slug: "warning",
          label: "Warning",
          polarity: "page",
          hue: "warning",
          targetChroma: 0.10,
        },
        {
          slug: "error",
          label: "Error",
          polarity: "page",
          hue: "error",
          targetChroma: 0.12,
        },
      ],
    },
    {
      name: "Emphasis",
      surfaces: [
        { slug: "spotlight", label: "Spotlight", polarity: "inverted" },
      ],
    },
  ],
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
    const pageSurfaces = output.light.surfaces.filter(
      (s) => s.polarity === "page",
    );
    for (const s of pageSurfaces) {
      expect(s.lightness).toBeGreaterThanOrEqual(0.85);
      expect(s.lightness).toBeLessThanOrEqual(1.0);
    }
  });

  it("places page-polarity surfaces in the dark range (dark mode)", () => {
    const pageSurfaces = output.dark.surfaces.filter(
      (s) => s.polarity === "page",
    );
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
    const crossPol = output.light.composition.filter(
      (c) => c.tier === "guarantee",
    );
    expect(crossPol.length).toBeGreaterThan(0);
    for (const c of crossPol) {
      expect(c.interContrast).toBeGreaterThan(50);
    }
  });

  it("classifies same-polarity pairs as enhancement", () => {
    const samePol = output.light.composition.filter(
      (c) => c.tier === "enhancement",
    );
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
      const achieved = contrastForPair(
        surface.textValues.subtlest,
        surface.lightness,
      );
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
      const decorativeApca = contrastForPair(
        surface.borderValues!.decorative,
        surface.lightness,
      );
      expect(decorativeApca).toBeGreaterThan(8);

      // Interactive (30)
      const interactiveApca = contrastForPair(
        surface.borderValues!.interactive,
        surface.lightness,
      );
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

    const achromatic = contrastForPair(
      action!.textValues.high,
      action!.lightness,
    );
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
    const actionSoft = output.light.surfaces.find(
      (s) => s.slug === "action-soft",
    );
    expect(actionSoft!.hue).toBeDefined();
    expect(actionSoft!.chroma).toBe(0.08);
  });

  it("safety margin covers yellow hue (warning surface)", () => {
    // Yellow hues have stronger HK effects — verify margin is sufficient
    const warning = output.dark.surfaces.find((s) => s.slug === "warning");
    const taperFactor = 1 - Math.abs(2 * warning!.lightness - 1);
    const taperedChroma = (warning!.chroma ?? 0) * taperFactor;
    const hue = warning!.hue ?? 0;

    const achromatic = contrastForPair(
      warning!.textValues.subtlest,
      warning!.lightness,
    );
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

  it("CSS output matches golden master for rich config", () => {
    const css = generateCSS(output, RICH_CONFIG.options);
    expect(css).toMatchSnapshot();
  });
});
