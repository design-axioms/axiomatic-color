/**
 * Default solver configuration.
 *
 * Encodes the default semantic surface ladder.
 * Anchor values from the original system, validated by experiments.
 */

import type { SolverConfig } from "./types.ts";

export const DEFAULT_CONFIG: SolverConfig = {
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
      accent: "#0891b2",
      success: "#22c55e",
      warning: "#eab308",
      error: "#ef4444",
    },
  },
  groups: [
    {
      name: "Base",
      surfaces: [
        {
          slug: "page",
          label: "Page",
          description: "Base background of the application.",
          polarity: "page",
        },
        {
          slug: "workspace",
          label: "Workspace",
          description: "Elevated workspace area.",
          polarity: "page",
        },
      ],
    },
    {
      name: "Content",
      surfaces: [
        {
          slug: "card",
          label: "Card",
          description: "Card-like container.",
          polarity: "page",
          contrastOffset: { light: 15, dark: 15 },
          states: [
            { name: "hover", offset: -5 },
            { name: "active", offset: -10 },
          ],
        },
        {
          slug: "action",
          label: "Action",
          description: "Clickable action surface (button).",
          polarity: "page",
          hue: "accent",
          targetChroma: 0.12,
          contrastOffset: { light: 25, dark: 25 },
          states: [
            { name: "hover", offset: -5 },
            { name: "active", offset: -10 },
          ],
        },
      ],
    },
    {
      name: "Spotlight",
      surfaces: [
        {
          slug: "spotlight",
          label: "Spotlight",
          description: "Inverted emphasis surface.",
          polarity: "inverted",
        },
      ],
    },
  ],
  borderTargets: {
    decorative: 10,
    interactive: 30,
    critical: 80,
  },
  options: {
    prefix: "axm",
    selector: ":root",
  },
};
