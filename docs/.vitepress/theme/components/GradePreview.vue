<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import Token from "./Token.vue";
import PreviewControls from "./PreviewControls.vue";
import { useThemeBuilder } from "../composables/useThemeBuilder";
import { useAtmosphereState } from "../composables/useAtmosphereState";

const css = ref("");
const ready = ref(false);
const rootEl = ref<HTMLElement | null>(null);
const parsedKeyColors = ref<Record<string, { hue: number; chroma: number }>>({});
const { hue, chroma, isDark } = useAtmosphereState();

useThemeBuilder(rootEl);

onMounted(async () => {
  const { solve, DEFAULT_CONFIG, generateCSS } =
    await import("@design-axioms/color");

  const output = solve(DEFAULT_CONFIG);
  css.value = generateCSS(output, {
    ...DEFAULT_CONFIG.options,
    selector: ".grade-preview-root",
  });

  if (DEFAULT_CONFIG.anchors.keyColors) {
    const { parseKeyColor } = await import("@design-axioms/color");
    const parsed: Record<string, { hue: number; chroma: number }> = {};
    for (const [name, value] of Object.entries(DEFAULT_CONFIG.anchors.keyColors)) {
      const kc = parseKeyColor(value);
      if (kc) parsed[name] = kc;
    }
    parsedKeyColors.value = parsed;
  }

  ready.value = true;
});

const hueOverride = computed(() =>
  hue.value > 0 || chroma.value > 0
    ? { '--axm-atm-hue': String(hue.value), '--axm-atm-chroma': String(chroma.value) }
    : {},
);
</script>

<template>
  <div
    v-if="ready"
    ref="rootEl"
    class="grade-preview-root"
    :style="{ colorScheme: isDark ? 'dark' : 'light' }"
  >
    <component :is="'style'" v-text="css" />

    <PreviewControls
      v-model:hue="hue"
      v-model:chroma="chroma"
      v-model:is-dark="isDark"
      :key-colors="parsedKeyColors"
      hide-toggle
    />

    <div class="gp-panels">
      <!-- Page polarity: realistic content block -->
      <div class="gp-panel surface-card" :style="hueOverride">
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
        <div class="gp-legend">
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
      <div class="gp-panel surface-spotlight" :style="hueOverride">
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
        <div class="gp-legend">
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
  border-top: 1px solid var(--axm-border-decorative);
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
