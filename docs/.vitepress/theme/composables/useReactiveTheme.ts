import { ref, type Ref } from "vue";
import type { ReactiveTheme } from "@design-axioms/color";

let themeRef: Ref<ReactiveTheme | null> | null = null;
let themePromise: Promise<ReactiveTheme> | null = null;

export function useReactiveTheme(): {
  theme: Ref<ReactiveTheme | null>;
  ready: Promise<ReactiveTheme>;
} {
  if (!themeRef) {
    themeRef = ref<ReactiveTheme | null>(null);
  }

  if (typeof window === "undefined") {
    return { theme: themeRef, ready: new Promise<ReactiveTheme>(() => {}) };
  }

  if (!themePromise) {
    themePromise = import("@design-axioms/color").then(({ createReactiveTheme }) => {
      const t = createReactiveTheme();
      themeRef!.value = t;
      return t;
    });
  }

  return { theme: themeRef, ready: themePromise };
}
