/**
 * Browser entry point — re-exports everything from the main barrel
 * plus browser-only APIs (CSSStyleSheet, custom elements).
 *
 * Use this in browser contexts (Vite, docs site, demo).
 * The main entry point (index.ts) is Node-safe.
 */
export * from "./index.ts";
export { createThemeBuilder, getSystemStyleSheet } from "./browser.ts";
export { createReactiveTheme } from "./runtime.ts";
export type { ReactiveTheme } from "./runtime.ts";
export { ColorSlider, registerColorSlider } from "./components/color-slider.ts";
