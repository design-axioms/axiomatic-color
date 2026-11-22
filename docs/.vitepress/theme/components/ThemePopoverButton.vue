<script setup lang="ts">
import { computed } from "vue";
import { useAccentColor, useBrandColor } from "../composables/useKeyColor";

withDefaults(
  defineProps<{
    label?: string;
  }>(),
  {
    label: "Theme",
  },
);

const brand = useBrandColor();
const accent = useAccentColor();

const indicatorStyle = computed(() => {
  const bh = brand.hue.value;
  const bc = brand.chroma.value;
  const ah = accent.hue.value;
  const ac = accent.chroma.value;
  const brandBg = bc > 0 ? `oklch(0.6 ${bc} ${bh})` : "var(--vp-c-text-3)";
  const accentBg = ac > 0 ? `oklch(0.6 ${ac} ${ah})` : "var(--vp-c-text-3)";
  return {
    background: `linear-gradient(135deg, ${brandBg} 50%, ${accentBg} 50%)`,
  };
});
</script>

<template>
  <button
    type="button"
    class="theme-popover-btn"
    popovertarget="atmosphere-popover"
    title="Open global theme controls (Brand, Accent, Dark mode, High contrast)"
  >
    <span class="theme-popover-dot" :style="indicatorStyle" aria-hidden="true" />
    <span>{{ label }}</span>
  </button>
</template>

<style scoped>
.theme-popover-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  font-family: var(--vp-font-family-base);
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.4;
  cursor: pointer;
  white-space: nowrap;
  transition:
    border-color 0.15s,
    color 0.15s,
    background 0.15s;
}

.theme-popover-btn:hover {
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-border);
  background: var(--vp-c-bg-soft);
}

.theme-popover-dot {
  display: inline-block;
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  border: 1px solid var(--vp-c-divider);
  flex-shrink: 0;
}
</style>
