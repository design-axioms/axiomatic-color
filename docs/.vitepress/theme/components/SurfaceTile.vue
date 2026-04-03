<script setup lang="ts">
import { ref, computed, onMounted } from "vue";

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

const surfaces = ref<SurfaceData[]>([]);
const css = ref("");
const isDark = ref(false);
const ready = ref(false);
const keyColorNames = ref<string[]>([]);
const selectedHue = ref<string | null>(null);

onMounted(async () => {
  const { solve, DEFAULT_CONFIG, generateCSS } =
    await import("@design-axioms/color");

  const output = solve(DEFAULT_CONFIG);
  css.value = generateCSS(output, {
    ...DEFAULT_CONFIG.options,
    selector: ".surface-tile-root",
    keyColors: DEFAULT_CONFIG.anchors.keyColors,
  });

  // Build surface data for the template
  const slugs = new Map<string, { label: string; polarity: string }>();
  for (const group of DEFAULT_CONFIG.groups) {
    for (const s of group.surfaces) {
      slugs.set(s.slug, { label: s.label, polarity: s.polarity });
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
  keyColorNames.value = DEFAULT_CONFIG.anchors.keyColors
    ? Object.keys(DEFAULT_CONFIG.anchors.keyColors)
    : [];
  ready.value = true;
});

const mode = computed<"light" | "dark">(() =>
  isDark.value ? "dark" : "light",
);

function toggleMode() {
  isDark.value = !isDark.value;
}

function surfaceBySlug(slug: string) {
  return surfaces.value.find((s) => s.slug === slug);
}

function fmt(n: number): string {
  return n.toFixed(3);
}

const hueClass = computed(() =>
  selectedHue.value ? `hue-${selectedHue.value}` : "",
);
</script>

<template>
  <div
    v-if="ready"
    class="surface-tile-root"
    :style="{ colorScheme: isDark ? 'dark' : 'light' }"
  >
    <component :is="'style'" v-text="css" />

    <div class="tile-controls">
      <div class="hue-controls">
        <button
          v-for="name in keyColorNames"
          :key="name"
          class="hue-btn"
          :class="{ active: selectedHue === name }"
          @click="selectedHue = selectedHue === name ? null : name"
        >
          {{ name }}
        </button>
      </div>
      <button class="mode-toggle" @click="toggleMode">
        {{ isDark ? "☀ Light" : "● Dark" }}
      </button>
    </div>

    <!-- Nested composition — how surfaces actually stack -->
    <div class="composition surface-page" :class="hueClass">
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
        <div class="comp-nested surface-workspace" :class="hueClass">
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
              <div class="comp-card surface-card" :class="hueClass">
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
              <div class="comp-card surface-action" :class="hueClass">
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
            <div class="comp-nested surface-spotlight" :class="hueClass">
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

.tile-controls {
  padding: 0.75rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--vp-c-bg-soft);
}

.hue-controls {
  display: flex;
  gap: 0.35rem;
}

.hue-btn {
  padding: 0.25rem 0.65rem;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  cursor: pointer;
  font-size: 0.75rem;
  font-family: var(--vp-font-family-base);
  text-transform: capitalize;
}

.hue-btn:hover {
  background: var(--vp-c-bg-soft);
}

.hue-btn.active {
  background: var(--vp-c-brand-1);
  color: var(--vp-c-white);
  border-color: var(--vp-c-brand-1);
}

.mode-toggle {
  padding: 0.35rem 0.85rem;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  cursor: pointer;
  font-size: 0.85rem;
  font-family: var(--vp-font-family-base);
}

.mode-toggle:hover {
  background: var(--vp-c-bg-soft);
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
  border-top: 3px solid;
  border-radius: 2px;
}

.surface-tile-loading {
  padding: 2rem;
  text-align: center;
  color: var(--vp-c-text-2);
  font-style: italic;
}
</style>
