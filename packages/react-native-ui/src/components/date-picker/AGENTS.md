# DatePicker

A field-shaped trigger that shows a date, a range or several dates, and opens a bottom sheet
holding a `Calendar` to change them. Compound root plus `DatePicker.Trigger`, `DatePicker.Value`,
`DatePicker.Icon`, `DatePicker.Content`, `DatePicker.Calendar`, `DatePicker.Done` and
`DatePicker.Clear`, and `useDatePicker()` for a custom part.

`import { DatePicker } from "@delacour/react-native-ui/date-picker";`

The subpath imports `BottomSheet`, so an app using it installs the optional
`@delacour/react-native-bottom-sheet` peer and mounts `BottomSheetProvider` once — including for
`presentation="inline"`, which never opens a sheet. That is the category's decision 5
(`docs/plans/forms/README.md`), the way `chart` requires the charts engine.

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/date-picker` |
| `date-picker.tsx` | Root: value and open state, the range draft, the finish rule, the `Field` press, the context value, the `Object.assign` surface |
| `date-picker-trigger.tsx` | `DatePicker.Trigger` — a `Pressable` wearing the `Input` box; `Value` + `Icon` by default |
| `date-picker-value.tsx` | `DatePicker.Value` — the formatted selection or the placeholder; a half range ends on a muted "End" |
| `date-picker-icon.tsx` | `DatePicker.Icon` — `IconCalendar1`, muted or destructive |
| `date-picker-content.tsx` | `DatePicker.Content` — the sheet (scrim, close, title, calendar, footer), or the calendar in place when inline |
| `date-picker-calendar.tsx` | `DatePicker.Calendar` — `Calendar` bound to the picker, every tap routed through `select` |
| `date-picker-done.tsx` | `DatePicker.Done` — closes |
| `date-picker-clear.tsx` | `DatePicker.Clear` — empties, reports, stays open |
| `date-picker.context.tsx` | `DatePickerProvider`, `useDatePicker()`, `useDatePickerContext()`, `useDatePickerPart()` |
| `date-picker.types.ts` | `DatePickerSelectionProps` (the mode union) and `DatePickerProps` |
| `date-picker.variants.ts` | Slotted `tv()`, the trigger class, message defaults, and every pure rule: close, format, a11y value, placeholder, axes |
| `date-picker.variants.test.ts` | |

## Imports, never duplicates

- **Every date is `calendar.date`'s.** `formatSelection` calls `formatDate` and
  `formatDateRange`; nothing here does date maths or builds an `Intl.DateTimeFormat`. The state
  is `CalendarSelectionState`, the calendar's own union, so the value and the calendar can never
  disagree about a shape.
- **The calendar is `Calendar`, from `../calendar`.** `DatePicker.Calendar` renders it with the
  picker's props and swaps its `onSelect` for the finish rule; it re-implements no tap logic.
  Backwards ranges and ranges over a disabled day are `applyRangeTap`'s business, so the picker
  never sees an invalid range.
- **The trigger box is `inputVariants().root()`.** `resolveDatePickerTriggerClass` reads it and
  adds the row; the test sweeps every size, variant, focus, invalid and disabled combination and
  asserts the trigger's class is a superset. A picker beside an `Input` is the same box by
  construction, invalid outranking focus included.

## The finish rule

- **The sheet closes when the selection is finished, not when it changes.**
  `resolveShouldClose`: a single day → yes, `null` → no; a range → only with both ends; multiple →
  never, Done closes it. Closing waits `DATE_PICKER_CLOSE_DELAY` (120 ms) so the filled circle is
  seen; under calm motion it does not wait, because the pause is there for the eye and reads as
  lag otherwise.
- **A half-picked range is never reported.** The first tap is held in `rangeDraft` inside the
  root; `onValueChange` fires once the range is complete, and on Clear. Dismissing the sheet —
  swipe, scrim, close, Done — drops the draft, so the last complete range stands. A caller who
  reads the value on every change would otherwise have to handle `{ start, end: null }` everywhere
  they use it.
- **While open, the trigger shows the draft.** "12 Oct 2026 –" with a muted "End" behind the
  sheet says what the next tap does.
- **Clear empties and stays open.** `null`, `{ start: null, end: null }` or `[]`, reported. A
  clear that also closed would make "pick a different range" two openings.
- **Auto-close plays `impactLight`** through `pressable`'s `playHaptic` — the calendar already
  ticked on the tap — and announces "Selected …" with the long date.

## Trigger

- **Open is focus.** `resolveTriggerState` maps `isOpen` onto the box's `isFocused`, so the ring
  shows while the sheet is up. A disabled trigger is never focused.
- **Disabled and read-only never open**, from the trigger, a `Field.Label` tap or `open()`. Read-only
  shows the value at full strength; disabled fades it.
- **`Field` cascade, nearest wins.** `isInvalid ?? field.isInvalid`, `isDisabled ??
  field.isDisabled` — `??`, so `isInvalid={false}` opts out. The accessible name is
  `accessibilityLabel ?? field.label ?? "Date"`, and the root registers `open` with the field's
  `registerPress`, so tapping the label opens the sheet. Inline registers nothing.
- **The value a screen reader hears is not the text on screen.** `accessibilityValue` is the long
  form with "to" between range ends — VoiceOver reads an en dash as nothing or as "minus" — and
  "not set" rather than silence; a half range is "From 5 October 2026, no end chosen".
- **The trigger text is derived, never stored.** `formatSelection` runs on every render from the
  shown selection; `format` replaces the day formatter (single, each of several, each range end),
  `formatRange` replaces the whole range. Multiple lists two days, then counts — a list of seven
  dates does not fit a field.

## Messages

`messages` supplies optional text for the picker and its nested calendar. Missing entries keep the
English defaults. String values may be empty; `undefined` keeps the default. Sentence formatters
receive complete values so a translation can use its own word order.

The picker message keys are `accessibilityLabel`, `triggerHint`, `placeholderSingle`,
`placeholderRange`, `placeholderMultiple`, `rangeEnd`, `title`, `done`, `clear`, `close`, and
`notSet`. The formatter keys are `fromDateNoEnd(date)`, `rangeValue(start, end)`,
`multipleValues(dates)`, `multipleCount(count)`, and `selected(value)`. The nested `calendar` key
takes `CalendarMessages` for day hints, paging labels, and caption actions.

An explicit `placeholder`, `title`, `doneLabel`, `clearLabel`, or root `accessibilityLabel` prop
wins over its message. An enclosing `Field.Label` comes after the explicit accessibility label and
before `messages.accessibilityLabel`. `DatePicker.Content title` wins over the root title.
`DatePicker.Trigger accessibilityHint` wins over `messages.triggerHint`.

- **Parts derive their `testID` from the root's**, through the calendar's `resolvePartTestID`:
  `testID="stay"` names the trigger `stay-trigger`, the calendar `stay-calendar` (so a day is
  `stay-calendar-day-2026-10-12`), and the sheet's `stay-title`, `stay-close`, `stay-clear` and
  `stay-done`. The default anatomy renders every one of those parts without the caller writing
  them, and a recorded flow still has to reach a particular day. No root `testID`, no part ids.

## Sheet

- **`DatePicker.Content` is a whole `BottomSheet`**: portal, overlay, container, close, title,
  calendar bare on the sheet's surface, and a footer. Single gets a footer only when
  `isClearable`; range and multiple always do, because Done is how multiple ends and how a range is
  abandoned. `isClearable` defaults on for range and multiple, off for single.
- **The calendar keeps its own size.** `calendarSize` (default `md`) is independent of the trigger's
  `size`: a `sm` field must not shrink day targets below 44pt.
- **`presentation` is a union, not a boolean**, so an anchored `"popover"` can join it once the
  Overlays category ships one, without a breaking change. Today: `sheet` (default) and `inline`,
  which draws the calendar on a card in place and renders no trigger. There is no popover import
  here and must not be until that merges.

## Open questions

- A half-picked range is discarded on dismiss. If product wants it kept, commit it from
  `handleSheetOpenChange(false)` instead of dropping it — the rule is one line in the root.
- `DatePicker.Trigger` is this component's own. `date-time-picker` imports this folder's variants
  and context leaves for its trigger; folding the pickers' triggers into one shared leaf is a
  follow-up, not a blocker.
