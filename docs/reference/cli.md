# CLI Reference

The `@design-axioms/color-cli` package provides the `axiomatic` binary:

```bash
pnpm add -D @design-axioms/color-cli@alpha
```

Invoke it with `pnpm exec axiomatic <command>` (or `pnpm cli <command>` inside a local clone of `design-axioms/axiomatic-color`).

## Commands

### `build [config]`

Solve the color system and emit CSS.

```bash
pnpm exec axiomatic build                    # Use default config, output to stdout
pnpm exec axiomatic build my-config.json     # Use custom config
pnpm exec axiomatic build --output theme.css # Write to file (-o also supported)
```

### `validate [config]`

Solve and report diagnostics without emitting CSS. Shows surface placements, high-contrast placements, distinction requirements (`◻`), unmet contrast targets (`⚠`), and composition classifications.

```bash
pnpm exec axiomatic validate
```

Example output (truncated):

```
=== LIGHT MODE ===
  page: L=0.9750, polarity=page
    HC: L=0.9900
  workspace: L=0.9550, polarity=page
    ⚠ unmet text grades: high
    ◻ distinction required (base)
    HC: L=0.9820
      ◻ distinction required (HC)
  card: L=0.9000, polarity=page
    ⚠ unmet text grades: high, strong, subtle
    ◻ distinction required (base)
  action: L=0.9000, polarity=page
    ⚠ unmet text grades: high, strong, subtle
    ◻ distinction required (base)
  spotlight: L=0.1000, polarity=inverted
  spotlight-card: L=0.1200, polarity=inverted
    ◻ distinction required (base)
  spotlight-action: L=0.1200, polarity=inverted
    ◻ distinction required (base)

  Composition:
    page ↔ spotlight: 102.6 APCA [guarantee]
    card ↔ spotlight: 86.6 APCA [guarantee]
    page ↔ card: 14.2 APCA [enhancement]
```

### `inspect [config]`

Print the raw solver output as JSON. Useful for debugging and tooling integration.

```bash
pnpm exec axiomatic inspect
pnpm exec axiomatic inspect | jq '.light.surfaces[0]'
```

### `demo [config]`

Generate a self-contained HTML demo page. Opens in any browser — no server, no build step.

```bash
pnpm exec axiomatic demo                         # Writes demo.html
pnpm exec axiomatic demo --output my-demo.html   # Write to a custom path (-o also supported)
```

The demo includes:

- Surface swatches with text grade samples and APCA tables
- Composition layout showing surface nesting
- Border tier showcase
- Light/dark mode toggle
- Key color picker with oklch hue/chroma sliders
- Generated CSS source viewer
