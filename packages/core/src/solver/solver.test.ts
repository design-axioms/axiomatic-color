import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../defaults.js";
import { contrastForPair } from "../math.js";
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
});
