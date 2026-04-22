<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useShadowRoot } from "../composables/useShadowRoot";
import { useDarkMode } from "../composables/useDarkMode";
import { useThemeBuilder } from "../composables/useThemeBuilder";
import { useReactiveTheme } from "../composables/useReactiveTheme";

const props = defineProps<{
  /** HTML to render inside the shadow root */
  html: string;
  /** Surface class for the wrapper, e.g. "surface-page" */
  surface?: string;
  /** Extra CSS to inject alongside the system sheet */
  extraCss?: string;
}>();

const hostEl = ref<HTMLElement | null>(null);
const { isDark } = useDarkMode();
const { theme, ready } = useReactiveTheme();

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
  if (theme.value) result.push(theme.value.sheet);
  if (extraSheet.value) result.push(extraSheet.value);
  return result;
});

const shadow = useShadowRoot(hostEl, sheets);

useThemeBuilder(hostEl);

// Wait for the reactive theme to be ready before rendering
ready.then(() => {
  renderContent();
});

// Render HTML into shadow DOM.
// Two-level structure: outer sets the site's color-scheme mode,
// inner has the surface class. This lets inverted surfaces like
// .surface-spotlight override color-scheme without fighting inline styles.
watch([shadow, theme, () => props.html], renderContent);

function renderContent() {
  if (!shadow.value || !theme.value) return;
  const surface = props.surface ?? "surface-page";
  shadow.value.innerHTML = `<div class="shadow-surface-outer"><div class="shadow-surface-root ${surface}">${props.html}</div></div>`;
  updateColorScheme();
}

function updateColorScheme() {
  if (!shadow.value) return;
  const outer = shadow.value.querySelector(".shadow-surface-outer") as HTMLElement | null;
  if (!outer) return;
  outer.style.colorScheme = isDark.value ? "dark" : "light";
}

watch(isDark, updateColorScheme);
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
