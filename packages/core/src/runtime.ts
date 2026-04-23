/// <reference lib="dom" />

import type { SolverConfig } from "./types.ts";
import { DEFAULT_CONFIG } from "./defaults.ts";
import { solve } from "./solver/index.ts";
import { generateCSS } from "./generator/css.ts";

export interface ReactiveTheme {
  /** The constructible stylesheet — adopt into shadow roots or document */
  readonly sheet: CSSStyleSheet;
  /** Update a key color. Re-solves and updates the sheet. */
  setKeyColor(name: string, hex: string): void;
  /** Get the current config (with any key color overrides) */
  getConfig(): SolverConfig;
  /** Register a listener called after every setKeyColor update. Returns unsubscribe. */
  subscribe(fn: () => void): () => void;
}

export function createReactiveTheme(config?: SolverConfig): ReactiveTheme {
  // Deep-clone so mutations don't affect the caller's config
  let current: SolverConfig = JSON.parse(JSON.stringify(config ?? DEFAULT_CONFIG));

  const listeners = new Set<() => void>();

  function buildCSS(): string {
    const output = solve(current);
    // Runtime defaults the two simulation classes on because the
    // reactive theme is built for in-browser demo/preview contexts
    // (ShadowSurface hosts, docs components). Callers can opt out by
    // passing the key explicitly in `options` — including `undefined`
    // — which takes precedence over the defaults below.
    const opts = {
      selector: ":host" as const,
      highContrastSimulationClass: "hc-simulate",
      forcedColorsSimulationClass: "fc-simulate",
      ...current.options,
      ...(current.distinction && { distinction: current.distinction }),
    };
    const keyColors = current.keyColors;
    return keyColors ? generateCSS(output, { ...opts, keyColors }) : generateCSS(output, opts);
  }

  const sheet = new CSSStyleSheet();
  sheet.replaceSync(buildCSS());

  return {
    sheet,

    setKeyColor(name: string, hex: string) {
      const keyColors = { ...current.keyColors, [name]: hex };
      current = {
        ...current,
        keyColors,
      };
      sheet.replaceSync(buildCSS());
      for (const fn of listeners) fn();
    },

    getConfig() {
      return current;
    },

    subscribe(fn: () => void): () => void {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
  };
}
