# Forms and input — design specs

Sixteen controls that collect a value: a date, a time, a colour, a signature, a list of tags, a
code from a text message. One spec per component in this folder; each is written so an agent can
build the component from it alone, alongside `AGENTS.md` and `packages/react-native-ui/AGENTS.md`.

| Component | Spec | Wave | Depends on (in this category) | Reuses |
| --- | --- | --- | --- | --- |
| Calendar | [calendar.md](calendar.md) | 1 | — | Pressable, Text, Icon, Button |
| TimePicker | [time-picker.md](time-picker.md) | 1 | — | BottomSheet, Input, Field, Pressable |
| Select | [select.md](select.md) | 1 | — | BottomSheet, Input, Field, ListGroup, Item, Checkbox |
| NumberInput | [number-input.md](number-input.md) | 1 | — | Input.Group, Button, Field |
| OtpInput | [otp-input.md](otp-input.md) | 1 | — | Input tokens, Field |
| SearchBar | [search-bar.md](search-bar.md) | 1 | — | Input.Group, Button, Icon |
| TagInput | [tag-input.md](tag-input.md) | 1 | — | Chip, Input, Field |
| Signature | [signature.md](signature.md) | 1 | — | react-native-svg, Gesture Handler, Button, Field |
| ColorPicker | [color-picker.md](color-picker.md) | 1 | — | Slider patterns, Input, BottomSheet, react-native-svg |
| InputGroup | [input-group.md](input-group.md) | 1 | — | extends the existing `Input.Group` in `input/` |
| MarkdownEditor | [markdown-editor.md](markdown-editor.md) | 1 | — | Textarea, Tabs, Button, Text |
| Questionnaire | [questionnaire.md](questionnaire.md) | 1 | — | Radio, Checkbox, Rating, Textarea, Steps, Progress |
| ThemeSelector | [theme-selector.md](theme-selector.md) | 1 | — | ToggleButton group, Uniwind theme API |
| DatePicker | [date-picker.md](date-picker.md) | 2 | Calendar | BottomSheet, Input, Field |
| Combobox | [combobox.md](combobox.md) | 2 | Select | BottomSheet, Input |
| DateTimePicker | [date-time-picker.md](date-time-picker.md) | 2 | Calendar, TimePicker, DatePicker | BottomSheet, Tabs |

## Build order

**Wave 1** — thirteen components with no dependency inside the category. Each is built in its own
child workspace branched from `feature/cat-forms`, in parallel.

**Wave 2** — three components that import a Wave 1 component's leaf modules
(`calendar/calendar.date.ts`, `time-picker/time-picker.time.ts`, `select/select.variants.ts`).
Their child workspaces are created only after those dependencies are merged into
`feature/cat-forms`, so each branches from a tree that already holds what it imports. A Wave 2
child never imports from an unmerged sibling branch.

## Category-wide decisions

1. **Pickers present in `BottomSheet`.** There is no popover in the library yet — that belongs to
   the Overlays category, which is unmerged and is never imported from here. Select, Combobox,
   DatePicker, TimePicker, DateTimePicker and ColorPicker open a sheet, which is also the
   idiomatic mobile surface for a choice. The sheet engine is an optional peer, so a consumer that
   uses any of them mounts `BottomSheetProvider` once. Each picker's `presentation` prop is a
   union that can grow an anchored `"popover"` member when one exists.
2. **No new dependencies.** Dates are a plain `CalendarDate` (`{ year, month, day }`, no time
   zone) with pure helpers in `calendar/calendar.date.ts`; times are `TimeValue` in
   `time-picker/time-picker.time.ts`; formatting is `Intl`. Colour maths, stroke smoothing and the
   Markdown subset parser are pure modules in their components' folders. Drawing uses
   `react-native-svg`, already a peer.
3. **Everything joins `Field`.** A control inside `<Field isInvalid isDisabled>` takes those states
   with nothing said at the call site, reads `Field.Label`'s text as its accessibility label, and
   registers a press where a row tap should reach it.
4. **Composing another component imports its index.** `import { Chip } from "../chip"` and
   `import { Button } from "../button"` are the house norm (`../text`, `../pressable`, `../icon`
   are imported that way across the package). Reach for a leaf (`../x/x.variants`,
   `../x/x.context`) only for a variants/context value or where an index import would close a
   cycle — package AGENTS.md rule 3. Wave 2 components import a Wave 1 sibling the same way.
5. **A picker's subpath requires the sheet engine, the way `chart` requires the charts engine.**
   `@delacour/react-native-ui/time-picker` statically imports `BottomSheet`, so an app importing
   it must install `@delacour/react-native-bottom-sheet` — including for the inline wheel. That
   is accepted rather than split into a second subpath; the optional peer stays optional for every
   app that imports no picker. Each picker's docs page says so under Installation.
6. **Each picker owns a thin trigger on the `inputVariants` leaf.** No shared `picker-trigger`
   module in Wave 1 — five parallel branches would collide on it. Wave 2 pickers may reuse a
   Wave 1 trigger once merged; consolidating them is a follow-up, not a blocker.
7. **Sizes and variants follow `Input`.** `sm | md | lg` on the `--spacing-input-*` and
   `--text-input-*` tokens; `primary | secondary` where a control draws a field box.

## Cross-category dependencies

| Needed by | What | Owner | Resolution here |
| --- | --- | --- | --- |
| Select, Combobox, DatePicker, TimePicker, DateTimePicker, ColorPicker | Anchored popover | Overlays | Present in `BottomSheet`; `presentation` union leaves room for `"popover"` |

## Process

Every child follows the conventions in the root `AGENTS.md`: tests first for pure logic, a folder
`AGENTS.md` and a row in the package's Components table, `bun run gen-exports`, playground demos
and `bun run gen-demos`, a docs page under `apps/web/content/docs/native/components/`, a registry
entry in `packages/cli/src/registry/config.ts`, and a changeset. Children commit locally and never
push; the category branch merges each with `--no-ff` and re-runs `bun test`, `bun run typecheck`
and `bun run check`.
