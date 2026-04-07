import { ref, type Ref } from "vue";

type ParsedKeyColors = Record<string, { hue: number; chroma: number }>;

let parsed: Ref<ParsedKeyColors> | null = null;

export function useKeyColors(): Ref<ParsedKeyColors> {
  if (parsed) return parsed;
  parsed = ref({});

  import("@design-axioms/color").then(({ DEFAULT_CONFIG, parseKeyColor }) => {
    if (!DEFAULT_CONFIG.anchors.keyColors) return;
    const result: ParsedKeyColors = {};
    for (const [name, value] of Object.entries(DEFAULT_CONFIG.anchors.keyColors)) {
      const kc = parseKeyColor(value);
      if (kc) result[name] = kc;
    }
    parsed!.value = result;
  });

  return parsed;
}
