# Borders

Three contrast tiers.

<BorderPreview />

## Usage

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

Border colors resolve per surface, so the same class produces correct contrast whether the surface is light or dark.
