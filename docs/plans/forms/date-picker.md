# DatePicker

- **Status**: spec, not started
- **Wave**: 2 (starts after `calendar` merges into cat-forms)
- **Depends on**: Calendar leaf modules (`../calendar/calendar.date`, `../calendar/calendar.context`, `../calendar/calendar.variants`) and the Calendar parts; BottomSheet; Input variants leaf; Field context leaf; Pressable, Text, Button, Icon; `use-controllable-state`.
- **Imports, never duplicates**: all date math and formatting come from `calendar.date.ts`; the sheet body renders the Calendar compound (see open question on the cross-folder import rule).

## Purpose on mobile
A field-shaped control that shows the chosen date (or range) and opens a bottom sheet holding a Calendar. For forms: birthday, due date, check-in / check-out. Single dates close on pick; ranges close when both ends exist.

## Behaviour reference (summary of features observed)
- Calendar presented from a trigger, as a popover or sheet; trigger text derived from the selection, never stored independently.
- Modes: single, range, multiple. Closes when the selection is **finished**, not when it changes: single closes on pick; range stays open until both ends are chosen; multiple stays open.
- Half-picked range shows with a dash ("12 Oct –"); placeholder like "Check in — check out" for range.
- Constraints: `minDate`, `maxDate`, disabled dates; month caption as label or jump pickers; week start and locale control; selecting outside days optional.
- Custom `format` override; `open` / `onOpenChange` controllable; `disabled`.
- Trigger carries an accessibility label; calendar day labels read the full date.
- Out of scope here: non-Gregorian calendars, multi-month layout.

## API

```ts
// date-picker.types.ts
import type { CalendarDate, CalendarDateRange, DateMatcher, Weekday } from "../calendar/calendar.date";

export type DatePickerPresentation = "sheet" | "inline"; // "popover" later, once Overlays' Popover merges

type DatePickerCommon = {
  placeholder?: string;                                  // default by mode: "Select date" / "Start – End" / "Select dates"
  format?: (value: CalendarDate, ctx: { locale: string }) => string;       // single & multiple items
  formatRange?: (range: CalendarDateRange, ctx: { locale: string }) => string;
  locale?: string;
  weekStartsOn?: Weekday | "auto";
  captionLayout?: "label" | "picker";
  minDate?: CalendarDate; maxDate?: CalendarDate;
  disabledDates?: readonly DateMatcher[];
  selectOutsideDays?: boolean;
  presentation?: DatePickerPresentation;                 // default "sheet"
  isOpen?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void;
  isDisabled?: boolean; isReadOnly?: boolean; isInvalid?: boolean;
  variant?: "primary" | "secondary"; size?: "sm" | "md" | "lg";
  title?: string;                                        // sheet title, default "Select date"
  doneLabel?: string; clearLabel?: string;
  isClearable?: boolean;                                 // default true for range/multiple, false for single
  accessibilityLabel?: string;                           // falls back to field.label
  className?: string;
  children?: ReactNode;                                  // omit for the default anatomy
};

export type DatePickerProps = DatePickerCommon & (
  | { mode: "single"; value?: CalendarDate | null; defaultValue?: CalendarDate | null; onValueChange?: (v: CalendarDate | null) => void }
  | { mode: "range"; value?: CalendarDateRange; defaultValue?: CalendarDateRange; onValueChange?: (v: CalendarDateRange) => void }
  | { mode: "multiple"; value?: readonly CalendarDate[]; defaultValue?: readonly CalendarDate[]; onValueChange?: (v: readonly CalendarDate[]) => void }
);
```
House names `value / defaultValue / onValueChange`, `isOpen / onOpenChange` (matching BottomSheet). `mode` defaults to `"single"` only when `value`/`defaultValue` are absent or a `CalendarDate`; the union is discriminated, so TS requires `mode` for range/multiple.

Context hook `useDatePicker()` -> `{ mode, value, display: string, isOpen, open, close, isDisabled, isInvalid, isReadOnly, hasValue, clear(), locale }`; `useDatePickerContext()` nullable (leaf `date-picker.context.tsx`).

Parts: `DatePicker.Trigger` (a Pressable styled as the Input box; default children `DatePicker.Value` + `DatePicker.Icon`), `DatePicker.Value` (placeholder aware, handles half-range dash), `DatePicker.Icon` (`IconCalendar`), `DatePicker.Content` (BottomSheet portal/overlay/container; header title + close; body `DatePicker.Calendar`; footer), `DatePicker.Calendar` (thin wrapper that binds root props to `Calendar` and routes `onSelect` through the finish rule), `DatePicker.Done`, `DatePicker.Clear`. Display names `DelacourUI.DatePicker[.Part]`.

```tsx
<Field isInvalid={!!error}>
  <Field.Label>Check in / out</Field.Label>
  <DatePicker mode="range" value={range} onValueChange={setRange} minDate={today()}>
    <DatePicker.Trigger />
    <DatePicker.Content title="Dates" />
  </DatePicker>
  <Field.Error>{error}</Field.Error>
</Field>
```
Zero-children form `<DatePicker mode="single" value={d} onValueChange={setD} />` renders the default anatomy.

**Behaviour decisions**
- `resolveShouldClose(mode, nextValue)`: single -> true when non-null; range -> true when `start` and `end` both set; multiple -> false. Closing is delayed 120 ms so the selected state is seen (behavioural, kept under calm motion; skipped when calm).
- Range with end earlier than start: Calendar's `applyRangeTap` handles it; picker never sees invalid ranges.
- Clear sets `null` / empty range / `[]`, keeps sheet open.
- Trigger text: `formatSelection(mode, value, locale, format)` pure resolver (below). Single -> `formatDate(d,{style:"medium"})`; range -> "5 Oct – 9 Oct 2026" (compress shared month/year via `Intl.DateTimeFormat#formatRange` when available) and half-range "5 Oct –"; multiple -> up to 2 dates joined, then "3 dates".
- Dismiss (swipe/overlay) keeps whatever was committed; a half-picked range is **not** committed upstream (draft held inside the sheet, `onValueChange` for range fires on completion only, plus on Clear).

## Variants & sizes
Same axes as Input: `variant` primary|secondary, `size` sm|md|lg. Trigger reuses the `inputVariants` root slot (`resolveInputFieldClass`, `h-input-*`, `text-input-*`) so the box matches `Input` pixel for pixel. `datePickerVariants` slots: `trigger, value, valuePlaceholder, icon, header, body, footer`. The calendar inside inherits `size` default `md` (independent: `calendarSize?` prop, default `"md"` because touch targets must stay 44pt regardless of the trigger size).

## States
default; pressed (fade); focused (= open, `border-ring`); disabled; invalid (`isInvalid ?? field.isInvalid`, destructive border and icon); readOnly (shows value, does not open); empty (placeholder muted); half-range (value shows dash, `valuePlaceholder` style on the missing end); loading n/a. Nearest-wins `??` chains for `isInvalid`/`isDisabled`.

## Accessibility
- Trigger `accessibilityRole="button"`, label `accessibilityLabel ?? field.label ?? "Date"`, `accessibilityValue.text` = display text or "not set", hint "Opens calendar"; registers `registerPress(open)` with Field (null on unmount).
- Sheet labelled by title; Calendar a11y per its spec; Done/Clear labelled.
- Announce completion ("Selected 5 October 2026") with `announceForAccessibility` on close.
- Range trigger value reads "5 October to 9 October 2026".

## Motion & haptics
- Presentation motion belongs to BottomSheet. Haptics: Calendar's selection tick; `Presets.System.impactLight` when the sheet auto-closes on completion (play it through the same `playHaptic` helper `pressable.tsx` exports).
- Auto-close delay and trigger text swap are not animated. `useCalmMotion()` only removes the delay.

## Reuses / new internal pieces / peer deps
Reuses Calendar (parts + `calendar.date.ts`), BottomSheet, Pressable, Text, Button, Icon (`IconCalendar`), `inputVariants`, `useFieldContext`, `useControllableState`.
New: `date-picker.variants.ts` (+ `resolveShouldClose`, `formatSelection`, `resolveDefaultPlaceholder`), `DatePicker.Trigger` (Input-shaped).
**Peer deps: none new.** Optional engine peer `@delacour/react-native-bottom-sheet` required for the subpath.
**Shared trigger**: `date-time-picker` imports `date-picker.variants` (leaf) for the trigger slots and `date-picker.context` rather than rewriting them. `time-picker` has its own trigger (Wave 1, shipped before this exists); see open question.

## Files
`packages/react-native-ui/src/components/date-picker/`
| File | Holds |
| --- | --- |
| `index.ts` | `@delacour/react-native-ui/date-picker` |
| `date-picker.tsx` | root, state (`useControllableState` for value and open), surface |
| `date-picker-trigger.tsx`, `-value.tsx`, `-icon.tsx` | trigger parts |
| `date-picker-content.tsx` | sheet shell |
| `date-picker-calendar.tsx` | Calendar binding + finish rule |
| `date-picker-done.tsx`, `date-picker-clear.tsx` | footer actions |
| `date-picker.context.tsx` | context + hooks |
| `date-picker.types.ts` | unions |
| `date-picker.variants.ts` / `.variants.test.ts` | slotted `tv()` + pure resolvers |
| `AGENTS.md` | notes, file map, row in package table |
Plus: `gen-exports`; playground demos/route/index row/`gen-demos`; docs mdx + meta.json; registry `ITEM_META` (registryDependencies: calendar, bottom-sheet, input, field) + `registry:build`; changeset (minor `@delacour/react-native-ui` and `delacour`).

## Pure logic to unit-test (`date-picker.variants.test.ts`, plus calendar leaf already tested)
- `resolveShouldClose`: single null -> false; single date -> true; range `{start,null}` -> false; `{start,end}` -> true; multiple any -> false.
- `formatSelection`: null -> `undefined` (placeholder shown); single en-NZ contains "Oct"; range same month compresses; range across years keeps both years; half range ends with an en dash and no end; multiple 1, 2, 3+ dates; custom `format` wins; invalid locale falls back.
- `resolveDefaultPlaceholder(mode)`: three strings.
- `resolveTriggerState({isOpen,isInvalid,isDisabled,isReadOnly})` -> variant axes; invalid outranks focus; disabled blocks open (`canOpen`).
- Variants: tokens exist in both themes; trigger root class set is a superset of `inputVariants` root chrome for each size/variant (reuse the sweep used in `input.variants.test.ts`).

## Playground demos (`apps/playground/src/demos/date-picker/`)
`single` (capture, **hero**), `range-booking` (capture), `multiple` (capture), `bounds-and-disabled-weekends` (capture), `sizes-variants` (capture), `in-field-invalid` (no capture), `controlled-open` (no capture), `custom-format-locale` (no capture).

## Docs page outline
Intro/import and the `BottomSheetProvider` note; Single; Range with placeholder; Multiple; Min/max and disabled; Custom format and locale; In a `Field`; Controlled open; Inline presentation; Accessibility; API (root union, parts, `useDatePicker`); Roadmap note on the anchored presentation.

## Out of scope / follow-ups
- Popover presentation (needs Overlays' Popover), non-Gregorian calendars, presets row ("Last 7 days"), multi-month, typed text entry (`Input` with mask), time of day (see DateTimePicker).
- Open question: shared picker trigger across Select/DatePicker/TimePicker/DateTimePicker. Default: DatePicker owns `DatePicker.Trigger`; DateTimePicker imports its variants leaf. Fold into one `picker-trigger` leaf if Select (Wave 1) provides it.
- Resolved: import `Calendar` from `../calendar` (and `Tabs` from `../tabs`, `TimePicker` from `../time-picker`) — folder-index imports are the house norm; see README decision 4. No `*.compose.ts` leaf.
- Open question: a half-picked range draft is held in sheet-local state; confirm the product wants dismissal to discard it.

## Acceptance checklist
- [ ] No date math duplicated; all from `calendar.date.ts`.
- [ ] Single closes on pick, range on completion, multiple never; Done and Clear behave.
- [ ] Trigger text correct for empty, half-range, full range, multiple.
- [ ] Controlled/uncontrolled value and open; readOnly/disabled never open.
- [ ] Field cascade and `registerPress` verified (label tap opens the sheet).
- [ ] Trigger box matches `Input` at every size/variant (variants test).
- [ ] VoiceOver/TalkBack verified; announcements on close.
- [ ] Verified on iOS simulator inside a mounted `BottomSheetProvider`.
- [ ] `DelacourUI.` displayNames; docs/display-name tests pass.
- [ ] AGENTS.md, table row, gen-exports, demos, docs, registry, changeset done.
- [ ] No JSX comments, no `any`, semantic tokens only.
