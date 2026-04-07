<script setup lang="ts">
import { computed, onMounted } from "vue";

const props = withDefaults(
  defineProps<{
    hue?: number;
    chroma?: number;
    isDark?: boolean;
    keyColors?: Record<string, { hue: number; chroma: number }>;
    hideChroma?: boolean;
    hideHue?: boolean;
    hideToggle?: boolean;
    vivid?: boolean;
    chromaMin?: number;
    chromaMax?: number;
    chromaStep?: number;
  }>(),
  {
    hue: 0,
    chroma: 0,
    isDark: false,
  },
);

const emit = defineEmits<{
  "update:hue": [value: number];
  "update:chroma": [value: number];
  "update:isDark": [value: boolean];
}>();

onMounted(async () => {
  const { registerColorSlider } = await import("@design-axioms/color");
  registerColorSlider();
});

const landmarksJson = computed(() => {
  if (!props.keyColors) return undefined;
  const items = Object.entries(props.keyColors)
    .map(([name, { hue, chroma }]) => ({
      value: hue,
      color: `oklch(0.6 ${chroma} ${hue})`,
      name,
    }))
    .sort((a, b) => a.value - b.value);
  return JSON.stringify(items);
});

function onHueInput(e: Event) {
  const detail = (e as CustomEvent).detail;
  if (detail) emit("update:hue", detail.value);
}

function onChromaInput(e: Event) {
  const detail = (e as CustomEvent).detail;
  if (detail) emit("update:chroma", detail.value);
}

function onLandmarkClick(e: Event) {
  const detail = (e as CustomEvent).detail;
  if (!detail || !props.keyColors) return;
  // Find the key color that matches this landmark's name
  const kc = props.keyColors[detail.name];
  if (kc) {
    emit("update:hue", kc.hue);
    emit("update:chroma", kc.chroma);
  }
}
</script>

<template>
  <div class="preview-controls">
    <label v-if="!hideHue" class="slider-group">
      <color-slider
        type="hue"
        :muted="!vivid || undefined"
        :value="String(hue)"
        :hue="String(hue)"
        :chroma="String(chroma)"
        :landmarks="landmarksJson"
        @input="onHueInput"
        @landmark-click="onLandmarkClick"
      />
      <span class="slider-val">{{ Math.round(hue) }}°</span>
    </label>

    <label v-if="!hideChroma" class="slider-group slider-group--chroma">
      <color-slider
        type="chroma"
        :muted="!vivid || undefined"
        :value="String(chroma)"
        :hue="String(hue)"
        :chroma="String(chroma)"
        :min="chromaMin != null ? String(chromaMin) : undefined"
        :max="chromaMax != null ? String(chromaMax) : undefined"
        :step="chromaStep != null ? String(chromaStep) : undefined"
        @input="onChromaInput"
      />
      <span class="slider-val">{{ chroma.toFixed(2) }}</span>
    </label>

    <button v-if="!hideToggle" class="preview-toggle" @click="emit('update:isDark', !isDark)">
      {{ isDark ? "☀ Light" : "● Dark" }}
    </button>
  </div>
</template>

<style scoped>
.preview-controls {
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
  font-family: var(--vp-font-family-base);
}

.slider-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
  cursor: default;
}

.slider-group--chroma {
  flex: 0.5;
}

.slider-group color-slider {
  display: flex;
  flex: 1;
  min-width: 0;
}

.slider-val {
  font-size: 11px;
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-text-3);
  min-width: 2.5em;
  text-align: right;
  flex-shrink: 0;
}

.preview-toggle {
  grid-area: toggle;
  padding: 0.35rem 0.85rem;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  cursor: pointer;
  font-size: 0.85rem;
  font-family: var(--vp-font-family-base);
  white-space: nowrap;
  justify-self: end;
}

.preview-toggle:hover {
  background: var(--vp-c-bg-soft);
}
</style>
