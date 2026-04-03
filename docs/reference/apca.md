# APCA Contrast

APCA (Accessible Perceptual Contrast Algorithm) is the contrast metric used throughout Axiomatic Color. It replaces the older WCAG 2.x contrast ratio with a perceptually uniform model that accounts for how humans actually perceive lightness differences.

## Why APCA?

WCAG 2.x contrast ratios treat light-on-dark and dark-on-light as equivalent. They aren't — human vision is asymmetric. APCA models this correctly:

- **Dark text on a light surface** requires less contrast for readability than light text on dark
- **Small text** needs more contrast than large text
- **Spatial frequency** (font weight, size) affects perceived contrast

The result: APCA produces contrast values (Lc) that correlate with actual reading comfort, not just mathematical ratios.

## Reading the Lc value

APCA contrast is measured in **Lc** (Lightness Contrast) units. Higher values mean more contrast:

| Lc Value | Meaning | Typical Use |
| -------- | ------- | ----------- |
| 90+ | Very high contrast | Body text, sustained reading |
| 75–90 | High contrast | Secondary text, labels |
| 60–75 | Moderate contrast | Tertiary text, metadata |
| 45–60 | Low contrast | Decorative text, placeholders |
| 30–45 | Minimal contrast | Interactive boundaries |
| 15–30 | Subtle | Decorative borders |
| < 15 | Near-invisible | Atmosphere effects |

## How Axiomatic Color uses APCA

The color system solves APCA targets for every text grade and border tier:

| Element | APCA Target |
| ------- | ----------- |
| Text — High | 100 |
| Text — Strong | 95 |
| Text — Subtle | 90 |
| Text — Subtlest | 75 |
| Border — Decorative | 10 |
| Border — Interactive | 30 |
| Border — Critical | 80 |

When you see an <ApcaBadge :value="95" :target="95" /> badge in the documentation, it means the system verified that contrast target is met. The badge links here for context.

## Safety margins

Chroma (color saturation) and hue affect perceived contrast. The solver adds hue-dependent safety margins before validating, so APCA targets are met at worst-case hue:

| Chroma | Safety Margin |
| ------ | ------------- |
| 0.05 | +2 Lc |
| 0.10 | +3 Lc |
| 0.15 | +4 Lc |
| 0.20 | +5 Lc |
