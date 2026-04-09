/// <reference lib="dom" />

import type { SolverConfig } from "./types.js";
import { DEFAULT_CONFIG } from "./defaults.js";
import { solve } from "./solver/index.js";
import { generateCSS } from "./generator/css.js";

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
  let current: SolverConfig = JSON.parse(
    JSON.stringify(config ?? DEFAULT_CONFIG),
  );

  const listeners = new Set<() => void>();

  function buildCSS(): string {
    const output = solve(current);
    const opts = { ...current.options, selector: ":host" as const };
    const keyColors = current.anchors.keyColors;
    return keyColors
      ? generateCSS(output, { ...opts, keyColors })
      : generateCSS(output, opts);
  }

  const sheet = new CSSStyleSheet();
  sheet.replaceSync(buildCSS());

  return {
    sheet,

    setKeyColor(name: string, hex: string) {
      const keyColors = { ...current.anchors.keyColors, [name]: hex };
      current = {
        ...current,
        anchors: { ...current.anchors, keyColors },
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
