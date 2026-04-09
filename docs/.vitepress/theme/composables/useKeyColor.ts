import { ref, watch, type Ref } from "vue";
import { useReactiveTheme } from "./useReactiveTheme";
import type { ReactiveTheme } from "@design-axioms/color";

interface KeyColorState {
  hue: Ref<number>;
  chroma: Ref<number>;
}

let parseKeyColorFn:
  | ((color: string) => { hue: number; chroma: number } | null)
  | null = null;
let formatOklchHexFn: ((l: number, c: number, h: number) => string) | null =
  null;

const instances = new Map<string, KeyColorState>();
let coreLoaded = false;
let syncingFromConfig = false;

function syncFromConfig(name: string, theme: ReactiveTheme) {
  const state = instances.get(name);
  if (!state || !parseKeyColorFn) return;
  const hex = theme.getConfig().anchors.keyColors?.[name];
  if (hex) {
    const parsed = parseKeyColorFn(hex);
    if (parsed) {
      state.hue.value = parsed.hue;
      state.chroma.value = parsed.chroma;
      return;
    }
  }
  state.hue.value = 0;
  state.chroma.value = 0;
}

function syncAllFromConfig(theme: ReactiveTheme) {
  syncingFromConfig = true;
  for (const name of instances.keys()) {
    syncFromConfig(name, theme);
  }
  syncingFromConfig = false;
}

export function useKeyColor(name: string): KeyColorState {
  if (instances.has(name)) return instances.get(name)!;

  const hue = ref(0);
  const chroma = ref(0);
  const state: KeyColorState = { hue, chroma };
  instances.set(name, state);

  const { ready } = useReactiveTheme();

  // Load core functions once, subscribe once
  if (!coreLoaded) {
    coreLoaded = true;
    ready.then(async (t) => {
      const mod = await import("@design-axioms/color");
      parseKeyColorFn = mod.parseKeyColor;
      formatOklchHexFn = mod.formatOklchHex;
      syncAllFromConfig(t);
      t.subscribe(() => syncAllFromConfig(t));
    });
  } else {
    // Core already loading/loaded — sync this instance when ready
    ready.then((t) => syncFromConfig(name, t));
  }

  watch(hue, (h) => {
    if (syncingFromConfig) return;
    if (!formatOklchHexFn) return;
    ready.then((t) =>
      t.setKeyColor(name, formatOklchHexFn!(0.6, chroma.value, h)),
    );
  });

  watch(chroma, (c) => {
    if (syncingFromConfig) return;
    if (!formatOklchHexFn) return;
    ready.then((t) =>
      t.setKeyColor(name, formatOklchHexFn!(0.6, c, hue.value)),
    );
  });

  return state;
}

export function useBrandColor() {
  return useKeyColor("brand");
}

export function useAccentColor() {
  return useKeyColor("accent");
}
