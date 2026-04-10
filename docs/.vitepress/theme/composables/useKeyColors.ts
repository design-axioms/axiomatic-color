import { ref, type Ref } from "vue";

type ParsedKeyColor = { hue: number; chroma: number; hex: string };
type ParsedKeyColors = Record<string, ParsedKeyColor>;

let parsed: Ref<ParsedKeyColors> | null = null;

export function useKeyColors(): Ref<ParsedKeyColors> {
  if (parsed) return parsed;
  parsed = ref({});

  import("@design-axioms/color").then(({ DEFAULT_CONFIG, parseKeyColor }) => {
    if (!DEFAULT_CONFIG.anchors.keyColors) return;
    const result: ParsedKeyColors = {};
    for (const [name, value] of Object.entries(
      DEFAULT_CONFIG.anchors.keyColors,
    )) {
      const kc = parseKeyColor(value);
      if (kc) result[name] = { ...kc, hex: value };
    }
    parsed!.value = result;
  });

  return parsed;
}
