<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import Token from "./Token.vue";
import DarkToggle from "./DarkToggle.vue";
import { useThemeBuilder } from "../composables/useThemeBuilder";
import { useDarkMode } from "../composables/useDarkMode";
import { useReactiveTheme } from "../composables/useReactiveTheme";

interface SurfaceInfo {
  slug: string;
  label: string;
  polarity: string;
  lightness: { light: number; dark: number };
}

const rootEl = ref<HTMLElement | null>(null);
const surfaces = ref<SurfaceInfo[]>([]);
const css = ref("");
const ready = ref(false);
const { isDark } = useDarkMode();
const { theme, ready: themeReady } = useReactiveTheme();

let solveFn: typeof import("@design-axioms/color").solve | null = null;
let generateCSSFn: typeof import("@design-axioms/color").generateCSS | null = null;

function rebuildCSS() {
  if (!theme.value || !solveFn || !generateCSSFn) return;
  const config = theme.value.getConfig();
  const output = solveFn(config);
  css.value = generateCSSFn(output, {
    ...config.options,
    selector: ".surface-map-root",
    keyColors: config.keyColors,
    highContrastSimulationClass: "hc-simulate",
    ...(config.distinction && { distinction: config.distinction }),
  });

  const result: SurfaceInfo[] = [];
  for (const polarity of ["page", "inverted"] as const) {
    const bucket = config.surfaces[polarity];
    if (!bucket) continue;
    for (const [slug, spec] of Object.entries(bucket)) {
      const label = typeof spec === "number" ? slug : (spec.label ?? slug);
      const light = output.light.surfaces.find((x) => x.slug === slug);
      const dark = output.dark.surfaces.find((x) => x.slug === slug);
      if (!light || !dark) continue;
      result.push({
        slug,
        label,
        polarity,
        lightness: { light: light.lightness, dark: dark.lightness },
      });
    }
  }
  surfaces.value = result;
  ready.value = true;
}

useThemeBuilder(rootEl);

onMounted(async () => {
  const mod = await import("@design-axioms/color");
  solveFn = mod.solve;
  generateCSSFn = mod.generateCSS;

  const t = await themeReady;
  rebuildCSS();
  t.subscribe(() => rebuildCSS());
});

const mode = computed<"light" | "dark">(() => (isDark.value ? "dark" : "light"));

function fmt(n: number): string {
  return n.toFixed(3);
}

function surfaceBySlug(slug: string) {
  return surfaces.value.find((s) => s.slug === slug);
}
</script>

<template>
  <div
    v-if="ready"
    ref="rootEl"
    class="surface-map-root hue-brand"
    :style="{ colorScheme: isDark ? 'dark' : 'light' }"
  >
    <component :is="'style'" v-text="css" />

    <div class="map-page surface-page">
      <div class="map-page-header">
        <div class="map-title">
          <span class="map-name text-high">Page</span>
          <span class="map-role text-subtlest">Base background</span>
          <Token name=".surface-page" />
        </div>
        <div class="map-right">
          <span class="map-l text-subtlest"
            >L={{ fmt(surfaceBySlug("page")?.lightness[mode] ?? 0) }}</span
          >
          <DarkToggle v-model="isDark" />
        </div>
      </div>

      <div class="map-workspace surface-workspace">
        <div class="map-label">
          <div class="map-title">
            <span class="map-name text-high">Workspace</span>
            <span class="map-role text-subtlest">Elevated work area</span>
            <Token name=".surface-workspace" />
          </div>
          <span class="map-l text-subtlest"
            >L={{ fmt(surfaceBySlug("workspace")?.lightness[mode] ?? 0) }}</span
          >
        </div>

        <div class="map-cards">
          <div class="map-card surface-card">
            <div class="map-title">
              <span class="map-name text-high">Card</span>
              <span class="map-role text-subtlest">Content container</span>
              <Token name=".surface-card" />
            </div>
            <span class="map-l text-subtlest"
              >L={{ fmt(surfaceBySlug("card")?.lightness[mode] ?? 0) }}</span
            >
          </div>
          <div class="map-card surface-action hue-accent">
            <div class="map-title">
              <span class="map-name text-high">Action</span>
              <span class="map-role text-subtlest">Interactive element</span>
              <Token name=".surface-action" />
            </div>
            <span class="map-l text-subtlest"
              >L={{ fmt(surfaceBySlug("action")?.lightness[mode] ?? 0) }}</span
            >
          </div>
        </div>

        <div class="map-spotlight surface-spotlight">
          <div class="map-label">
            <div class="map-title">
              <span class="map-name text-high">Spotlight</span>
              <span class="map-role text-subtlest">Inverted · High-emphasis callout</span>
              <Token name=".surface-spotlight" />
            </div>
            <span class="map-l text-subtlest"
              >L={{ fmt(surfaceBySlug("spotlight")?.lightness[mode] ?? 0) }}</span
            >
          </div>

          <div class="map-cards">
            <div class="map-card surface-spotlight-card">
              <div class="map-title">
                <span class="map-name text-high">Spotlight Card</span>
                <span class="map-role text-subtlest">Content container</span>
                <Token name=".surface-spotlight-card" />
              </div>
              <span class="map-l text-subtlest"
                >L={{ fmt(surfaceBySlug("spotlight-card")?.lightness[mode] ?? 0) }}</span
              >
            </div>
            <div class="map-card surface-spotlight-action hue-accent">
              <div class="map-title">
                <span class="map-name text-high">Spotlight Action</span>
                <span class="map-role text-subtlest">Interactive element</span>
                <Token name=".surface-spotlight-action" />
              </div>
              <span class="map-l text-subtlest"
                >L={{ fmt(surfaceBySlug("spotlight-action")?.lightness[mode] ?? 0) }}</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.surface-map-root {
  margin: 1.5rem 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
}

.map-page {
  padding: 0.5rem 1rem 1rem;
  transition: background 0.3s ease;
}

.map-page-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 0.35rem 0.25rem;
}

.map-label {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.5rem;
}

.map-title {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.map-name {
  font-weight: 600;
  font-size: 0.8rem;
}

.map-role {
  font-size: 0.65rem;
}

.map-l {
  font-size: 0.65rem;
  font-family: var(--vp-font-family-mono);
}

.map-right {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.map-workspace {
  padding: 0.85rem;
  border-radius: 8px;
  transition: background 0.3s ease;
}

.map-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
  margin-top: 0.5rem;
}

.map-card {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 0.65rem 0.75rem;
  border-radius: 6px;
  transition: background 0.3s ease;
}

.map-spotlight {
  display: flex;
  flex-direction: column;
  margin-top: 0.6rem;
  padding: 0.65rem 0.75rem;
  border-radius: 6px;
  transition: background 0.3s ease;
}
</style>
