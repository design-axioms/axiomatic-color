import { ref, type Ref } from "vue";
import { useReactiveTheme } from "./useReactiveTheme";
import type { ReactiveTheme } from "@design-axioms/color";

interface KeyColorState {
  hue: Ref<number>;
  chroma: Ref<number>;
  setHue(h: number): void;
  setChroma(c: number): void;
}

let parseKeyColorFn:
  | ((color: string) => { hue: number; chroma: number } | null)
  | null = null;
let formatOklchHexFn: ((l: number, c: number, h: number) => string) | null =
  null;

const instances = new Map<string, KeyColorState>();
let coreLoaded = false;

function syncFromConfig(name: string, theme: ReactiveTheme) {
  const state = instances.get(name);
  if (!state || !parseKeyColorFn) return;
  const hex = theme.getConfig().keyColors?.[name];
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
  for (const name of instances.keys()) {
    syncFromConfig(name, theme);
  }
}

export function useKeyColor(name: string): KeyColorState {
  if (instances.has(name)) return instances.get(name)!;

  const hue = ref(0);
  const chroma = ref(0);

  const { ready } = useReactiveTheme();

  function setHue(h: number) {
    hue.value = h;
    if (!formatOklchHexFn) return;
    ready.then((t) =>
      t.setKeyColor(name, formatOklchHexFn!(0.6, chroma.value, h)),
    );
  }

  function setChroma(c: number) {
    chroma.value = c;
    if (!formatOklchHexFn) return;
    ready.then((t) =>
      t.setKeyColor(name, formatOklchHexFn!(0.6, c, hue.value)),
    );
  }

  const state: KeyColorState = { hue, chroma, setHue, setChroma };
  instances.set(name, state);

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
    ready.then((t) => syncFromConfig(name, t));
  }

  return state;
}

export function useBrandColor() {
  return useKeyColor("brand");
}

export function useAccentColor() {
  return useKeyColor("accent");
}
