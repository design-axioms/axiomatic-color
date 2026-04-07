import { ref } from "vue";

// Module-level refs — created once, shared across all consumers.
// Survives VitePress SPA navigation because the module stays loaded.
const hue = ref(0);
const chroma = ref(0);
const isDark = ref(false);

export function useAtmosphereState() {
  return { hue, chroma, isDark };
}
