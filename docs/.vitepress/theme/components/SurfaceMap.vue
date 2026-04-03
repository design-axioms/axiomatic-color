<script setup lang="ts">
import { ref, computed, onMounted } from "vue";

interface SurfaceInfo {
  slug: string;
  label: string;
  polarity: string;
  lightness: { light: number; dark: number };
}

const surfaces = ref<SurfaceInfo[]>([]);
const css = ref("");
const isDark = ref(false);
const ready = ref(false);

onMounted(async () => {
  const { solve, DEFAULT_CONFIG, generateCSS } =
    await import("@design-axioms/color");

  const output = solve(DEFAULT_CONFIG);
  css.value = generateCSS(output, {
    ...DEFAULT_CONFIG.options,
    selector: ".surface-map-root",
  });

  const result: SurfaceInfo[] = [];
  for (const group of DEFAULT_CONFIG.groups) {
    for (const s of group.surfaces) {
      const light = output.light.surfaces.find((x) => x.slug === s.slug);
      const dark = output.dark.surfaces.find((x) => x.slug === s.slug);
      if (!light || !dark) continue;
      result.push({
        slug: s.slug,
        label: s.label,
        polarity: s.polarity,
        lightness: { light: light.lightness, dark: dark.lightness },
      });
    }
  }
  surfaces.value = result;
  ready.value = true;
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
  <div v-if="ready" class="surface-map-root" :style="{ colorScheme: isDark ? 'dark' : 'light' }">
    <component :is="'style'" v-text="css" />

    <div class="map-page surface-page">
      <div class="map-page-header">
        <div class="map-title">
          <span class="map-name text-high">Page</span>
          <span class="map-role text-subtlest">Base background</span>
        </div>
        <div class="map-right">
          <span class="map-l text-subtlest">L={{ fmt(surfaceBySlug('page')?.lightness[mode] ?? 0) }}</span>
          <button class="map-toggle" @click="isDark = !isDark">
            {{ isDark ? "☀ Light" : "● Dark" }}
          </button>
        </div>
      </div>

      <div class="map-workspace surface-workspace">
        <div class="map-label">
          <div class="map-title">
            <span class="map-name text-high">Workspace</span>
            <span class="map-role text-subtlest">Elevated work area</span>
          </div>
          <span class="map-l text-subtlest">L={{ fmt(surfaceBySlug('workspace')?.lightness[mode] ?? 0) }}</span>
        </div>

        <div class="map-cards">
          <div class="map-card surface-card">
            <div class="map-title">
              <span class="map-name text-high">Card</span>
              <span class="map-role text-subtlest">Content container</span>
            </div>
            <span class="map-l text-subtlest">L={{ fmt(surfaceBySlug('card')?.lightness[mode] ?? 0) }}</span>
          </div>
          <div class="map-card surface-action">
            <div class="map-title">
              <span class="map-name text-high">Action</span>
              <span class="map-role text-subtlest">Interactive element</span>
            </div>
            <span class="map-l text-subtlest">L={{ fmt(surfaceBySlug('action')?.lightness[mode] ?? 0) }}</span>
          </div>
        </div>

        <div class="map-spotlight surface-spotlight">
          <div class="map-title">
            <span class="map-name text-high">Spotlight</span>
            <span class="map-role text-subtlest">Inverted · High-emphasis callout</span>
          </div>
          <span class="map-l text-subtlest">L={{ fmt(surfaceBySlug('spotlight')?.lightness[mode] ?? 0) }}</span>
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
  align-items: center;
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
  align-items: center;
  padding: 0.65rem 0.75rem;
  border-radius: 6px;
  transition: background 0.3s ease;
}

.map-spotlight {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.6rem;
  padding: 0.65rem 0.75rem;
  border-radius: 6px;
  transition: background 0.3s ease;
}

.map-toggle {
  padding: 0.2rem 0.6rem;
  border-radius: 5px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  cursor: pointer;
  font-size: 0.7rem;
  font-family: var(--vp-font-family-base);
}

.map-toggle:hover {
  background: var(--vp-c-bg-soft);
}
</style>
