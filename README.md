# Axiomatic Color

**A physics engine for design.** Guarantees contrast correctness for text, borders, and interactive elements on semantic surfaces, using APCA as the contrast metric.

$$
\text{Color} = f(\text{Context}, \text{Intent})
$$

Axiomatic Color eliminates the conflict between aesthetics and accessibility by treating them as constraints in the same mathematical system. You declare your intent — surfaces, atmosphere, contrast targets — and the solver finds colors that satisfy all constraints simultaneously.

## Features

- **Contrast guarantees** — text grades and border tiers solved against APCA targets with hue-aware safety margins
- **`light-dark()` native** — pure CSS mode switching, no runtime JS
- **Semantic surfaces** — a card is always a card, regardless of DOM nesting
- **Safe bicone taper** — chroma fades near lightness extremes via `calc()`, preventing out-of-gamut colors
- **Self-auditing** — diagnostics flag unmet targets per surface per mode

## Quick Start

```bash
pnpm add @design-axioms/color
```

```typescript
import { DEFAULT_CONFIG, generateCSS, solve } from "@design-axioms/color";

const output = solve(DEFAULT_CONFIG);
const css = generateCSS(output, {
  ...DEFAULT_CONFIG.options,
  keyColors: DEFAULT_CONFIG.anchors.keyColors,
});
```

## CLI

```bash
npx axiomatic build              # Emit CSS
npx axiomatic validate           # Show diagnostics
npx axiomatic demo               # Generate interactive HTML demo
```

## Demo

Generate a self-contained HTML demo to explore the color system:

```bash
npx axiomatic demo
open demo.html
```

The demo includes surface swatches, composition layout, border showcase, mode toggle, and a key color picker with oklch hue/chroma sliders.

## Documentation

```bash
pnpm docs:dev     # Local dev server
pnpm docs:build   # Build static site
```

- [Why Axiomatic?](docs/why.md) — The problem and the solution
- [Getting Started](docs/getting-started.md) — Installation and usage
- [Surfaces](docs/surfaces.md) — Named regions with fixed lightness
- [Text](docs/text.md) — Four contrast grades, solved per surface
- [Borders](docs/borders.md) — Three tiers: decorative, interactive, critical
- [Atmosphere](docs/atmosphere.md) — Opt-in color via key colors
- [Composition](docs/composition.md) — Independent axes, polarity inversion
- [CLI Reference](docs/reference/cli.md) — All commands and options

## Architecture

The system encodes seven validated architecture decisions:

1. `light-dark()` for mode switching — each branch wraps a complete `oklch()` color
2. Solver as validator — plans, solves, classifies, reports
3. Two independent polarity ladders — page and inverted, solved separately
4. Three-tier composition contract — guarantee, enhancement, out of scope
5. Safe bicone taper — `calc(C × (1 - |2L - 1|))` in every `oklch()` chroma slot
6. Hue-aware safety margins — interpolated per chroma level
7. Semantic surface identity — slug-determined, not position-determined

## License

MIT
