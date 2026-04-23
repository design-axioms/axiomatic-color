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

- It looks up each surface's lightness from the declared scale at the surface's position.
- It pre-solves text lightness for all grades on all surfaces in both modes.
- It pre-solves border lightness for all tiers on all surfaces in both modes.
- It computes hue-aware safety margins.
- It classifies composition relationships as guarantees or enhancements.
- It reports diagnostics for unmet targets.

The solver does not compute intermediate mode states, because `light-dark()` removes that requirement. It also does not track DOM nesting depth or parent-relative composition.

When a target cannot be met — for example, "high" grade text (Lc 100) on a mid-tone surface — the solver does not silently compromise. It solves for the best achievable contrast, reports the unmet target, and includes the actual ceiling in its diagnostics. This "noisy no" supports informed tradeoffs about scale design, surface positions, and contrast targets.

## 3. Text derivation

`light-dark()` accepts only `<color>` values, so each mode branch must emit a complete `oklch()` color with a pre-solved lightness value. The solver is the single source of truth for those lightness values.

The system reserves the dead zone at L ≈ 0.46–0.82. Surfaces should not be placed in that range because neither polarity can produce adequate text contrast there.

## 4. Chroma and hue effects

At C = 0.30, APCA shifts by at most ~0.6 points, so chroma does not materially change contrast validation. At L = 0.9 and C = 0.15, hue can shift APCA by ~5.4 points. The worst-case hues are magenta and red near 330°.

The solver applies the following safety margins before validation so that targets hold at the worst-case hue:

| Chroma | Safety Margin |
| ------ | ------------- |
| 0.05   | 2 APCA pts    |
| 0.10   | 3 APCA pts    |
| 0.15   | 4 APCA pts    |
| 0.20   | 5 APCA pts    |

## 5. Safe bicone taper

Chroma fades near lightness extremes via a single `calc()` expression:

$$C_{\text{effective}} = C \times (1 - |2L - 1|)$$

At L = 0.5, the taper preserves full chroma. At L = 0 or L = 1, it reduces chroma to zero. This prevents out-of-gamut colors at the CSS level. The `min(C, ...)` wrapper from the spec is algebraically redundant because the taper factor is always in $[0, 1]$.

## 6. Surface composition: three-tier contract

### Tier 1: Guarantees

- Text on any surface either meets its APCA target grade or surfaces a diagnostic ("noisy no") naming the grade that couldn't be reached.
- Cross-polarity surface pairs remain visually distinct with an 80+ APCA gap.
- Same-polarity surfaces are perceptibly distinguishable. When lightness stagger alone reaches APCA Lc 45 (the non-text discernibility threshold), the system uses it; otherwise the system emits a distinction mechanism (default: an inset 1px border sourced from `--axm-border-decorative`). Atmosphere (`targetChroma > 0`) does not rescue the rule: per §9 atmosphere is orthogonal to lightness, and per §5 chroma tapers at extremes, so a colored surface at high lightness delivers too little actual chroma to carry a lightness-space distinction. Atmosphere is a secondary signal layered on top of the lightness-derived distinction.
- Atmosphere is correct and inheritable.

### Tier 2: Enhancements

- Hover and active states can use lightness shifts.
- Lightness stagger between surfaces, when it exists above the tier-1 threshold, carries real perceptual weight beyond distinguishability.

### Tier 3: Out of scope

- Multi-signal visual hierarchy (elevation, shadows, spacing) remains outside the color system.
- Consumers that want a different distinction mechanism (actual border, outline, shadow, etc.) can configure `distinction.mechanism` or override per-surface.

## 7. Surface identity: semantic, not positional

A surface's lightness is fixed by its semantic name and the current mode and polarity. It does not change based on DOM nesting depth or parent surface.

- `card` always resolves to the same lightness, whether it appears inside `page` or `workspace`.
- The solver has no depth parameter, so it solves each surface once per mode and polarity.
- CSS resets local tokens per <Token name=".surface-*" /> class, and descendants inherit the nearest surface context.

## 8. Polarity: two independent scales

Page-polarity and inverted-polarity surfaces live on independent lightness scales. A polarity flip is a context reset, not a nesting level.

- Each polarity declares its own scale — an array of lightness values per mode.
- Surfaces pick a position; the solver looks up the lightness and pre-solves text and border contrast against it.
- An inverted surface inside a page surface is solved independently on its own scale. Scales can have different lengths and spacing.

## 9. Atmosphere: orthogonal to lightness

The system composes along two orthogonal axes.

- Lightness composition has a finite budget, uses a semantic ladder, and yields at most ~2 distinguishable levels per polarity per mode.
- Atmosphere composition applies hue and chroma tinting and does not consume the lightness budget.

Surfaces are achromatic by default. The atmosphere properties `--axm-hue` and `--axm-chroma` are registered as inheriting with an initial value of 0, so they cascade through the DOM until a <Token name=".hue-*" /> utility sets them. Surface classes do not emit atmosphere values — they inherit from their ancestor.

Atmosphere flows through surface boundaries to text and border utilities. A <Token name=".hue-brand" /> class on a card tints that card and everything inside it, including child surfaces, unless a descendant sets its own atmosphere.

Key colors in the config generate both primitive variables, such as `--axm-key-brand-hue` and `--axm-key-brand-chroma`, and utility classes such as <Token name=".hue-brand" />. The taper in §5 ensures that atmosphere degrades gracefully at lightness extremes.

## 10. CSS architecture

The CSS architecture uses three orthogonal operators to produce any color:

| Operator            | CSS class    | Modifies                                                         | Preserves  |
| ------------------- | ------------ | ---------------------------------------------------------------- | ---------- |
| Surface             | `.surface-*` | Lightness context (background, text values, borders, atmosphere) | — (resets) |
| Mood (atmosphere)   | `.hue-*`     | Atmosphere (hue, chroma)                                         | Lightness  |
| Voice (text grades) | `.text-*`    | Contrast intent (grade)                                          | Atmosphere |

The operator names describe the architectural role: Surface sets context, Mood tints it, Voice reads from it. The consumer-facing names (atmosphere, text grades) appear in the class APIs and documentation. Both refer to the same mechanism.

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

- `--axm-hue` and `--axm-chroma` are inheriting properties with an initial value of 0.
- Key color primitives use `--axm-key-{name}-hue` and `--axm-key-{name}-chroma`.
- Surface-local variables remain class-scoped and are not registered.

## 11. Accessibility: derived from role and polarity scale

Forced colors and high-contrast support are derived from the semantic vocabulary the system already carries. Two additions earn both regimes:

- A single `role` field on each surface (`surface`, `interactive`, `alert`, or `link`, defaulting to `surface`) drives forced-colors mapping.
- An optional `highContrast` scale on each `PolarityScale` drives `prefers-contrast: more | custom`.

Consumers don't re-author surfaces for accessibility; existing configurations remain correct.

### Forced colors

The generator emits a `@media (forced-colors: active)` block that remaps each `.surface-*` class to a CSS system color keyword based on role. `surface` uses `Canvas` and `CanvasText`; `interactive` uses `ButtonFace`, `ButtonText`, and `ButtonBorder`; `alert` uses `Canvas` and `CanvasText` with a `Mark` / `MarkText` override that browsers with `Mark` support apply via cascade; `link` uses `LinkText`.

`.text-link` maps to `LinkText` and `.text-disabled` maps to `GrayText` across every role.

The overridden tokens are the same ones the default mode writes — `--axm-surface`, `--axm-text-*`, `--axm-border-*` — so existing utilities keep working without changes.

### High contrast

When a polarity declares a `highContrast` scale, the solver produces a parallel solution against it with tighter default targets (`high: 100, strong: 100, subtle: 95, subtlest: 90`). The generator emits these under `@media (prefers-contrast: more), (prefers-contrast: custom)`.

Two emission rules keep the cascade correct:

- The HC block precedes the forced-colors block. Forced-colors users may match `prefers-contrast: custom`; emitting forced-colors last ensures system colors win.
- The inverted-polarity branch swap (§1) is replicated inside the HC block. Without it, inverted HC values land in the wrong `light-dark()` branch.

Inverted-polarity surfaces do not require an HC scale — they already sit at the edge of what the architecture allows (§8). In the default config, only `page` has an HC scale; inverted surfaces retain their base lightness under HC, which increases their visual contrast against the pushed `page` surfaces.

### Configurable targets

The library caps `high` at 100 (the APCA practical ceiling). Users with AAA-style requirements override via `config.accessibility.textGrades` and `config.accessibility.borderTargets`.

## 12. Runtime: `ThemeBuilder`

The generated CSS handles mode switching through `light-dark()` and `color-scheme`. Polarity inversion on mode toggle requires JavaScript.

When the root is light, inverted surfaces such as spotlight have `color-scheme: dark` in the generated CSS. When the user toggles to dark mode, spotlight needs `color-scheme: light`. The CSS generator cannot express "opposite of root" in static CSS.

`createThemeBuilder()` handles this case:

- It watches the root element for `style` and `class` attribute changes, which covers both inline `color-scheme` changes and class-based toggles such as VitePress's `.dark`.
- On change, it queries all inverted-selector elements and flips their `color-scheme`.
- It handles nesting depth so that even depth flips from the root and odd depth matches the root.
- It returns a `destroy()` function for cleanup.

The implementation is framework-agnostic. Vue integration uses a `useThemeBuilder(rootRef)` composable that watches a template ref and manages the lifecycle.

## 13. Runtime: constructible stylesheets

Shadow DOM components, including token pills in the docs and possible consumer components, need the system CSS inside their shadow roots. Injecting a `<style>` element into each shadow root duplicates parsing work.

`getSystemStyleSheet()` returns a singleton `Promise<CSSStyleSheet>`:

- It lazily solves the default config and generates CSS with `:host` as the selector.
- It creates one `CSSStyleSheet` through `new CSSStyleSheet()` and `replaceSync()`.
- All shadow roots adopt the same sheet instance through `adoptedStyleSheets`.

This approach targets Baseline 2023, including Chrome 73+, Firefox 101+, and Safari 16.4+.

Per-component styles, such as host layout and icon sizing, use separate small `CSSStyleSheet` instances that are also shared across instances of the same component type.

## 14. Runtime: custom elements

The package exports web components for UI primitives used by both the docs site and standalone consumers.

`<color-slider>` is a styled range input with an `oklch` gradient track and a colored thumb. It is registered via `registerColorSlider()`. It accepts the attributes `type`, `value`, `hue`, `chroma`, `min`, `max`, and `step`, where `type` selects hue or chroma mode. It uses shadow DOM with a shared `CSSStyleSheet`, and it fires a `CustomEvent` whose `detail.value` carries the current input value.

The custom elements work in Vue templates and in vanilla HTML. Vue must configure `isCustomElement` in the template compiler so that it does not treat these tags as unknown Vue components.
