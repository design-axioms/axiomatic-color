# CLI Reference

The `@design-axioms/color-cli` package provides the `axiomatic` command.

## Commands

### `build [config]`

Solve the color system and emit CSS.

```bash
axiomatic build                    # Use default config, output to stdout
axiomatic build my-config.json     # Use custom config
axiomatic build --output theme.css # Write to file
```

### `validate [config]`

Solve and report diagnostics without emitting CSS. Shows surface placements, composition classification, and any unmet contrast targets (⚠ markers).

```bash
axiomatic validate
```

Example output:

```
=== LIGHT MODE ===
  page: L=0.9750, polarity=page
  workspace: L=0.9566, polarity=page
    ⚠ unmet text grades: high
  card: L=0.9016, polarity=page
    ⚠ unmet text grades: high, strong, subtle

  Composition:
    page ↔ spotlight: 102.6 APCA [guarantee]
    page ↔ card: 14.2 APCA [enhancement]
```

### `inspect [config]`

Print the raw solver output as JSON. Useful for debugging and tooling integration.

```bash
axiomatic inspect
axiomatic inspect | jq '.light.surfaces[0]'
```

### `demo [config]`

Generate a self-contained HTML demo page. Opens in any browser — no server, no build step.

```bash
axiomatic demo                     # Writes demo.html
axiomatic demo --output my-demo.html
```

The demo includes:

- Surface swatches with text grade samples and APCA tables
- Composition layout showing surface nesting
- Border tier showcase
- Light/dark mode toggle
- Key color picker with oklch hue/chroma sliders
- Generated CSS source viewer
