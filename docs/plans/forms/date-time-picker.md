# DateTimePicker

- **Status**: spec, not started
- **Wave**: 2 (after `calendar`, `time-picker` and `date-picker` merge into cat-forms)
- **Depends on**: `../calendar/calendar.date` (CalendarDate, helpers, formatters), `../time-picker/time-picker.time` (TimeValue, helpers), `TimePicker.Wheel` and Calendar parts, `../date-picker/date-picker.variants` + `date-picker.context` (trigger slots, trigger-state resolvers), BottomSheet, Tabs (for the `tabs` layout), Field context leaf, Button, Pressable, Text, Separator.
- **Never duplicates**: date math, time math, formatting, trigger chrome.

## Purpose on mobile
One field for "when": a date and a time of day decided together (appointments, reminders, deadlines). A single sheet holds a calendar and a time wheel so the two halves can be set in either order, with one Done.

## Behaviour reference (summary of features observed)
- Combined date and time in one panel with one value.
- Calendar is the dominant element; time controls sit below a hairline.
- One Done button closes the whole panel; the value updates continuously while picking, Done only closes. Dismissing by outside tap does not revert.
- Halves fill in either order: time first assumes today; date first uses the current hour.
- Time controls: 12/24 hour, minute step, min/max time; date bounds: min/max date and disabled dates.
- Time face options (compact ruler, wheel, clock) and presentation options (popover, sheet, dialog, inline). This spec ships the wheel, in sheet or inline.
- Locale affects month names, time text and trigger text; custom trigger format; `disabled` freezes the whole panel, including inline.
- Out of scope: other calendar systems.

## API

```ts
// date-time-picker.value.ts (leaf, pure, no RN imports)
import type { CalendarDate } from "../calendar/calendar.date";
import type { TimeValue } from "../time-picker/time-picker.time";
export type DateTimeValue = { date: CalendarDate; time: TimeValue };
```

```ts
// date-time-picker.types.ts
export type DateTimePickerPresentation = "sheet" | "inline"; // "popover" once Overlays' Popover merges
export type DateTimePickerLayout = "tabs" | "stacked";

export type DateTimePickerProps = {
  value?: DateTimeValue | null;
  defaultValue?: DateTimeValue | null;
  onValueChange?: (value: DateTimeValue | null) => void;
  minDateTime?: DateTimeValue; maxDateTime?: DateTimeValue;   // supersede separate minDate/minTime so bounds compose correctly
  disabledDates?: readonly DateMatcher[];
  minuteStep?: 1 | 2 | 5 | 10 | 15 | 20 | 30;
  hourCycle?: HourCycle | "auto";
  showSeconds?: boolean;
  locale?: string;
  weekStartsOn?: Weekday | "auto";
  captionLayout?: "label" | "picker";
  format?: (value: DateTimeValue, ctx: { locale: string; hourCycle: HourCycle }) => string;
  placeholder?: string;                           // default "Select date and time"
  layout?: DateTimePickerLayout;                  // default "tabs"
  presentation?: DateTimePickerPresentation;      // default "sheet"
  isOpen?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void;
  isDisabled?: boolean; isReadOnly?: boolean; isInvalid?: boolean;
  variant?: "primary" | "secondary"; size?: "sm" | "md" | "lg";
  title?: string; doneLabel?: string; dateLabel?: string; timeLabel?: string; // defaults "Select date and time", "Done", "Date", "Time"
  isClearable?: boolean;                          // default false
  accessibilityLabel?: string;
  className?: string;
  children?: ReactNode;                           // omit for default anatomy
};
```
Native-`Date` interop for callers: `toNativeDate(value: DateTimeValue): Date` and `fromNativeDate(date: Date): DateTimeValue` exported from the leaf (local fields, no UTC).

Hook `useDateTimePicker()` -> `{ value, setDate(d), setTime(t), setValue, display, isOpen, open, close, activeSection: "date" | "time", setActiveSection, timeBoundsForDate: TimeBounds, isDisabled, isInvalid }`; `useDateTimePickerContext()` nullable.

Parts: `DateTimePicker.Trigger`, `.Value`, `.Icon`, `.Content`, `.Calendar`, `.Time` (wraps `TimePicker.Wheel` + a readout row), `.Done`, `.Clear`. `.Content` lays out per `layout`. Display names `DelacourUI.DateTimePicker[.Part]`.

```tsx
<Field>
  <Field.Label>Appointment</Field.Label>
  <DateTimePicker value={dt} onValueChange={setDt} minDateTime={fromNativeDate(new Date())} minuteStep={15}>
    <DateTimePicker.Trigger />
    <DateTimePicker.Content title="Appointment">
      <DateTimePicker.Calendar />
      <DateTimePicker.Time />
    </DateTimePicker.Content>
  </DateTimePicker>
</Field>
```
Zero-children form renders that anatomy.

**Layouts.** `tabs` (default): `Tabs` (variant `primary`, size `sm`) with "Date" and "Time" panels inside one fixed-height sheet — safe on short phones; opens on Date, and auto-advances to Time after a date pick only the first time (no auto-advance if a time already exists). `stacked`: Calendar, hairline `Separator`, then a time row "Time  9:30 AM" that expands the wheel beneath (Reanimated height); for tablets/tall sheets. Both use the same parts.

**Behaviour decisions**
- Halves in either order: `setDate(d)` with null value -> `{ date: d, time: resolveInitialTime(now, step, bounds) }`; `setTime(t)` with null value -> `{ date: today(), time: t }` (if today is disabled/out of bounds, nearest allowed date via `nearestAllowedDate`).
- Continuous commit: each date pick and each wheel settle calls `onValueChange` with a complete `DateTimeValue`; Done only closes; dismiss keeps the value.
- Bounds compose: `timeBoundsForDate(date, minDateTime, maxDateTime)` returns time bounds only when `date` equals the min/max date; changing the date re-clamps the time with `clampDateTime`.
- Disabled dates / `minDateTime`/`maxDateTime` date part feed Calendar's `minDate/maxDate/disabled`.
- Clear sets `null`.
- Trigger text: `formatDateTime(value, locale, hourCycle)` -> e.g. "Mon 5 Oct, 3:30 PM" via `Intl.DateTimeFormat` with `dateStyle`-like options and the picked hour cycle; custom `format` wins.

## Variants & sizes
Same `variant` and `size` axes as Input/DatePicker (trigger via `date-picker.variants` slots, which in turn come from the `inputVariants` leaf). Content slots in `date-time-picker.variants.ts`: `content, tabs, panel, divider, timeRow, timeLabel, timeValue, footer`. The embedded Calendar is `md`, the wheel `md`, regardless of trigger size.

## States
default; pressed; focused (= open); disabled (inert everywhere, including inline panel); invalid (`isInvalid ?? field.isInvalid`); readOnly (display only); empty (placeholder); partially-filled cannot exist (completes itself); time rows out of bounds dimmed; no loading. Nearest-wins `??`.

## Accessibility
- Trigger as DatePicker: role button, label from `accessibilityLabel ?? field.label ?? "Date and time"`, value = long formatted text, `registerPress(open)`.
- Tabs expose tablist semantics (Tabs component); Calendar and wheel a11y as their own specs (adjustable columns, labelled day cells).
- Announce the composed value ("Monday 5 October 2026 at 3:30 PM") on Done.
- Focus order in `stacked`: caption, grid, time row, Done.

## Motion & haptics
- Tab slide (Tabs pager) and the stacked time-row expansion are behavioural; under `useCalmMotion()` the expansion becomes instant. Calendar month slide and wheel flourish per their specs.
- Haptics: Calendar selection tick, wheel row tick, `impactLight` on Done.
- Gesture risk: the Tabs pager pan and the Calendar month swipe are both horizontal inside a vertical sheet pan. Disable Calendar `swipeToPage` inside the `tabs` layout (nav arrows only) and verify the sheet content pan on device.

## Reuses / new internal pieces / peer deps
Reuses Calendar parts + `calendar.date.ts`, `TimePicker.Wheel` + `time-picker.time.ts`, `date-picker.variants` and `date-picker.context` for trigger and trigger-state resolvers, BottomSheet, Tabs (`../tabs/tabs.variants`/parts per rule 3 leaf guidance), Separator, Button, Pressable, Text, Icon (`IconCalendar`), `useControllableState`, `useFieldContext`.
New: `date-time-picker.value.ts` leaf, content layout, expandable time row.
**Peer deps: none new.** Optional engine peer required, same as the other pickers.

## Files
`packages/react-native-ui/src/components/date-time-picker/`
| File | Holds |
| --- | --- |
| `index.ts` | `@delacour/react-native-ui/date-time-picker` |
| `date-time-picker.tsx` | root, state, surface |
| `date-time-picker-trigger.tsx`, `-value.tsx`, `-icon.tsx` | trigger parts (thin, built on DatePicker's variants leaf) |
| `date-time-picker-content.tsx` | sheet shell, layout switch |
| `date-time-picker-calendar.tsx`, `date-time-picker-time.tsx` | bound sections |
| `date-time-picker-done.tsx`, `date-time-picker-clear.tsx` | footer actions |
| `date-time-picker.context.tsx` | context + hooks |
| `date-time-picker.types.ts` | prop types |
| `date-time-picker.value.ts` / `.value.test.ts` | **pure** DateTimeValue helpers + tests |
| `date-time-picker.variants.ts` / `.variants.test.ts` | slotted `tv()` + resolvers |
| `AGENTS.md` | notes, file map, table row |
Plus: `gen-exports`; playground demos/route/index row/`gen-demos`; docs mdx + meta.json; registry `ITEM_META` (registryDependencies: calendar, time-picker, date-picker, tabs, bottom-sheet, field) + `registry:build`; changeset (minor `@delacour/react-native-ui` and `delacour`).

## Pure logic to unit-test (`date-time-picker.value.test.ts`)
Functions: `compareDateTimes`, `clampDateTime(v, min, max)`, `timeBoundsForDate(date, min, max)`, `completeFromDate(date, now, step, bounds)`, `completeFromTime(time, now, bounds, dateRules)`, `nearestAllowedDate(from, rules)`, `isDateTimeValid`, `toNativeDate`, `fromNativeDate`, `formatDateTime`, `serialiseDateTime`/`parseDateTime` (ISO `YYYY-MM-DDTHH:mm`).
Cases:
- `compareDateTimes` orders by date then time; equal -> 0.
- `timeBoundsForDate`: date strictly between min and max dates -> `{}`; equal to min date -> `{minTime}`; equal to both (same day) -> both; outside -> everything disabled.
- `clampDateTime`: below min snaps to min; above max snaps to max; changing date to the min date re-clamps an earlier time up.
- `completeFromDate` with no time: time = now snapped to step and clamped; step 15 at 10:07 -> 10:15; at 23:55 step 15 clamps to 23:45 rather than wrapping into tomorrow.
- `completeFromTime`: date = today; if today disabled (weekday matcher) returns the next allowed date within 366 days; none allowed -> `null`.
- `toNativeDate(fromNativeDate(d))` round trips local fields, across DST change days (check 2026-09-27 NZ spring-forward doesn't shift day or hour); `fromNativeDate` ignores seconds/ms.
- `formatDateTime`: en-US 12h contains "PM"; en-GB 24h contains "15:30"; honours forced `hourCycle`; invalid locale no throw.
- `parseDateTime("2026-10-05T15:30")` ok; malformed / out-of-range -> `null`.
- Variants test: tokens exist in both themes; the content slots carry no colour on parents; the `stacked` expansion constants are positive.

## Playground demos (`apps/playground/src/demos/date-time-picker/`)
`tabs-layout` (capture, **hero**), `stacked-layout` (capture), `bounds-from-now` (min date-time; capture), `step-15-24h` (capture), `inline` (capture), `in-field-invalid` (no capture), `native-date-interop` (no capture).

## Docs page outline
Intro/import and `BottomSheetProvider` note; Basic; Layouts (tabs vs stacked); Either-order behaviour; Min/max date-time and disabled dates; Minute step and 12/24h; Locale and custom format; Native `Date` interop helpers; In a `Field`; Inline; Accessibility; API (root, parts, `useDateTimePicker`, value helpers).

## Out of scope / follow-ups
- Time zones (value is wall-clock; store zone separately), clock/ruler faces, anchored popover, date-range plus times, recurring schedules, `commitOn="done"` mode.
- Open question: `Tabs` inside a `BottomSheet` — verify the pager pan does not fight the sheet's content pan on both platforms; fallback is a plain two-button segmented control (ToggleButton group) switching panels without a pager.
- Open question: `minDateTime/maxDateTime` replace the behaviour's separate min/max date and time; confirm the single-bound API is acceptable.
- Resolved: import `Calendar` from `../calendar` (and `Tabs` from `../tabs`, `TimePicker` from `../time-picker`) — folder-index imports are the house norm; see README decision 4. No `*.compose.ts` leaf.
- Cross-category: shared `picker-trigger` leaf with Select (see DatePicker spec).

## Acceptance checklist
- [ ] All date/time math imported from the two leaves; no duplicated helpers.
- [ ] Either-order completion works; value is never half-filled.
- [ ] Bounds re-clamp time when the date changes; disabled dates honoured.
- [ ] `tabs` and `stacked` layouts verified in a mounted sheet on iOS simulator; no gesture conflicts.
- [ ] Controlled/uncontrolled value and open; Done closes only; dismiss keeps value.
- [ ] Disabled blocks every part including inline presentation.
- [ ] Field cascade + `registerPress` verified.
- [ ] VoiceOver/TalkBack verified; Done announces the composed value.
- [ ] `DelacourUI.` displayNames; docs/display-name tests pass.
- [ ] AGENTS.md, table row, gen-exports, demos, docs, registry, changeset done.
- [ ] No JSX comments, no `any`, semantic tokens only.
