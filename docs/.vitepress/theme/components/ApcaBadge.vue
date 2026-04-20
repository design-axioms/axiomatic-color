<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  value: number;
  target?: number;
  label?: string;
}>();

const status = computed(() =>
  props.target
    ? props.value >= props.target
      ? "met"
      : props.value >= props.target * 0.9
        ? "close"
        : "unmet"
    : "info",
);
</script>

<template>
  <a
    class="apca-badge"
    :class="status"
    href="/reference/apca"
    :title="`APCA Lc ${value}${target ? ` (target: ${target})` : ''}`"
  >
    <svg class="apca-icon" viewBox="0 0 12 12" fill="none">
      <template v-if="status === 'met'">
        <circle
          cx="6"
          cy="6"
          r="5"
          stroke="currentColor"
          stroke-width="1.2"
          fill="none"
        />
        <path
          d="M3.5 6L5.5 8L8.5 4"
          stroke="currentColor"
          stroke-width="1.3"
          stroke-linecap="round"
          stroke-linejoin="round"
          fill="none"
        />
      </template>
      <template v-else-if="status === 'close'">
        <circle
          cx="6"
          cy="6"
          r="5"
          stroke="currentColor"
          stroke-width="1.2"
          fill="none"
        />
        <path
          d="M4 6.5Q6 5 8 6.5"
          stroke="currentColor"
          stroke-width="1.3"
          stroke-linecap="round"
          fill="none"
        />
      </template>
      <template v-else>
        <path
          d="M6 1.5L11 10.5H1Z"
          stroke="currentColor"
          stroke-width="1.2"
          stroke-linejoin="round"
          fill="none"
        />
        <path
          d="M6 5.5V7"
          stroke="currentColor"
          stroke-width="1.3"
          stroke-linecap="round"
        />
        <circle cx="6" cy="8.5" r="0.6" fill="currentColor" />
      </template>
    </svg>
    <span class="apca-value">Lc {{ value }}</span>
    <span v-if="label" class="apca-label">{{ label }}</span>
  </a>
</template>

<style scoped>
.apca-badge {
  display: inline-flex;
  align-items: baseline;
  gap: 0.25rem;
  padding: 0.1rem 0.45rem 0.1rem 0.3rem;
  border-radius: 10rem;
  font-size: 0.78em;
  font-family: var(--vp-font-family-mono);
  font-weight: 500;
  text-decoration: none;
  line-height: 1.4;
  vertical-align: baseline;
  cursor: pointer;
  transition: opacity 0.15s;
  white-space: nowrap;
}

.apca-badge:hover {
  opacity: 0.85;
}

.apca-icon {
  width: 0.7em;
  height: 0.7em;
  flex-shrink: 0;
  align-self: center;
}

.apca-value {
  font-weight: 600;
}

.apca-label {
  font-weight: 400;
  opacity: 0.8;
}

/* Status colors */
.met {
  background: rgba(16, 185, 129, 0.12);
  color: #18794e;
}

.close {
  background: rgba(234, 179, 8, 0.14);
  color: #915930;
}

.unmet {
  background: rgba(244, 63, 94, 0.12);
  color: #b8272c;
}

.info {
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-2);
}
</style>
