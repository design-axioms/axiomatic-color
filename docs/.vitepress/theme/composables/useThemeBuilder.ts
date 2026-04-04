import { onUnmounted, watch, type Ref } from "vue";

/**
 * Attach a ThemeBuilder to the component's root element.
 * Uses watch() because the root element may not exist on first mount
 * (components gate rendering behind v-if="ready").
 */
export function useThemeBuilder(rootRef: Ref<HTMLElement | null>): void {
  let destroy: (() => void) | null = null;

  const stop = watch(rootRef, async (el) => {
    // Tear down previous instance if root changes
    destroy?.();
    destroy = null;

    if (!el) return;

    const { createThemeBuilder } = await import("@design-axioms/color");
    const builder = createThemeBuilder({ root: el });
    destroy = builder.destroy;
  });

  onUnmounted(() => {
    stop();
    destroy?.();
  });
}
