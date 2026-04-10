<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import Token from "./Token.vue";
import ApcaBadge from "./ApcaBadge.vue";
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
let generateCSSFn: typeof import("@design-axioms/color").generateCSS | null = null;

function rebuildCSS() {
  if (!theme.value || !solveFn || !generateCSSFn) return;
  const config = theme.value.getConfig();
  const output = solveFn(config);
  css.value = generateCSSFn(output, {
    ...config.options,
    selector: ".border-preview-root",
    keyColors: config.anchors.keyColors,
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
    class="border-preview-root hue-brand"
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

    <div class="bp-panels">
      <div class="bp-panel surface-page">
        <div class="bp-specimen border-decorative">
          <div class="bp-specimen-header">
            <span class="text-high bp-specimen-title">Decorative</span>
            <Token name=".border-decorative" />
          </div>
          <span class="text-subtle bp-specimen-desc"
            >Subtle container outlines</span
          >
        </div>

        <div class="bp-specimen border-interactive">
          <div class="bp-specimen-header">
            <span class="text-high bp-specimen-title">Interactive</span>
            <Token name=".border-interactive" />
          </div>
          <span class="text-subtle bp-specimen-desc"
            >Buttons, inputs, clickable elements</span
          >
        </div>

        <div class="bp-specimen border-critical">
          <div class="bp-specimen-header">
            <span class="text-high bp-specimen-title">Critical</span>
            <Token name=".border-critical" />
          </div>
          <span class="text-subtle bp-specimen-desc"
            >Error states, required fields</span
          >
        </div>
      </div>

      <div class="bp-panel surface-spotlight">
        <div class="bp-specimen border-decorative">
          <div class="bp-specimen-header">
            <span class="text-high bp-specimen-title">Decorative</span>
            <Token name=".border-decorative" />
          </div>
          <span class="text-subtle bp-specimen-desc"
            >Same class, inverted surface</span
          >
        </div>

        <div class="bp-specimen border-interactive">
          <div class="bp-specimen-header">
            <span class="text-high bp-specimen-title">Interactive</span>
            <Token name=".border-interactive" />
          </div>
          <span class="text-subtle bp-specimen-desc">Resolves per surface</span>
        </div>

        <div class="bp-specimen border-critical">
          <div class="bp-specimen-header">
            <span class="text-high bp-specimen-title">Critical</span>
            <Token name=".border-critical" />
          </div>
          <span class="text-subtle bp-specimen-desc"
            >Contrast target met on both</span
          >
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.border-preview-root {
  margin: 1.5rem 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
}

.bp-panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.bp-panel {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: background 0.3s ease;
}

.bp-specimen {
  border-width: 2px;
  border-style: solid;
  border-radius: 6px;
  padding: 0.75rem;
}

.bp-specimen-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.bp-specimen-title {
  font-size: 0.8rem;
  font-weight: 600;
}

.bp-specimen-desc {
  font-size: 0.65rem;
  display: block;
}

@media (max-width: 640px) {
  .bp-panels {
    grid-template-columns: 1fr;
  }
}
</style>
