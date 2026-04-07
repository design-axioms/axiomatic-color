<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useShadowRoot } from "../composables/useShadowRoot";
import { useAtmosphereState } from "../composables/useAtmosphereState";
import { useThemeBuilder } from "../composables/useThemeBuilder";

const props = defineProps<{
  /** HTML to render inside the shadow root */
  html: string;
  /** Surface class for the wrapper, e.g. "surface-page" */
  surface?: string;
  /** Extra CSS to inject alongside the system sheet */
  extraCss?: string;
}>();

const hostEl = ref<HTMLElement | null>(null);
const systemSheet = ref<CSSStyleSheet | null>(null);
const { hue, chroma, isDark } = useAtmosphereState();

const baseSheet = (() => {
  const s = new CSSStyleSheet();
  s.replaceSync(`.shadow-surface-root { padding: 1.25rem; }`);
  return s;
})();

const extraSheet = computed(() => {
  if (!props.extraCss) return null;
  const s = new CSSStyleSheet();
  s.replaceSync(props.extraCss);
  return s;
});

const sheets = computed(() => {
  const result: CSSStyleSheet[] = [baseSheet];
  if (systemSheet.value) result.push(systemSheet.value);
  if (extraSheet.value) result.push(extraSheet.value);
  return result;
});

const shadow = useShadowRoot(hostEl, sheets);

useThemeBuilder(hostEl);

onMounted(async () => {
  const { getSystemStyleSheet } = await import("@design-axioms/color");
  systemSheet.value = await getSystemStyleSheet();
});

// Render HTML into shadow DOM
watch([shadow, systemSheet, () => props.html], () => {
  if (!shadow.value || !systemSheet.value) return;
  const surface = props.surface ?? "surface-page";
  shadow.value.innerHTML = `<div class="shadow-surface-root ${surface}">${props.html}</div>`;
  updateAtmosphere();
});

function updateAtmosphere() {
  if (!shadow.value) return;
  const wrapper = shadow.value.querySelector(".shadow-surface-root") as HTMLElement | null;
  if (!wrapper) return;
  wrapper.style.colorScheme = isDark.value ? "dark" : "light";
  if (hue.value > 0 || chroma.value > 0) {
    wrapper.style.setProperty("--axm-atm-hue", String(hue.value));
    wrapper.style.setProperty("--axm-atm-chroma", String(chroma.value));
  } else {
    wrapper.style.removeProperty("--axm-atm-hue");
    wrapper.style.removeProperty("--axm-atm-chroma");
  }
}

watch([shadow, hue, chroma, isDark], updateAtmosphere);
</script>

<template>
  <div ref="hostEl" class="shadow-surface-host" />
</template>

<style scoped>
.shadow-surface-host {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
}
</style>