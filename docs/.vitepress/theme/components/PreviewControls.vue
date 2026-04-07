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
    <label v-if="!hideHue" class="slider-label hue-label">Hue</label>
    <label v-if="!hideChroma" class="slider-label chroma-label">Chroma</label>

    <div v-if="!hideHue" class="slider-wrapper hue-slider">
      <color-slider
        type="hue"
        muted
        :value="String(hue)"
        :hue="String(hue)"
        :chroma="String(chroma)"
        :landmarks="landmarksJson"
        @input="onHueInput"
        @landmark-click="onLandmarkClick"
      />
    </div>

    <div v-if="!hideChroma" class="slider-wrapper chroma-slider">
      <color-slider
        type="chroma"
        muted
        :value="String(chroma)"
        :hue="String(hue)"
        :chroma="String(chroma)"
        @input="onChromaInput"
      />
    </div>

    <button v-if="!hideToggle" class="preview-toggle" @click="emit('update:isDark', !isDark)">
      {{ isDark ? "☀ Light" : "● Dark" }}
    </button>
  </div>
</template>

<style scoped>
.preview-controls {
  padding: 0.75rem 1rem;
  display: grid;
  grid-template:
    "hue-label  chroma-label  ."      auto
    "hue-slider chroma-slider toggle" auto
    / 1fr       0.6fr         minmax(0, auto);
  align-items: center;
  gap: 0.25rem 1rem;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
  font-family: var(--vp-font-family-base);
}

.slider-label {
  font-size: 11px;
  color: var(--vp-c-text-3);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.hue-label { grid-area: hue-label; }
.chroma-label { grid-area: chroma-label; }

.slider-wrapper {
  position: relative;
  min-width: 0;
}

.slider-wrapper color-slider {
  display: flex;
  width: 100%;
}

.hue-slider { grid-area: hue-slider; }
.chroma-slider { grid-area: chroma-slider; }

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
