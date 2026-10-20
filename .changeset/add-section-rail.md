---
"@delacour/react-native-ui": minor
"delacour": minor
---

Add `SectionRail` — a thin rail of bars along a screen edge, one per section of a long screen, that opens into a labelled outline.

- `SectionRail.Trigger` holds one `SectionRail.Bar` per section and `SectionRail.Content` one `SectionRail.Item` per row; `level` shortens a bar and indents its row by the same step. The active bar's colour eases in, and the active row is drawn in the foreground.
- Tap the rail to open the outline, or scrub: drag along it and the row under the finger highlights — mapped on the UI thread, with an optional `haptic` tick per section crossed — and releasing jumps there. A pick lingers for `closeDelay` before closing; an outside tap or Android's back closes it.
- `placement` (`end`, `start`) and `align` (`center`, `bottom`) are logical and mirror in right-to-left; the rail clears the safe area by `offset`. It fills its container and passes every other touch through, so the content under it keeps scrolling.
- Pairs with `useScrollSections`: `value={sections.activeId}` and `onValueChange={sections.scrollTo}`. `value={undefined}` stays controlled, so a hook's empty first value does not flip modes.
- One `adjustable` element to VoiceOver, named "Sections" and valued by the active title; swiping steps through the sections and focus lands on the active row when the outline opens.
- `delacour add section-rail` copies it into a project, along with `use-scroll-sections`. The registry builder now reads a `registryDependencies` list from `ITEM_META` for edges no import records.
