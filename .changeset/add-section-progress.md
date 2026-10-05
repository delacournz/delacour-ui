---
"@delacour/react-native-ui": minor
"delacour": minor
---

Add `SectionProgress` — a floating pill over a long reading screen: a ring filling with scroll progress beside the title of the section being read, opening a card that lists every section.

- Reads `useScrollSections`: `scroll` drives the ring and the reveal, `value` takes `activeId`, `onValueChange` takes `scrollTo`. The ring runs on the UI thread, so scrolling renders nothing; a jump eases over 180ms.
- Six placements against the safe area, an `offset`, and a `revealAt` that latches once crossed. The panel grows out of the pill, scrolls past six rows, and closes on an outside tap, the escape gesture or Android back.
- `SectionProgress.Item` takes a `color` for its marker and for the ring while it is active. `progress` overrides the scroll; `isOpen` / `onOpenChange` control the panel; `haptic` plays on a section change.
- VoiceOver reads "Sections, Pricing, 42 percent"; opening moves focus to the active section. Reduce motion turns the panel's scale into a fade.
- `delacour add section-progress` copies it into a project, with `use-scroll-sections`.
