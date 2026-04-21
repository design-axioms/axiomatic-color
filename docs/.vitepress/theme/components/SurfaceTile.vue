<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useThemeBuilder } from "../composables/useThemeBuilder";
import { useBrandColor } from "../composables/useKeyColor";
import { useDarkMode } from "../composables/useDarkMode";
import { useKeyColors } from "../composables/useKeyColors";
import { useReactiveTheme } from "../composables/useReactiveTheme";
import PreviewControls from "./PreviewControls.vue";

interface SurfaceData {
  slug: string;
  label: string;
  polarity: string;
  lightness: { light: number; dark: number };
  textGrades: {
    high: { light: number; dark: number };
    strong: { light: number; dark: number };
    subtle: { light: number; dark: number };
    subtlest: { light: number; dark: number };
  };
  borderTiers?: {
    decorative: { light: number; dark: number };
    interactive: { light: number; dark: number };
    critical: { light: number; dark: number };
  };
  hue: number;
  chroma: number;
}

const rootEl = ref<HTMLElement | null>(null);
const surfaces = ref<SurfaceData[]>([]);
const css = ref("");
const ready = ref(false);
const parsedKeyColors = useKeyColors();
const { hue, chroma, setHue, setChroma } = useBrandColor();
const { isDark } = useDarkMode();
const { theme, ready: themeReady } = useReactiveTheme();

let solveFn: typeof import("@design-axioms/color").solve | null = null;
let generateCSSFn: typeof import("@design-axioms/color").generateCSS | null =
  null;

function rebuildCSS() {
  if (!theme.value || !solveFn || !generateCSSFn) return;
  const config = theme.value.getConfig();
  const output = solveFn(config);
  css.value = generateCSSFn(output, {
    ...config.options,
    selector: ".surface-tile-root",
    keyColors: config.keyColors,
    highContrastSimulationClass: "hc-simulate",
  });

  const slugs = new Map<string, { label: string; polarity: string }>();
  for (const polarity of ["page", "inverted"] as const) {
    const bucket = config.surfaces[polarity];
    if (!bucket) continue;
    for (const [slug, spec] of Object.entries(bucket)) {
      const label = typeof spec === "number" ? slug : spec.label ?? slug;
      slugs.set(slug, { label, polarity });
    }
  }

  const result: SurfaceData[] = [];
  for (const [slug, meta] of slugs) {
    const light = output.light.surfaces.find((s) => s.slug === slug);
    const dark = output.dark.surfaces.find((s) => s.slug === slug);
    if (!light || !dark) continue;

    result.push({
      slug,
      label: meta.label,
      polarity: meta.polarity,
      lightness: { light: light.lightness, dark: dark.lightness },
      textGrades: {
        high: { light: light.textValues.high, dark: dark.textValues.high },
        strong: {
          light: light.textValues.strong,
          dark: dark.textValues.strong,
        },
        subtle: {
          light: light.textValues.subtle,
          dark: dark.textValues.subtle,
        },
        subtlest: {
          light: light.textValues.subtlest,
          dark: dark.textValues.subtlest,
        },
      },
      borderTiers:
        light.borderValues && dark.borderValues
          ? {
              decorative: {
                light: light.borderValues.decorative,
                dark: dark.borderValues.decorative,
              },
              interactive: {
                light: light.borderValues.interactive,
                dark: dark.borderValues.interactive,
              },
              critical: {
                light: light.borderValues.critical,
                dark: dark.borderValues.critical,
              },
            }
          : undefined,
      hue: light.hue ?? 0,
      chroma: light.chroma ?? 0,
    });
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

const mode = computed<"light" | "dark">(() =>
  isDark.value ? "dark" : "light",
);

function surfaceBySlug(slug: string) {
  return surfaces.value.find((s) => s.slug === slug);
}

function fmt(n: number): string {
  return n.toFixed(3);
}
</script>

<template>
  <div
    v-if="ready"
    ref="rootEl"
    class="surface-tile-root hue-brand"
    :style="{ colorScheme: isDark ? 'dark' : 'light' }"
  >
    <component :is="'style'" v-text="css" />

    <PreviewControls
      :hue="hue"
      :chroma="chroma"
      @update:hue="setHue"
      @update:chroma="setChroma"
      v-model:is-dark="isDark"
      :key-colors="parsedKeyColors"
    />

    <!-- Nested composition — how surfaces actually stack -->
    <div class="composition surface-page">
      <div class="comp-label">
        <span class="comp-name text-high">Page</span>
        <span class="comp-meta text-subtlest"
          >L={{ fmt(surfaceBySlug("page")?.lightness[mode] ?? 0) }}</span
        >
      </div>
      <div class="comp-body">
        <div class="comp-text-row">
          <span class="text-high">High</span>
          <span class="text-strong">Strong</span>
          <span class="text-subtle">Subtle</span>
          <span class="text-subtlest">Subtlest</span>
        </div>
        <div class="comp-nested surface-workspace">
          <div class="comp-label">
            <span class="comp-name text-high">Workspace</span>
            <span class="comp-meta text-subtlest"
              >L={{
                fmt(surfaceBySlug("workspace")?.lightness[mode] ?? 0)
              }}</span
            >
          </div>
          <div class="comp-body">
            <div class="comp-text-row">
              <span class="text-high">High</span>
              <span class="text-strong">Strong</span>
              <span class="text-subtle">Subtle</span>
              <span class="text-subtlest">Subtlest</span>
            </div>
            <div class="comp-cards">
              <div class="comp-card surface-card">
                <div class="comp-label">
                  <span class="comp-name text-high">Card</span>
                  <span class="comp-meta text-subtlest"
                    >L={{
                      fmt(surfaceBySlug("card")?.lightness[mode] ?? 0)
                    }}</span
                  >
                </div>
                <div class="comp-text-col">
                  <span class="text-strong">Body text on card</span>
                  <span class="text-subtle">Secondary info</span>
                  <span class="text-subtlest">Metadata</span>
                </div>
                <div class="comp-border-row">
                  <span class="comp-border border-decorative"></span>
                  <span class="comp-border border-interactive"></span>
                  <span class="comp-border border-critical"></span>
                </div>
              </div>
              <div class="comp-card surface-action hue-accent">
                <div class="comp-label">
                  <span class="comp-name text-high">Action</span>
                  <span class="comp-meta text-subtlest"
                    >L={{
                      fmt(surfaceBySlug("action")?.lightness[mode] ?? 0)
                    }}</span
                  >
                </div>
                <div class="comp-text-col">
                  <span class="text-strong">Button label</span>
                  <span class="text-subtlest">Hint text</span>
                </div>
              </div>
            </div>
            <div class="comp-nested surface-spotlight">
              <div class="comp-label">
                <span class="comp-name text-high">Spotlight</span>
                <span class="comp-meta text-subtlest"
                  >inverted · L={{
                    fmt(surfaceBySlug("spotlight")?.lightness[mode] ?? 0)
                  }}</span
                >
              </div>
              <div class="comp-text-row">
                <span class="text-high">High</span>
                <span class="text-strong">Strong</span>
                <span class="text-subtle">Subtle</span>
                <span class="text-subtlest">Subtlest</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="surface-tile-loading">Solving color system…</div>
</template>

<style scoped>
.surface-tile-root {
  margin: 1.5rem 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
}

/* --- Composition layout --- */

.composition {
  padding: 1.25rem;
  transition: background 0.3s ease;
}

.comp-label {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.5rem;
}

.comp-name {
  font-weight: 600;
  font-size: 0.85rem;
}

.comp-meta {
  font-size: 0.65rem;
  font-family: var(--vp-font-family-mono);
}

.comp-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.comp-text-row {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
}

.comp-nested {
  padding: 1rem;
  border-radius: 8px;
  transition: background 0.3s ease;
}

.comp-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.comp-card {
  padding: 0.85rem;
  border-radius: 6px;
  transition: background 0.3s ease;
}

.comp-text-col {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  font-size: 0.8rem;
}

.comp-border-row {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.comp-border {
  flex: 1;
  height: 0;
  border-top-width: 3px;
  border-top-style: solid;
  border-radius: 2px;
}

.surface-tile-loading {
  padding: 2rem;
  text-align: center;
  color: var(--vp-c-text-2);
  font-style: italic;
}
</style>
