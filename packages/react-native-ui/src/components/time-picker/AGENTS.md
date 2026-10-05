# TimePicker

A time of day, picked on snapping wheels — hour, minute, optional second and, on
a 12-hour clock, AM/PM. Presents as an `Input`-shaped trigger that opens a
bottom sheet, or as the bare wheel drawn in place.

`import { TimePicker, TimePickerWheel } from "@delacour/react-native-ui/time-picker";`

The subpath imports `BottomSheet`, so an app importing it installs the optional
`@delacour/react-native-bottom-sheet` engine and mounts `BottomSheetProvider`
once — **including an app that only uses `presentation="inline"`**. That is the
category's decision for every picker, the same trade `chart` makes with the
charts engine; a split `time-picker/wheel` subpath is a follow-up if anyone
asks for it.

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/time-picker`. The compound, `TimePickerWheel`, the context hooks, the time helpers and the variants |
| `time-picker.tsx` | `TimePicker` — value and open state, the field cascade, the resolved locale and clock, the sheet; the `Object.assign` names every part |
| `time-picker-trigger.tsx` | `TimePicker.Trigger` — `Pressable` in `Input`'s box; the button semantics and the press |
| `time-picker-value.tsx` | `TimePicker.Value` — the formatted time or the muted placeholder |
| `time-picker-icon.tsx` | `TimePicker.Icon` — `IconClock`, coloured like an `Input.Group` decorator |
| `time-picker-content.tsx` | `TimePicker.Content` — the `BottomSheet` portal, overlay, container, title, body and pinned footer |
| `time-picker-wheel-slot.tsx` | `TimePicker.Wheel` — `TimePickerWheel` wired to the picker's context |
| `time-picker-wheel.tsx` | `TimePickerWheel` — the bare wheel: columns, separators, the selection band, settle and bounce |
| `time-picker-wheel-column.tsx` | `TimeWheelColumn` (internal) — one snapping `Animated.ScrollView`, its rows, its haptic and its adjustable semantics |
| `time-picker-done.tsx` | `TimePicker.Done` — closes; commits an untouched wheel |
| `time-picker-clear.tsx` | `TimePicker.Clear` — sets `null` and closes |
| `time-picker.context.tsx` | `TimePickerProvider`, `useTimePicker()`, `useTimePickerContext()`, internal `useTimePickerPart()` |
| `time-picker.types.ts` | `TimePickerProps`, `TimePickerWheelProps`, the options both share, `TimePickerFormat` |
| `time-picker.time.ts` | **Shared leaf.** `TimeValue` and every pure time helper — snapping, bounds, 12/24-hour, `Intl` formatting, parse/serialise |
| `time-picker.time.test.ts` | The helpers, including every hour's 12↔24 round trip |
| `time-picker.variants.ts` | The slotted `tv()`, the trigger resolver, the row heights, the scroll-index worklets, the column models |
| `time-picker.variants.test.ts` | Tokens in both themes, rule 1, Input parity, the wheel maths, the column models |

## Anatomy

```tsx
<TimePicker value? defaultValue? onValueChange? minTime? maxTime? minuteStep? showSeconds? hourCycle? locale?
            format? placeholder? presentation? isOpen? defaultOpen? onOpenChange? isDisabled? isReadOnly? isInvalid?
            variant? size? visibleRows? title? doneLabel? clearable? clearLabel? accessibilityLabel?>
  <TimePicker.Trigger>
    <TimePicker.Value placeholder? />
    <TimePicker.Icon icon? />
  </TimePicker.Trigger>
  <TimePicker.Content title? footer?>
    <TimePicker.Wheel />
  </TimePicker.Content>
</TimePicker>

<TimePicker presentation="inline" />          // the wheel alone, wired to the root
<TimePickerWheel value onValueChange … />    // the wheel alone, no root at all
```

With no children the root renders that default anatomy. `useTimePicker()`
returns the root's state for a custom trigger or footer.

## Decisions

- **A stored time is always 24-hour.** `TimeValue` is `{ hour: 0–23, minute, second? }`;
  `hourCycle` and `locale` change the trigger's text and the hour wheel's labels,
  never the value. A 12-hour hour row carries its stored hour as its `value`, so
  the column writes 24-hour data directly and only the period column needs
  `to24Hour`. Storing the display hour would make "12" ambiguous.
- **The 12-hour hour wheel holds the current period only — 12, 1 … 11.** Scrolling
  past 11 does not flip AM to PM; the period column does that. A wheel that
  changed the period under the finger would move a column the user is not
  touching.
- **Commit on settle, not on Done.** `onValueChange` fires each time a column
  comes to rest. Done closes, and only commits when nothing has been — an
  untouched wheel over a `null` value commits the time it shows. Dismissing the
  sheet any other way keeps whatever settled. A `commitOn="done"` mode is a
  follow-up.
- **An unset picker opens on now**, on the step and inside the bounds — not
  midnight, which is the one time nobody is choosing — and stays `null` until a
  column settles or Done is pressed. The root re-reads the clock each time the
  sheet opens.
- **Every settle is normalised before it is reported.** The column reports the
  row it landed on; the wheel builds the proposed time, runs `nearestEnabledTime`
  (on the step, inside the bounds, ties to the earlier time) and commits that.
  Landing on a dimmed row, or changing the hour so the minute falls out of range,
  plays `impactLight` and scrolls the columns to the result. `onValueChange`
  never sees a time the picker would not offer.
- **A column re-checks its resting row after every settle, even when
  `selectedIndex` did not change.** That is the case of a column flung onto a
  dimmed row and pulled back to where it started: the prop is identical, so an
  effect keyed on it alone would leave the column resting on the dimmed row.
  A settle counter is in the dependency list for exactly this.
- **Only a hand-scroll settles.** A flick rests on momentum end; a drag
  released still rests on drag end, because no momentum follows. A programmatic
  scroll also ends in a momentum event on iOS, and `isUserScroll` makes it
  ignored — without that, a controlled value set from outside would echo back
  through `onValueChange`.
- **The selection tick fires on the UI thread**, inside the scroll handler,
  de-duplicated by the centred index and only during a hand-scroll, so it lands
  in the frame a row crosses the line and never plays while the wheel moves
  itself.
- **Fades are per-row opacity and scale, not a gradient.** Each row derives both
  from its distance to the centre line (`resolveWheelRowAppearance`) on the UI
  thread. No gradient peer is touched, and calm motion turns the flourish off in
  one place: scale stays 1 and the opacity steps by whole rows.
- **A column is a plain `Animated.ScrollView`.** Sixty rows is the longest; a
  virtualised list would recycle the very rows whose appearance the handler
  drives, for no saving.
- **The sheet's content pan is off.** Every vertical drag inside the sheet
  belongs to a wheel; with the pan on, the first few points of each scroll would
  move the sheet instead. The handle still drags it.
- **The trigger is `Input`'s box, read from the `root` slot.** Not
  `resolveInputFieldClass`, which adds the field's text classes, because the
  trigger is a view (rule 1). The value names the same `text-input-*` token as
  the field slot. The test sweeps every variant, size and state and asserts the
  trigger contains every class a lone `Input` draws.
- **Focused means open.** The trigger shows `border-ring` while the sheet is up,
  and invalid still outranks it, by `inputVariants`' own compound.
- **Field cascade, nearest wins:** `isInvalid ?? field.isInvalid`,
  `isDisabled ?? field.isDisabled`, `accessibilityLabel ?? field.label ?? "Time"`.
  The root registers its open with `Field.registerPress` through a ref-backed
  trampoline, as `Switch` does, so a tap on the label opens the sheet without
  re-registering on every render. Inline, nothing registers — there is nothing
  to open.
- **Read-only shows the value and refuses the press; disabled also fades.** Both
  leave the trigger a button to assistive technology, with the disabled state on
  the one that is.
- **Each column is one adjustable element.** Labelled "Hour", "Minute",
  "Second", "AM or PM"; valued "3 o'clock", "30 minutes", "PM"; increment and
  decrement step one row and settle exactly as a scroll does. The rows are hidden
  from the tree, and so are the `:` separators.
- **Row heights are numbers, not classes** — 32/40/48 for `sm`/`md`/`lg` —
  because `snapToInterval` and the index maths take points. Visible rows are 3,
  5 or 7, odd so one sits on the centre line.
- **`snapMinute` rounds to the nearest step.** 53 on a 15-minute step is 60,
  which `snapTime` carries into the next hour; at 23:59 it clamps to the last
  step of the day rather than wrapping to midnight.
- **Bounds with the minimum after the maximum are no bounds.** An empty picker
  is worse than an unbounded one, and the mistake is the caller's.
- **`Intl` is trusted for format, hour cycle and AM/PM words, and never allowed
  to throw.** An invalid locale reads as `en-US`, formats as plain `HH:mm`, and
  takes `AM`/`PM`.

## Reuse

`time-picker.time.ts` is a leaf: no React, no React Native. A sibling picker
imports it as `../time-picker/time-picker.time` and renders the bare wheel
through `TimePickerWheel` from `./time-picker-wheel` — neither pulls the
`TimePicker` root in.

## Out of scope

Clock-dial and ruler faces (`layout` is reserved for them), an anchored popover
presentation, duration pickers, looping wheels, `commitOn="done"`, and typed
time entry.
