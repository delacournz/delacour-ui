---
"@delacour/react-native-ui": minor
"delacour": minor
---

Add `Select` — a closed set of choices behind a field-shaped trigger, picked from a bottom sheet.

- Single selection by default, where a pick closes the sheet; `selectionMode="multiple"` keeps it open, draws a box on each row and closes from a Done footer. `value` and `onValueChange` are typed per mode — a string or `null`, or an array — and `maxSelected` disables the remaining rows once reached.
- Options come as data through `options`, or as `Select.Item` and `Select.Group` children, and both are drawn from one normalised, virtualised list. `isSearchable` adds a search field that matches case- and accent-insensitively, hides groups it empties and clears on close.
- The trigger is `Input`'s own box at every variant and size. Inside a `Field` the select takes its invalid and disabled state, reads `Field.Label` as its accessible name and sheet title, and opens when the label is tapped. `isReadOnly`, `isLoading`, `renderValue` and a replaceable `Select.Trigger` cover the rest.
- Rows are radios in single mode and checkboxes in multiple to a screen reader; group headings are headers. `SelectOptionRow` is exported as the leaf a later picker reuses.
- Needs `@delacour/react-native-bottom-sheet` and `BottomSheetProvider`. `delacour add select` copies it into a project, along with `bottom-sheet`.
