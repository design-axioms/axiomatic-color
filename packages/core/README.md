# @design-axioms/color

Constraint-solved, APCA-verified semantic color system with native CSS `light-dark()` and OKLCH atmosphere.

> **Alpha pre-release**: Published under the `alpha` dist-tag while the v2 API settles.

## Install

```bash
pnpm add @design-axioms/color@alpha
```

## Usage

```ts
import { DEFAULT_CONFIG, generateCSS, solve } from "@design-axioms/color";

const output = solve(DEFAULT_CONFIG);
const css = generateCSS(output, {
  ...DEFAULT_CONFIG.options,
  keyColors: DEFAULT_CONFIG.keyColors,
});
```

### Entry points

- `@design-axioms/color` — solver, validator, CSS/HTML generators, APCA math primitives, and default config
- `@design-axioms/color/browser` — browser exports (`ThemeBuilder`, constructible stylesheets, custom elements)
- `@design-axioms/color/runtime` — lightweight browser runtime helpers

## Documentation

- Guide & interactive demos: https://color.axioms.design/
- Source: https://github.com/design-axioms/axiomatic-color

## License

MIT
