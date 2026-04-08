<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import DarkToggle from "./DarkToggle.vue";
import { useAtmosphereState } from "../composables/useAtmosphereState";

const { hue, chroma: maxChroma, isDark } = useAtmosphereState();

const STRIP_STEPS = 80;

function taperFactor(l: number): number {
  return 1 - Math.abs(2 * l - 1);
}

function effectiveChroma(l: number): number {
  return maxChroma.value * taperFactor(l);
}

function colorAt(l: number): string {
  const c = effectiveChroma(l);
  return `oklch(${l.toFixed(3)} ${c.toFixed(4)} ${hue.value})`;
}

const lightSurfaces = ref<Array<{ name: string; l: number }>>([]);
const darkSurfaces = ref<Array<{ name: string; l: number }>>([]);

const surfaces = computed(() =>
  isDark.value ? darkSurfaces.value : lightSurfaces.value,
);

onMounted(async () => {
  const { solve, DEFAULT_CONFIG } = await import("@design-axioms/color");
  const output = solve(DEFAULT_CONFIG);

  for (const [mode, target] of [
    ["light", lightSurfaces] as const,
    ["dark", darkSurfaces] as const,
  ]) {
    const result: Array<{ name: string; l: number }> = [];
    for (const group of DEFAULT_CONFIG.groups) {
      for (const s of group.surfaces) {
        const solved = output[mode].surfaces.find((x) => x.slug === s.slug);
        if (!solved) continue;
        result.push({ name: s.label, l: solved.lightness });
      }
    }
    result.sort((a, b) => a.l - b.l);
    target.value = result;
  }
});

// Build CSS gradient stops for the strip
const stripGradient = computed(() => {
  const stops: string[] = [];
  for (let i = 0; i <= STRIP_STEPS; i++) {
    const l = i / STRIP_STEPS;
    stops.push(`${colorAt(l)} ${(l * 100).toFixed(1)}%`);
  }
  return `linear-gradient(to right, ${stops.join(", ")})`;
});

function surfaceNeutral(l: number): string {
  return `oklch(${l.toFixed(3)} 0 0)`;
}

function taperPct(l: number): string {
  return (taperFactor(l) * 100).toFixed(0);
}

function surfaceLeft(l: number): string {
  return `${(l * 100).toFixed(1)}%`;
}

// Connector paths: from tick position to evenly-spaced swatch center
function connectorPath(l: number, index: number): string {
  const W = 400;
  const H = 30;
  const fromX = l * W;
  const count = surfaces.value.length;
  const toX = ((2 * index + 1) / (2 * count)) * W;
  const r = 6;

  if (Math.abs(fromX - toX) < 2) {
    return `M${fromX},0 L${fromX},${H}`;
  }

  const dir = toX > fromX ? 1 : -1;
  const midY = H * 0.45;

  return [
    `M${fromX},0`,
    `L${fromX},${midY - r}`,
    `Q${fromX},${midY} ${fromX + dir * r},${midY}`,
    `L${toX - dir * r},${midY}`,
    `Q${toX},${midY} ${toX},${midY + r}`,
    `L${toX},${H}`,
  ].join(" ");
}
</script>

<template>
  <div class="taper-root">
    <div class="taper-toolbar">
      <DarkToggle v-model="isDark" />
    </div>

    <!-- The gradient strip -->
    <div v-if="surfaces.length > 0" class="taper-strip-area">
      <div class="taper-strip-labels">
        <span class="taper-label-dark">Dark</span>
        <span class="taper-label-light">Light</span>
      </div>
      <div
        class="taper-strip"
        role="img"
        :aria-label="`Taper gradient from L=0 to L=1 at hue ${Math.round(hue)}°`"
        :style="{ background: stripGradient }"
      >
        <!-- Surface markers -->
        <div
          v-for="s in surfaces"
          :key="s.name"
          class="taper-marker"
          :style="{ left: surfaceLeft(s.l) }"
        >
          <div
            class="taper-tick"
            :class="s.l > 0.5 ? 'tick-dark' : 'tick-light'"
          ></div>
        </div>
      </div>
    </div>

    <!-- Connector lines from strip ticks to swatches -->
    <svg
      v-if="surfaces.length > 0"
      class="taper-connectors"
      viewBox="0 0 400 30"
      preserveAspectRatio="none"
      role="img"
      aria-label="Connector lines from lightness positions to surface swatches"
    >
      <path
        v-for="(s, i) in surfaces"
        :key="s.name"
        :d="connectorPath(s.l, i)"
        class="taper-connector"
      />
    </svg>

    <!-- Surface swatches -->
    <div v-if="surfaces.length > 0" class="taper-surfaces">
      <div v-for="s in surfaces" :key="s.name" class="taper-surface">
        <div class="taper-swatch-pair">
          <div class="taper-swatch" :style="{ background: colorAt(s.l) }"></div>
          <div
            class="taper-swatch neutral"
            :style="{ background: surfaceNeutral(s.l) }"
          ></div>
        </div>
        <div class="taper-surface-info">
          <span class="taper-surface-name">{{ s.name }}</span>
          <span class="taper-surface-pct">{{ taperPct(s.l) }}% chroma</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.taper-root {
  margin: 1.5rem 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
}

.taper-toolbar {
  display: flex;
  justify-content: flex-end;
  padding: 0.5rem 1rem;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
}

/* --- Strip --- */

.taper-strip-area {
  padding: 0.5rem 1rem 0;
}

.taper-strip {
  position: relative;
  height: 48px;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
}

.taper-marker {
  position: absolute;
  top: 0;
  bottom: 0;
  transform: translateX(-50%);
}

.taper-marker-name {
  font-size: 0.55rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
  white-space: nowrap;
}

.taper-tick {
  width: 1.5px;
  height: 100%;
}

.tick-light {
  background: rgba(255, 255, 255, 0.7);
}

.tick-dark {
  background: rgba(0, 0, 0, 0.25);
}

.taper-strip-labels {
  display: flex;
  justify-content: space-between;
  padding: 0 0 0.25rem;
  font-size: 0.6rem;
  font-family: var(--vp-font-family-mono);
}

.taper-label-dark {
  color: var(--vp-c-text-2);
}

.taper-label-light {
  color: var(--vp-c-text-1);
}

/* --- Connectors --- */

.taper-connectors {
  display: block;
  width: calc(100% - 2rem);
  height: 28px;
  margin: 0 1rem;
}

.taper-connector {
  fill: none;
  stroke: var(--vp-c-text-3);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

/* --- Surfaces --- */

.taper-surfaces {
  display: flex;
  justify-content: space-around;
  width: calc(100% - 2rem);
  margin: 0 1rem;
  padding: 0.5rem 0;
}

.taper-surface {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  flex: 1;
}

.taper-swatch-pair {
  display: flex;
  gap: 2px;
}

.taper-swatch {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: 1px solid var(--vp-c-divider);
  transition: background 0.15s;
}

.taper-surface-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
}

.taper-surface-name {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}
.taper-surface-pct {
  font-size: 0.6rem;
  color: var(--vp-c-text-3);
  font-family: var(--vp-font-family-mono);
}
</style>
