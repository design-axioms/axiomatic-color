---
layout: home
hero:
  name: Axiomatic Color
  text: A Physics Engine for Design
  tagline: Guarantees contrast correctness for text, borders, and interactive elements on semantic surfaces, using APCA as the contrast metric.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/
    - theme: alt
      text: Architecture
      link: /architecture
features:
  - title: Contrast Guarantees
    details: Every text grade and border tier is solved against APCA targets with hue-aware safety margins. The system tells you when targets can't be met.
  - title: light-dark() Native
    details: Mode switching is pure CSS — light-dark() wraps complete oklch() colors. One line of JS flips color-scheme; transitions handle animation.
  - title: Semantic Surfaces
    details: A card is always a card, regardless of DOM nesting. Surface lightness is name-determined, not position-determined.
  - title: Safe Bicone Taper
    details: Chroma fades near lightness extremes via calc(C × (1 - |2L - 1|)), preventing out-of-gamut colors at the CSS level.
---
