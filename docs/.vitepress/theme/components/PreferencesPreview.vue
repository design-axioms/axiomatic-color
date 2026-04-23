<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import Token from "./Token.vue";
import PreviewControls from "./PreviewControls.vue";
import { useThemeBuilder } from "../composables/useThemeBuilder";
import { useBrandColor } from "../composables/useKeyColor";
import { useDarkMode } from "../composables/useDarkMode";
import { useKeyColors } from "../composables/useKeyColors";
import { useReactiveTheme } from "../composables/useReactiveTheme";

type Regime = "default" | "hc" | "forced";
const regime = ref<Regime>("default");

const css = ref("");
const ready = ref(false);
const rootEl = ref<HTMLElement | null>(null);
const parsedKeyColors = useKeyColors();
const { hue, chroma, setHue, setChroma } = useBrandColor();
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
    selector: ".preferences-preview-root",
    keyColors: config.keyColors,
    highContrastSimulationClass: "hc-simulate",
    forcedColorsSimulationClass: "fc-simulate",
    ...(config.distinction && { distinction: config.distinction }),
  });
  ready.value = true;
}

useThemeBuilder(rootEl);

let unsubscribe: (() => void) | null = null;

onMounted(async () => {
  const mod = await import("@design-axioms/color");
  solveFn = mod.solve;
  generateCSSFn = mod.generateCSS;

  const t = await themeReady;
  rebuildCSS();
  unsubscribe = t.subscribe(() => rebuildCSS());
});

onUnmounted(() => {
  unsubscribe?.();
  unsubscribe = null;
});
</script>

<template>
  <div
    v-if="ready"
    ref="rootEl"
    class="preferences-preview-root hue-brand"
    :class="{ 'hc-simulate': regime === 'hc', 'fc-simulate': regime === 'forced' }"
    :style="{ colorScheme: isDark ? 'dark' : 'light' }"
  >
    <component :is="'style'" v-text="css" />

    <PreviewControls
      :hue="hue"
      :chroma="chroma"
      v-model:is-dark="isDark"
      :key-colors="parsedKeyColors"
      @update:hue="setHue"
      @update:chroma="setChroma"
    />

    <fieldset class="pp-toolbar">
      <legend class="pp-toolbar-legend">Accessibility regime</legend>
      <label
        v-for="opt in [
          { id: 'default', label: 'Default', hint: 'No user preferences set' },
          { id: 'hc', label: 'High contrast', hint: '@media (prefers-contrast: more)' },
          { id: 'forced', label: 'Forced colors', hint: '@media (forced-colors: active)' },
        ] as const"
        :key="opt.id"
        class="pp-toggle"
        :class="{ active: regime === opt.id }"
        :title="opt.hint"
      >
        <input
          type="radio"
          name="pp-regime"
          class="pp-toggle-input"
          :value="opt.id"
          :checked="regime === opt.id"
          @change="regime = opt.id"
        />
        <span>{{ opt.label }}</span>
      </label>
    </fieldset>

    <div class="pp-specimen surface-card">
      <h3 class="text-high pp-title">Account Settings</h3>
      <p class="text-strong pp-body">Manage your profile and preferences.</p>
      <p class="text-subtle pp-body">Last updated 3 days ago.</p>
      <span class="text-subtlest pp-meta">v2.4.1</span>

      <div class="pp-actions">
        <button class="pp-btn surface-action border-interactive text-high">Save</button>
        <button class="pp-btn pp-btn-secondary border-interactive text-high">Cancel</button>
      </div>

      <p class="pp-note text-subtle">
        Same markup. The system re-solves against the selected regime.
      </p>
    </div>

    <div class="pp-legend">
      <div class="pp-legend-row">
        <Token name=".text-high" />
        <Token name=".text-strong" />
        <Token name=".text-subtle" />
        <Token name=".text-subtlest" />
      </div>
      <div class="pp-legend-row">
        <Token name=".border-interactive" />
        <Token name=".surface-action" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.preferences-preview-root {
  margin: 1.5rem 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
}

.pp-toolbar {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-alt);
  margin: 0;
}

/* Visually hide the legend; keeps it as the group's accessible name. */
.pp-toolbar-legend {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.pp-toggle {
  font: inherit;
  font-size: 0.8rem;
  font-weight: 500;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;
}

/* The native radio carries keyboard focus + state; the label is the
   visual. Hide the input but keep it in the accessibility tree. */
.pp-toggle-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

.pp-toggle:hover {
  color: var(--vp-c-text-1);
}

.pp-toggle:has(.pp-toggle-input:focus-visible) {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}

.pp-toggle.active {
  background: var(--vp-c-text-1);
  color: var(--vp-c-bg);
  border-color: var(--vp-c-text-1);
}

.pp-specimen {
  margin: 1rem;
  padding: 1.25rem;
  border-radius: 8px;
}

.pp-title {
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
}

.pp-body {
  font-size: 0.875rem;
  margin: 0 0 0.25rem;
}

.pp-meta {
  display: block;
  font-size: 0.75rem;
  margin-top: 0.5rem;
}

.pp-actions {
  display: flex;
  gap: 0.5rem;
  margin: 1rem 0 0.75rem;
}

.pp-btn {
  font: inherit;
  font-size: 0.8rem;
  font-weight: 500;
  padding: 0.4rem 0.85rem;
  border-radius: 6px;
  border-width: 1px;
  border-style: solid;
  cursor: pointer;
  transition: background 0.15s ease;
}

.pp-btn-secondary {
  background: transparent;
}

.pp-note {
  font-size: 0.75rem;
  margin: 0;
}

.pp-legend {
  padding: 0.75rem 1rem 1rem;
  border-top: 1px solid var(--vp-c-divider);
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.pp-legend-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

@media (max-width: 640px) {
  .pp-toolbar {
    flex-wrap: wrap;
  }
}
</style>
