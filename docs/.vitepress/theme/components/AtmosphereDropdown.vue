<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useAtmosphereState } from "../composables/useAtmosphereState";
import { useReactiveTheme } from "../composables/useReactiveTheme";
import { useKeyColors } from "../composables/useKeyColors";
import PreviewControls from "./PreviewControls.vue";

const { hue, chroma, isDark } = useAtmosphereState();
const { theme } = useReactiveTheme();
const keyColors = useKeyColors();

// Async-loaded core functions
const formatFn = ref<((l: number, c: number, h: number) => string) | null>(
  null,
);
const parseFn = ref<
  ((color: string) => { hue: number; chroma: number } | null) | null
>(null);

onMounted(async () => {
  const { formatOklchHex, parseKeyColor } =
    await import("@design-axioms/color");
  formatFn.value = formatOklchHex;
  parseFn.value = parseKeyColor;
});

/**
 * Bridge: update the reactive theme's key color AND sync the
 * atmosphere refs so TaperCurve and other vizs stay in sync.
 */
function applyBrandColor(hex: string) {
  if (theme.value) {
    theme.value.setKeyColor("brand", hex);
  }
  // Bridge: parse the hex and update atmosphere refs
  if (parseFn.value) {
    const result = parseFn.value(hex);
    if (result) {
      hue.value = result.hue;
      chroma.value = result.chroma;
    }
  }
}

// Focus guard: when editing, the input shows what the user typed;
// when not editing, it shows the computed hex from current atmosphere.
const isEditing = ref(false);
const editText = ref("");
const inputInvalid = ref(false);

const displayHex = computed(() => {
  if (!formatFn.value) return "#000000";
  return formatFn.value(0.6, chroma.value, hue.value);
});

// Sync editText when not editing
watch(displayHex, (hex) => {
  if (!isEditing.value) editText.value = hex;
});

function tryParse(text: string) {
  if (!parseFn.value) return;
  const result = parseFn.value(text);
  if (result) {
    inputInvalid.value = false;
    applyBrandColor(text);
  } else {
    inputInvalid.value = true;
  }
}

function commitEdit() {
  isEditing.value = false;
  inputInvalid.value = false;
  editText.value = displayHex.value;
}

function isActivePreset(name: string): boolean {
  const kc = keyColors.value[name];
  if (!kc) return false;
  return (
    Math.abs(hue.value - kc.hue) < 0.5 &&
    Math.abs(chroma.value - kc.chroma) < 0.005
  );
}

function selectPreset(name: string, kc: { hue: number; chroma: number }) {
  if (!formatFn.value) return;
  const hex = formatFn.value(0.6, kc.chroma, kc.hue);
  applyBrandColor(hex);
  isEditing.value = false;
  inputInvalid.value = false;
}

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
      <div class="key-color-row">
        <input
          class="color-input"
          :class="{ invalid: inputInvalid }"
          :value="isEditing ? editText : displayHex"
          @focus="isEditing = true"
          @blur="commitEdit"
          @input="
            editText = ($event.target as HTMLInputElement).value;
            tryParse(($event.target as HTMLInputElement).value);
          "
          @keydown.enter="($event.target as HTMLInputElement).blur()"
          spellcheck="false"
        />
        <div class="key-color-presets">
          <button
            class="preset-btn"
            :class="{ active: chroma === 0 }"
            :style="{ '--preset-color': 'var(--vp-c-text-3)' }"
            @click="applyBrandColor('#808080')"
          >
            <span class="preset-dot" />
            <span class="preset-name">none</span>
          </button>
          <button
            v-for="(kc, name) in keyColors"
            :key="name"
            class="preset-btn"
            :class="{ active: isActivePreset(String(name)) }"
            :style="{ '--preset-color': `oklch(0.6 ${kc.chroma} ${kc.hue})` }"
            @click="selectPreset(String(name), kc)"
          >
            <span class="preset-dot" />
            <span class="preset-name">{{ name }}</span>
          </button>
        </div>
      </div>
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
  width: 480px;
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

.key-color-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

.color-input {
  width: 7em;
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  outline: none;
}

.color-input:focus {
  border-color: var(--vp-c-brand-1);
}

.color-input.invalid {
  border-color: var(--vp-c-danger-1);
}

.key-color-presets {
  display: flex;
  gap: 0.5rem;
  flex: 1;
}

.preset-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: none;
  cursor: pointer;
  font-size: 11px;
  color: var(--vp-c-text-3);
  font-family: var(--vp-font-family-base);
}

.preset-btn:hover {
  color: var(--vp-c-text-1);
}

.preset-btn.active {
  border-color: var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}

.preset-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--preset-color);
}

.preset-name {
  text-transform: capitalize;
}
</style>
