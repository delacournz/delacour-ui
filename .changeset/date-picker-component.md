---
"@delacour/react-native-ui": minor
"delacour": minor
---

Add `DatePicker`, a field-shaped trigger that shows a date (`mode="single"`), a range (`"range"`) or several (`"multiple"`) and opens a `Calendar` in a bottom sheet to change it. The sheet closes when the pick is finished — on a day, on a range's second end, or on Done for several — and a half-picked range is held inside the sheet rather than reported. The trigger is the `Input` box at every `size` and `variant`; its text is formatted from the value through the calendar's `Intl` formatters, with `format` and `formatRange` overrides and a long-form screen-reader value. `minDate`/`maxDate`/`disabledDates`, `locale` and week start pass to the calendar; `isOpen`/`onOpenChange` and the value work controlled or uncontrolled; Clear, read-only, `presentation="inline"`, and `isInvalid`/`isDisabled`/label/label-tap from a `Field`. Needs `BottomSheetProvider`. `bunx delacour add date-picker` copies it.
