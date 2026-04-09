/**
 * Browser entry point — re-exports everything from the main barrel
 * plus browser-only APIs (CSSStyleSheet, custom elements).
 *
 * Use this in browser contexts (Vite, docs site, demo).
 * The main entry point (index.ts) is Node-safe.
 */
export * from "./index.js";
export { createThemeBuilder, getSystemStyleSheet } from "./browser.js";
export { createReactiveTheme } from "./runtime.js";
export type { ReactiveTheme } from "./runtime.js";
export { ColorSlider, registerColorSlider } from "./components/color-slider.js";
