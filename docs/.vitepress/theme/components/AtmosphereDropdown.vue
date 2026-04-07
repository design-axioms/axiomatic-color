<script setup lang="ts">
import { computed } from "vue";
import { useAtmosphereState } from "../composables/useAtmosphereState";
import { useKeyColors } from "../composables/useKeyColors";
import PreviewControls from "./PreviewControls.vue";

const { hue, chroma, isDark } = useAtmosphereState();
const keyColors = useKeyColors();

const indicatorStyle = computed(() => {
  const c = chroma.value;
  const h = hue.value;
  const bg = c > 0 ? `oklch(0.6 ${c} ${h})` : "var(--vp-c-text-3)";
  return { background: bg };
});
</script>

<template>
  <div class="atmosphere-dropdown">
    <button
      class="atmosphere-btn"
      popovertarget="atmosphere-popover"
      aria-label="Atmosphere controls"
      title="Atmosphere"
    >
      <span class="atmosphere-indicator" :style="indicatorStyle" />
    </button>
    <div id="atmosphere-popover" popover class="atmosphere-popover">
      <PreviewControls
        v-model:hue="hue"
        v-model:chroma="chroma"
        v-model:is-dark="isDark"
        :key-colors="keyColors"
      />
    </div>
  </div>
</template>

<style scoped>
.atmosphere-dropdown {
  display: flex;
  align-items: center;
}

.atmosphere-btn {
  display: flex;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0 4px;
}

.atmosphere-indicator {
  display: block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1.5px solid var(--vp-c-divider);
}

.atmosphere-popover {
  margin: 0;
  position: fixed;
  inset: var(--vp-nav-height) 1rem auto auto;
  width: 420px;
  padding: 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: var(--vp-shadow-3);
  background: var(--vp-c-bg);
}

.atmosphere-popover :deep(.preview-controls) {
  border-bottom: none;
}
</style>
