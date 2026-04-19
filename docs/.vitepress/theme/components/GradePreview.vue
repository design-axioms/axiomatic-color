<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import Token from "./Token.vue";
import PreviewControls from "./PreviewControls.vue";
import { useThemeBuilder } from "../composables/useThemeBuilder";
import { useBrandColor } from "../composables/useKeyColor";
import { useDarkMode } from "../composables/useDarkMode";
import { useKeyColors } from "../composables/useKeyColors";
import { useReactiveTheme } from "../composables/useReactiveTheme";

const css = ref("");
const ready = ref(false);
const rootEl = ref<HTMLElement | null>(null);
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
    selector: ".grade-preview-root",
    keyColors: config.keyColors,
  });
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
</script>

<template>
  <div
    v-if="ready"
    ref="rootEl"
    class="grade-preview-root hue-brand"
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

    <div class="gp-panels">
      <!-- Page polarity: realistic content block -->
      <div class="gp-panel surface-card">
        <div class="gp-article">
          <h3 class="text-high gp-heading">Dashboard Overview</h3>
          <p class="text-strong gp-body">
            Your project has 12 deployments this week with 99.8% uptime across
            all regions.
          </p>
          <p class="text-subtle gp-secondary">
            3 deployments are pending review. Check the activity log for
            details.
          </p>
          <span class="text-subtlest gp-meta">Updated 2 minutes ago</span>
        </div>
        <div class="gp-legend border-decorative">
          <div class="gp-legend-row">
            <span class="gp-legend-grade text-high">High</span>
            <Token name=".text-high" />
          </div>
          <div class="gp-legend-row">
            <span class="gp-legend-grade text-strong">Strong</span>
            <Token name=".text-strong" />
          </div>
          <div class="gp-legend-row">
            <span class="gp-legend-grade text-subtle">Subtle</span>
            <Token name=".text-subtle" />
          </div>
          <div class="gp-legend-row">
            <span class="gp-legend-grade text-subtlest">Subtlest</span>
            <Token name=".text-subtlest" />
          </div>
        </div>
      </div>

      <!-- Spotlight polarity: same structure, inverted -->
      <div class="gp-panel surface-spotlight">
        <div class="gp-article">
          <h3 class="text-high gp-heading">New Feature Available</h3>
          <p class="text-strong gp-body">
            Edge Functions now support streaming responses with automatic
            compression.
          </p>
          <p class="text-subtle gp-secondary">
            Available on Pro and Enterprise plans.
          </p>
          <span class="text-subtlest gp-meta">Announced today</span>
        </div>
        <div class="gp-legend border-decorative">
          <div class="gp-legend-row">
            <span class="gp-legend-grade text-high">High</span>
            <Token name=".text-high" />
          </div>
          <div class="gp-legend-row">
            <span class="gp-legend-grade text-strong">Strong</span>
            <Token name=".text-strong" />
          </div>
          <div class="gp-legend-row">
            <span class="gp-legend-grade text-subtle">Subtle</span>
            <Token name=".text-subtle" />
          </div>
          <div class="gp-legend-row">
            <span class="gp-legend-grade text-subtlest">Subtlest</span>
            <Token name=".text-subtlest" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grade-preview-root {
  margin: 1.5rem 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
}

.gp-panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.gp-panel {
  padding: 1.25rem;
  transition: background 0.3s ease;
}

.gp-article {
  margin-bottom: 1rem;
}

.gp-heading {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  line-height: 1.3;
}

.gp-body {
  font-size: 0.8rem;
  line-height: 1.5;
  margin-bottom: 0.375rem;
}

.gp-secondary {
  font-size: 0.75rem;
  line-height: 1.5;
  margin-bottom: 0.375rem;
}

.gp-meta {
  font-size: 0.7rem;
  display: block;
}

.gp-legend {
  border-top-width: 1px;
  border-top-style: solid;
  padding-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.gp-legend-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.gp-legend-grade {
  font-size: 0.7rem;
  font-weight: 500;
}
</style>
