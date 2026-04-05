# Architecture

This document records the system's architecture decisions.

<PipelineDiagram />

## Scope of guarantees

The system guarantees that text, borders, and interactive elements on solved surfaces meet their APCA targets. It does not guarantee visual hierarchy. Visual hierarchy depends on multiple signals, including borders, shadows, spacing, lightness, and chroma, and belongs to a design-system layer built on top of this color system.

## 1. Mode mechanism: `light-dark()`

The system uses CSS `light-dark()` as its mode-switching mechanism.

- Light and dark are solved independently as complete solutions.
- `color-scheme` on `:root` selects the active mode, and `transition` on surface properties animates the change.
- The model has no intermediate mode states, so mode transitions do not require chroma tunneling.
- Each `light-dark()` call wraps two complete `oklch()` colors rather than bare numeric channels.

## 2. Solver responsibilities

The solver validates whether the system's guarantees can be met. It pre-solves lightness values and emits diagnostics for unmet targets.

The solver performs the following work:

- It places surfaces on the lightness ladder by polarity, group order, and contrast offset.
- It pre-solves text lightness for all grades on all surfaces in both modes.
- It pre-solves border lightness for all tiers on all surfaces in both modes.
- It computes hue-aware safety margins.
- It classifies composition relationships as guarantees or enhancements.
- It reports diagnostics for unmet targets.

The solver does not compute intermediate mode states, because `light-dark()` removes that requirement. It also does not track DOM nesting depth or parent-relative composition.

## 3. Text derivation

`light-dark()` accepts only `<color>` values, so each mode branch must emit a complete `oklch()` color with a pre-solved lightness value. The solver is the single source of truth for those lightness values.

The system reserves the dead zone at L ≈ 0.46–0.82. Surfaces should not be placed in that range because neither polarity can produce adequate text contrast there.

## 4. Chroma and hue effects

At C = 0.30, APCA shifts by at most ~0.6 points, so chroma does not materially change contrast validation. At L = 0.9 and C = 0.15, hue can shift APCA by ~5.4 points. The worst-case hues are magenta and red near 330°.

The solver applies the following safety margins before validation so that targets hold at the worst-case hue:

| Chroma | Safety Margin |
|--------|--------------|
| 0.05   | 2 APCA pts   |
| 0.10   | 3 APCA pts   |
| 0.15   | 4 APCA pts   |
| 0.20   | 5 APCA pts   |

## 5. Safe bicone taper

Chroma fades near lightness extremes via a single `calc()` expression:

$$C_{\text{effective}} = C \times (1 - |2L - 1|)$$

At L = 0.5, the taper preserves full chroma. At L = 0 or L = 1, it reduces chroma to zero. This prevents out-of-gamut colors at the CSS level. The `min(C, ...)` wrapper from the spec is algebraically redundant because the taper factor is always in $[0, 1]$.

## 6. Surface composition: three-tier contract

### Tier 1: Guarantees

- Text on any surface meets its APCA target grade.
- Cross-polarity surface pairs remain visually distinct with an 80+ APCA gap.
- Atmosphere is correct and inheritable.

### Tier 2: Enhancements

- Same-polarity surfaces can differ by small lightness steps.
- Hover and active states can use lightness shifts.
- These values are real and non-zero, but they are not sufficient by themselves to guarantee visual distinction.

### Tier 3: Out of scope

- Multi-signal visual hierarchy remains outside the color system.
- Consumers that need stronger surface distinction must add other signals.

## 7. Surface identity: semantic, not positional

A surface's lightness is fixed by its semantic name and the current mode and polarity. It does not change based on DOM nesting depth or parent surface.

- `card` always resolves to the same lightness, whether it appears inside `page` or `workspace`.
- The solver has no depth parameter, so it solves each surface once per mode and polarity.
- CSS resets local tokens per `.surface-*` class, and descendants inherit the nearest surface context.

## 8. Polarity: two independent ladders

Page-polarity and inverted-polarity surfaces live on independent lightness ladders. A polarity flip is a context reset, not a nesting level.

- Page surfaces share one contrast budget solved against page anchors.
- Inverted surfaces share a separate budget solved against inverted anchors.
- An inverted surface inside a page surface is solved independently on its own ladder.

## 9. Atmosphere: orthogonal to lightness

The system composes along two orthogonal axes.

- Lightness composition has a finite budget, uses a semantic ladder, and yields at most ~2 distinguishable levels per polarity per mode.
- Atmosphere composition applies hue and chroma tinting and does not consume the lightness budget.

Surfaces are achromatic by default. Each surface class writes `--axm-atm-hue: 0; --axm-atm-chroma: 0;` to establish a neutral atmosphere context. Atmosphere is applied per surface through `.hue-*` utility classes that override those values.

Atmosphere resets at surface boundaries, just as lightness context does, but it flows to text and border utilities within a surface. A `.hue-brand` class on a card tints that card's text and borders, but it does not cascade to child surfaces.

Key colors in the config generate both primitive variables, such as `--axm-key-brand-hue` and `--axm-key-brand-chroma`, and utility classes such as `.hue-brand`. The taper in §5 ensures that atmosphere degrades gracefully at lightness extremes.

## 10. CSS architecture

The CSS architecture uses three orthogonal operators to produce any color:

| Operator | CSS class | Modifies | Preserves |
|----------|-----------|----------|-----------|
| Surface  | `.surface-*` | Lightness context (background, text values, borders, atmosphere) | — (resets) |
| Mood     | `.hue-*`     | Atmosphere (hue, chroma) | Lightness |
| Voice    | `.text-*`    | Contrast intent (grade) | Atmosphere |

Because Mood and Voice modify disjoint components, they compose without N×M combinatorial explosion.

The inheritance model works as follows:

- Surface classes write local tokens for background, text values, border values, and atmosphere.
- Text and border utilities consume the nearest ancestor surface tokens.
- A child surface class resets the context rather than composing additively with its parent.
- Hue utilities override atmosphere without touching lightness.

`light-dark()` integrates as follows:

- Each surface class writes `light-dark(oklch(...), oklch(...))` for every token.
- A mode switch changes `color-scheme` on `:root`.
- Animation uses CSS `transition` on the properties that change.

The system registers the following properties:

- `--axm-atm-hue` and `--axm-atm-chroma` are inheriting properties with an initial value of 0.
- Key color primitives use `--axm-key-{name}-hue` and `--axm-key-{name}-chroma`.
- Surface-local variables remain class-scoped and are not registered.

## 11. Runtime: `ThemeBuilder`

The generated CSS handles mode switching through `light-dark()` and `color-scheme`. Polarity inversion on mode toggle requires JavaScript.

When the root is light, inverted surfaces such as spotlight have `color-scheme: dark` in the generated CSS. When the user toggles to dark mode, spotlight needs `color-scheme: light`. The CSS generator cannot express "opposite of root" in static CSS.

`createThemeBuilder()` handles this case:

- It watches the root element for `style` and `class` attribute changes, which covers both inline `color-scheme` changes and class-based toggles such as VitePress's `.dark`.
- On change, it queries all inverted-selector elements and flips their `color-scheme`.
- It handles nesting depth so that even depth flips from the root and odd depth matches the root.
- It returns a `destroy()` function for cleanup.

The implementation is framework-agnostic. Vue integration uses a `useThemeBuilder(rootRef)` composable that watches a template ref and manages the lifecycle.

## 12. Runtime: constructible stylesheets

Shadow DOM components, including token pills in the docs and possible consumer components, need the system CSS inside their shadow roots. Injecting a `<style>` element into each shadow root duplicates parsing work.

`getSystemStyleSheet()` returns a singleton `Promise<CSSStyleSheet>`:

- It lazily solves the default config and generates CSS with `:host` as the selector.
- It creates one `CSSStyleSheet` through `new CSSStyleSheet()` and `replaceSync()`.
- All shadow roots adopt the same sheet instance through `adoptedStyleSheets`.

This approach targets Baseline 2023, including Chrome 73+, Firefox 101+, and Safari 16.4+.

Per-component styles, such as host layout and icon sizing, use separate small `CSSStyleSheet` instances that are also shared across instances of the same component type.

## 13. Runtime: custom elements

The package exports web components for UI primitives used by both the docs site and standalone consumers.

`<color-slider>` is a styled range input with an `oklch` gradient track and a colored thumb. It is registered via `registerColorSlider()`. It accepts the attributes `type`, `value`, `hue`, `chroma`, `min`, `max`, and `step`, where `type` selects hue or chroma mode. It uses shadow DOM with a shared `CSSStyleSheet`, and it fires a `CustomEvent` whose `detail.value` carries the current input value.

The custom elements work in Vue templates and in vanilla HTML. Vue must configure `isCustomElement` in the template compiler so that it does not treat these tags as unknown Vue components.