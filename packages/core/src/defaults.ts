/**
 * Default solver configuration.
 *
 * Encodes the default semantic surface scale.
 * Scale values chosen to reproduce the previous solver's surface lightness
 * values for page/workspace/card, while providing enough positions for
 * inverted surface variants that the old planner could not spread.
 */

import type { SolverConfig } from "./types.ts";

export const DEFAULT_CONFIG: SolverConfig = {
  scale: {
    page: {
      // Positions 0-4 only. Anything past position 4 falls into the APCA
      // dead zone (L=0.46-0.82) where targets become unreachable — silent
      // footguns for custom surfaces. Users who need deeper scales can
      // author their own.
      light: [0.975, 0.955, 0.9, 0.85, 0.78],
      dark: [0.1, 0.18, 0.25, 0.32, 0.4],
    },
    inverted: {
      // Inverted lives in a narrow lightness band. Two constraints bound it:
      // - Dark-mode APCA ceiling collapses below L=0.88 (subtle grade
      //   becomes unreachable), which caps how light an inverted surface
      //   can be in dark mode.
      // - Cross-polarity contrast against page needs L>=0.88 in dark mode
      //   to maintain the 80+ APCA guarantee from composition §6.
      // Two positions is what genuinely fits within both constraints.
      light: [0.1, 0.12],
      dark: [0.9, 0.88],
    },
  },
  surfaces: {
    page: {
      page: {
        position: 0,
        label: "Page",
        description: "Base background of the application.",
      },
      workspace: {
        position: 1,
        label: "Workspace",
        description: "Elevated workspace area.",
      },
      card: {
        position: 2,
        label: "Card",
        description: "Card-like container.",
        states: {
          hover: { positionOffset: 1 },
          active: { positionOffset: 2 },
        },
      },
      action: {
        position: 2,
        label: "Action",
        description: "Clickable action surface (button).",
        hue: "accent",
        targetChroma: 0.12,
        role: "interactive",
        states: {
          hover: { positionOffset: 1 },
          active: { positionOffset: 2 },
        },
      },
    },
    inverted: {
      spotlight: {
        position: 0,
        label: "Spotlight",
        description: "Inverted emphasis surface.",
      },
      "spotlight-card": {
        position: 1,
        label: "Spotlight Card",
        description: "Card-like container inside a spotlight region.",
      },
      "spotlight-action": {
        position: 1,
        label: "Spotlight Action",
        description: "Clickable action surface inside a spotlight region.",
        hue: "accent",
        targetChroma: 0.12,
        role: "interactive",
      },
    },
  },
  keyColors: {
    brand: "#6e56cf",
    accent: "#0891b2",
    success: "#22c55e",
    warning: "#eab308",
    error: "#ef4444",
  },
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
