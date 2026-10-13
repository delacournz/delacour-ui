---
"@delacour/react-native-ui": minor
"delacour": minor
---

Add `Combobox` — a long or remote list behind a field-shaped trigger, filtered as you type in a bottom sheet.

- The sheet opens with its search field focused once it has settled. The default filter matches the label and `keywords` case- and accent-insensitively; `filter={{ kind: "custom", match }}` takes a predicate and `{ kind: "none" }` shows the options as given, for a server. The matched run of each label is bold, through accents.
- Single selection by default, where a pick closes the sheet; `selectionMode="multiple"` keeps it open and shows removable chips on the trigger (folding into `+N`) and above the search field, with a two-step Backspace remove. `value` and `onValueChange` are typed per mode; `maxSelected` disables the rest once reached.
- The query is controlled separately with `inputValue` and `onInputValueChange`, which reports `type`, `select`, `clear` or `close`. A picked option stays on the trigger after a server's results move on. `allowCustomValue` offers the typed text as a value.
- Built from Select's leaves — the same trigger box and option rows — and joins `Field` the same way. `isClearable`, `isReadOnly`, `isLoading`, `Combobox.Empty` and a replaceable `Combobox.Trigger` cover the rest; the result count is announced to screen readers.
- Needs `@delacour/react-native-bottom-sheet` and `BottomSheetProvider`. `delacour add combobox` copies it into a project, along with `select`, `chip` and `bottom-sheet`.
