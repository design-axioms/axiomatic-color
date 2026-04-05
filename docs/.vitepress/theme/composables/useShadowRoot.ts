import {
  onMounted,
  shallowRef,
  watch,
  toValue,
  type MaybeRefOrGetter,
  type ShallowRef,
} from "vue";

/**
 * Attach a shadow root to a host element and manage adoptedStyleSheets.
 *
 * Returns a shallow ref to the ShadowRoot, which is null until mounted.
 * When `sheets` changes, the shadow root's adoptedStyleSheets are updated.
 */
export function useShadowRoot(
  hostRef: MaybeRefOrGetter<HTMLElement | null>,
  sheets: MaybeRefOrGetter<CSSStyleSheet[]>,
): ShallowRef<ShadowRoot | null> {
  const shadow = shallowRef<ShadowRoot | null>(null);

  onMounted(() => {
    const host = toValue(hostRef);
    if (!host) return;
    shadow.value = host.attachShadow({ mode: "open" });
    shadow.value.adoptedStyleSheets = toValue(sheets);
  });

  watch(
    () => toValue(sheets),
    (s) => {
      if (shadow.value) shadow.value.adoptedStyleSheets = s;
    },
  );

  return shadow;
}
