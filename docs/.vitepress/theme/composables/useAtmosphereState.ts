import { ref, watch } from "vue";
import { useData } from "vitepress";

// Module-level refs — created once, shared across all consumers.
// Survives VitePress SPA navigation because the module stays loaded.
// Default to brand hue so visualizations start with color, not flat gray.
const hue = ref(288);
const chroma = ref(0.18);
const isDark = ref(false);
let synced = false;

export function useAtmosphereState() {
  // Sync isDark with VitePress dark mode — they follow each other.
  if (!synced) {
    synced = true;
    try {
      const { isDark: vpDark } = useData();
      isDark.value = vpDark.value;
      watch(vpDark, (v) => {
        isDark.value = v;
      });
      watch(isDark, (v) => {
        vpDark.value = v;
      });
    } catch {
      // useData() may fail outside VitePress context (SSR, tests)
    }
  }
  return { hue, chroma, isDark };
}
