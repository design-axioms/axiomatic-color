# Text

Four contrast grades, solved per surface per mode to meet [APCA](/reference/apca) targets.

## Preview

<GradePreview />

## How It Works

<Token name=".text-high" /> on Page and <Token name=".text-high" /> on Spotlight both meet their APCA target, but with different solved lightness values. The class is the same; the solver adapts per surface and mode.

If a target can't be fully met, the solver reports the shortfall.

## Usage

<LiveExample
  surface="surface-page"
  :html='`<div class="surface-card" style="padding: 1.25rem; border-radius: 6px;">
  <h1 class="text-high" style="font-size: 1.25rem; font-weight: 700; margin: 0 0 0.5rem;">Account Settings</h1>
  <p class="text-strong" style="font-size: 0.875rem; margin: 0 0 0.25rem;">Manage your profile and preferences.</p>
  <p class="text-subtle" style="font-size: 0.8125rem; margin: 0 0 0.25rem;">Last updated 3 days ago.</p>
  <span class="text-subtlest" style="font-size: 0.75rem;">v2.4.1</span>
</div>`'
  :code='`<div class="surface-card">
  <h1 class="text-high">Account Settings</h1>
  <p class="text-strong">Manage your profile and preferences.</p>
  <p class="text-subtle">Last updated 3 days ago.</p>
  <span class="text-subtlest">v2.4.1</span>
</div>`'
/>

<LiveExample
  surface="surface-spotlight"
  :html='`<div style="padding: 1.25rem;">
  <h1 class="text-high" style="font-size: 1.25rem; font-weight: 700; margin: 0 0 0.5rem;">Deployment Status</h1>
  <p class="text-strong" style="font-size: 0.875rem; margin: 0 0 0.25rem;">Production is healthy across all regions.</p>
  <p class="text-subtle" style="font-size: 0.8125rem; margin: 0 0 0.25rem;">Next scheduled check in 12 minutes.</p>
  <span class="text-subtlest" style="font-size: 0.75rem;">Build #4091</span>
</div>`'
  :code='`<div class="surface-spotlight">
  <h1 class="text-high">Deployment Status</h1>
  <p class="text-strong">Production is healthy across all regions.</p>
  <p class="text-subtle">Next scheduled check in 12 minutes.</p>
  <span class="text-subtlest">Build #4091</span>
</div>`'
/>

The same classes work on every surface.
