---
"@delacour/react-native-ui": minor
"delacour": minor
---

Add `SelectionMode` — pick several things at once, then act on them from a bar. A long press enters the mode with the pressed item picked; taps then toggle. `SelectionMode.Item` wraps any row, avatar or swatch with a round `leading` mark, a `ring` or nothing; `.Header` counts the picks and offers select-all and the way out; `.Bar` and `.Action` act on the selection; `.Group` lays items out as a stacked card, a grid or a horizontal strip. Selection is a set of ids, controllable alongside the mode, with an optional `max`.

`delacour add selection-mode` copies it into a project.
