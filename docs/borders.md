# Borders

Borders carry three distinct perceptual jobs—separating adjacent regions, framing interactive controls, and calling out critical boundaries. Axiomatic Color solves three border tiers per surface against [APCA](/reference/apca) targets so borders stay legible across light mode, dark mode, and inverted polarities without hand-tuning.

| Tier        | Class                                | APCA Target | Typical Use                                                  |
| ----------- | ------------------------------------ | ----------- | ------------------------------------------------------------ |
| Decorative  | <Token name=".border-decorative" />  | 10 Lc       | Container outlines, section dividers, subtle cards           |
| Interactive | <Token name=".border-interactive" /> | 30 Lc       | Buttons, inputs, focusable or clickable controls             |
| Critical    | <Token name=".border-critical" />    | 80 Lc       | Validation errors, required fields, high-emphasis boundaries |

<BorderPreview />

## Usage

Border utilities set `border-color` from the nearest ancestor surface's solved tokens—leaving `border-width` and `border-style` to your component styles:

<LiveExample
surface="surface-page"
:html='`<div style="display: flex; flex-direction: column; gap: 0.75rem;">

  <div class="surface-card border-decorative" style="padding: 1rem; border-radius: 6px; border-width: 1px; border-style: solid;">
    <p class="text-strong" style="margin: 0; font-size: 0.875rem;">Decorative border</p>
  </div>
  <button class="surface-action hue-accent border-interactive text-high" style="padding: 0.5rem 1rem; border-radius: 6px; border-width: 1px; border-style: solid; cursor: pointer; font-size: 0.875rem; font-weight: 500;">Submit</button>
  <div class="surface-card border-critical" style="padding: 1rem; border-radius: 6px; border-width: 1px; border-style: solid;">
    <p class="text-high" style="margin: 0; font-size: 0.875rem;">Required field</p>
  </div>
</div>`'
  :code='`<div class="surface-card border-decorative">
  <p class="text-strong">Decorative border</p>
</div>

<button class="surface-action hue-accent border-interactive text-high">
  Submit
</button>

<div class="surface-card border-critical">
  <p class="text-high">Required field</p>
</div>`'
/>

<LiveExample
surface="surface-spotlight"
:html='`<div style="display: flex; flex-direction: column; gap: 0.75rem;">

  <div class="border-decorative" style="padding: 1rem; border-radius: 6px; border-width: 1px; border-style: solid;">
    <p class="text-strong" style="margin: 0; font-size: 0.875rem;">Section divider</p>
  </div>
  <button class="surface-page border-interactive text-high" style="padding: 0.5rem 1rem; border-radius: 6px; border-width: 1px; border-style: solid; cursor: pointer; font-size: 0.875rem; font-weight: 500;">Confirm</button>
  <div class="border-critical" style="padding: 1rem; border-radius: 6px; border-width: 1px; border-style: solid;">
    <p class="text-high" style="margin: 0; font-size: 0.875rem;">Validation error</p>
  </div>
</div>`'
  :code='`<div class="border-decorative">
  <p class="text-strong">Section divider</p>
</div>

<button class="surface-page border-interactive text-high">
  Confirm
</button>

<div class="border-critical">
  <p class="text-high">Validation error</p>
</div>`'
/>

Border colors resolve per surface, so the same class produces the right contrast whether the surrounding surface is light, dark, or inverted.

## Automatic Surface Distinction

Borders also back the system's same-polarity distinction guarantee: whenever adjacent same-polarity surfaces (such as a card inside a workspace) sit closer than APCA Lc 45 in lightness, the generator emits an inset 1px edge sourced from `--axm-border-decorative` so the boundary stays perceptible even without an explicit `.border-*` class. See [Composition → Same-Polarity Distinction](/composition#same-polarity-distinction) and [Reference → Accessibility → Surface distinction](/reference/accessibility#surface-distinction).
