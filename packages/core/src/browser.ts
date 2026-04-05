/// <reference lib="dom" />

import { DEFAULT_CONFIG } from "./defaults.js";
import { generateCSS } from "./generator/index.js";
import { solve } from "./solver/index.js";

let systemSheetPromise: Promise<CSSStyleSheet> | undefined;

/**
 * Returns a shared CSSStyleSheet containing the solved system CSS
 * with `:host` as the selector. Singleton per document — all shadow
 * roots can adopt the same sheet instance.
 */
export function getSystemStyleSheet(): Promise<CSSStyleSheet> {
  return (systemSheetPromise ??= Promise.resolve().then(() => {
    const output = solve(DEFAULT_CONFIG);
    const cssText = generateCSS(output, {
      ...DEFAULT_CONFIG.options,
      selector: ":host",
    });
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(cssText);
    return sheet;
  }));
}

/**
 * ThemeBuilder — runtime polarity flip for inverted surfaces.
 *
 * Generated CSS sets `color-scheme: dark` on inverted surfaces,
 * which is correct when the root is light. ThemeBuilder watches
 * root mode changes and flips inverted elements to the opposite scheme.
 */

interface ThemeBuilderOptions {
  root?: Element;
  invertedSelector?: string;
}

export function createThemeBuilder(
  options?: ThemeBuilderOptions,
): { destroy(): void } {
  const root = options?.root ?? document.documentElement;
  const selector = options?.invertedSelector ?? ".surface-spotlight";

  function update(): void {
    const style = (root as HTMLElement).style.colorScheme;
    const computed = style || getComputedStyle(root).colorScheme;
    const rootIsDark = computed.includes("dark");

    const elements = root.querySelectorAll(selector);
    for (const el of elements) {
      // Count inverted ancestors to handle nesting
      let depth = 0;
      let parent = el.parentElement;
      while (parent && parent !== root) {
        if (parent.matches(selector)) depth++;
        parent = parent.parentElement;
      }
      // Even depth = direct child of root context → flip from root
      // Odd depth = nested inside another inverted → same as root
      const shouldFlip = depth % 2 === 0;
      const scheme = shouldFlip !== rootIsDark ? "dark" : "light";
      (el as HTMLElement).style.colorScheme = scheme;
    }
  }

  // Initial pass
  update();

  // Watch root style/class changes (mode toggle).
  // VitePress toggles `.dark` class; others set inline color-scheme.
  const styleObserver = new MutationObserver(update);
  styleObserver.observe(root, {
    attributes: true,
    attributeFilter: ["style", "class"],
  });

  // Watch subtree for dynamically added inverted elements
  const childObserver = new MutationObserver(update);
  childObserver.observe(root, { childList: true, subtree: true });

  return {
    destroy() {
      styleObserver.disconnect();
      childObserver.disconnect();
    },
  };
}
