<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useThemeBuilder } from "../composables/useThemeBuilder";
import { useDarkMode } from "../composables/useDarkMode";
import { useReactiveTheme } from "../composables/useReactiveTheme";

const css = ref("");
const ready = ref(false);
const rootEl = ref<HTMLElement | null>(null);
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
    selector: ".pipeline-root",
    keyColors: config.keyColors,
    highContrastSimulationClass: "hc-simulate",
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

const stages = [
  {
    name: "Config",
    items: ["Scales", "Surfaces & Roles", "Targets", "Key Colors"],
  },
  {
    name: "Solver",
    items: ["Lookup lightness", "Solve text & borders", "Check distinction", "Diagnostics"],
  },
  {
    name: "CSS",
    items: ["light-dark()", "oklch() + Taper", "prefers-contrast", "forced-colors"],
  },
  {
    name: "Runtime",
    items: ["ThemeBuilder", "color-scheme", "Constructible sheets", "Custom elements"],
  },
];
</script>

<template>
  <div
    v-if="ready"
    ref="rootEl"
    class="pipeline-root surface-workspace hue-brand"
    :style="{ colorScheme: isDark ? 'dark' : 'light' }"
  >
    <component :is="'style'" v-text="css" />

    <div class="pl-flow">
      <div
        v-for="stage in stages"
        :key="stage.name"
        class="pl-stage surface-card border-decorative"
      >
        <span class="text-high pl-stage-name">{{ stage.name }}</span>
        <ul class="pl-items">
          <li v-for="item in stage.items" :key="item" class="text-subtle pl-item">
            {{ item }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pipeline-root {
  margin: 1.5rem 0;
  border-radius: 8px;
  padding: 1.25rem;
}

.pl-flow {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.pl-stage {
  border-width: 1px;
  border-style: solid;
  border-radius: 6px;
  padding: 0.75rem;
  position: relative;
}

.pl-stage-name {
  font-size: 0.8rem;
  font-weight: 600;
  display: block;
  margin-bottom: 0.5rem;
}

.pl-items {
  list-style: none;
  padding: 0;
  margin: 0;
}

.pl-item {
  font-size: 0.65rem;
  line-height: 1.6;
}

/* Arrows between stages */
.pl-stage:not(:last-child)::after {
  content: "→";
  position: absolute;
  right: -0.55rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
  z-index: 1;
}

@media (max-width: 640px) {
  .pl-flow {
    grid-template-columns: 1fr 1fr;
  }
  .pl-stage:not(:last-child)::after {
    display: none;
  }
}

@media (max-width: 420px) {
  .pl-flow {
    grid-template-columns: 1fr;
  }
}
</style>
