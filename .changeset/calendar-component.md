---
"@delacour/react-native-ui": minor
"delacour": minor
---

Add `Calendar`, an always-visible month grid for picking one day (`mode="single"`), several (`"multiple"`) or a range (`"range"`), controlled or uncontrolled. Always six weeks, so the height never moves; swipe or tap the arrows to page, and tap the caption for month and year jump views. `minDate`/`maxDate` and `disabled` matchers (a date, a span, weekdays or a predicate) limit what can be picked; names and the first day of the week come from the locale. Two variants, three sizes on the input scale, optional `Surface` chrome, custom day content, and `isInvalid` / `isDisabled` / the label cascade from a `Field`. Days are plain `CalendarDate`s — `{ year, month, day }`, no time zone — with the helpers to compare, add, format, parse and serialise them, so no date library is needed. `bunx delacour add calendar` copies it.
