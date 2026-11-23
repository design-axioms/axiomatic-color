# @design-axioms/color-cli

Command-line interface for the Axiomatic Color System. Solves configs against APCA contrast targets, emits native `light-dark()` CSS, prints diagnostics, and generates standalone interactive HTML demos.

> **Alpha pre-release**: Published under the `alpha` dist-tag while the v2 CLI settles.

## Install

```bash
pnpm add -D @design-axioms/color-cli@alpha
```

## Usage

```bash
axiomatic build -o axiomatic.css     # Emit CSS
axiomatic validate                   # Print solved surfaces & APCA diagnostics
axiomatic inspect                    # Print full solver output as JSON
axiomatic demo -o demo.html          # Generate a self-contained HTML demo
```

## Documentation

- CLI reference: https://color.axioms.design/reference/cli
- Guide & interactive demos: https://color.axioms.design/
- Source: https://github.com/design-axioms/axiomatic-color

## License

MIT
