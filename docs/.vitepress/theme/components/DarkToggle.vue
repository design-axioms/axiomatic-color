<script setup lang="ts">
const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ "update:modelValue": [value: boolean] }>();
</script>

<template>
  <button
    class="dark-toggle"
    :aria-label="modelValue ? 'Switch to light theme' : 'Switch to dark theme'"
    @click="emit('update:modelValue', !modelValue)"
  >
    {{ modelValue ? '☀ Light' : '● Dark' }}
  </button>
</template>

<style scoped>
.dark-toggle {
  padding: 0.25rem 0.65rem;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  cursor: pointer;
  font-size: 0.75rem;
  font-family: var(--vp-font-family-base);
  white-space: nowrap;
}

.dark-toggle:hover {
  background: var(--vp-c-bg-soft);
}
</style>
