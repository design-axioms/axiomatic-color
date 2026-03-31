import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../defaults.js";
import { contrastForPair, contrastWithChroma } from "../math.js";
import { solve } from "./index.js";

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
    for (const surface of output.dark.surfaces) {
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
      action!.textValues.high, 0, 0,
      action!.lightness, taperedChroma, hue,
    );

    // Delta must be less than the safety margin (3.4 pts for C=0.12)
    expect(Math.abs(achromatic - chromatic)).toBeLessThan(3.4);
  });
});
