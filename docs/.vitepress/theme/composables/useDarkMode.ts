import { ref, watch } from "vue";
import { useData } from "vitepress";

const isDark = ref(false);
let synced = false;

export function useDarkMode() {
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
  return { isDark };
}
