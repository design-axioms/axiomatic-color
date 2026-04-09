import { ref, watch } from "vue";
import { useReactiveTheme } from "./useReactiveTheme";
import type { ReactiveTheme } from "@design-axioms/color";

const brandHue = ref(0);
const brandChroma = ref(0);

let initialized = false;
let syncing = false;

let parseKeyColorFn: ((color: string) => { hue: number; chroma: number } | null) | null = null;
let formatOklchHexFn: ((l: number, c: number, h: number) => string) | null = null;
let setKeyColorFn: ((name: string, hex: string) => void) | null = null;

function syncFromConfig(theme: ReactiveTheme) {
  const hex = theme.getConfig().anchors.keyColors?.brand;
  if (hex && parseKeyColorFn) {
    const parsed = parseKeyColorFn(hex);
    if (parsed) {
      syncing = true;
      brandHue.value = parsed.hue;
      brandChroma.value = parsed.chroma;
      syncing = false;
    }
  } else {
    syncing = true;
    brandHue.value = 0;
    brandChroma.value = 0;
    syncing = false;
  }
}

export function useBrandColor() {
  const { ready } = useReactiveTheme();

  if (!initialized) {
    initialized = true;
    ready.then(async (t) => {
      const mod = await import("@design-axioms/color");
      parseKeyColorFn = mod.parseKeyColor;
      formatOklchHexFn = mod.formatOklchHex;
      setKeyColorFn = (name, hex) => t.setKeyColor(name, hex);
      syncFromConfig(t);
      t.subscribe(() => syncFromConfig(t));
    });

    watch(brandHue, (h) => {
      if (syncing) return;
      if (!formatOklchHexFn || !setKeyColorFn) return;
      setKeyColorFn("brand", formatOklchHexFn(0.6, brandChroma.value, h));
    });

    watch(brandChroma, (c) => {
      if (syncing) return;
      if (!formatOklchHexFn || !setKeyColorFn) return;
      setKeyColorFn("brand", formatOklchHexFn(0.6, c, brandHue.value));
    });
  }

  return {
    hue: brandHue,
    chroma: brandChroma,
  };
}
