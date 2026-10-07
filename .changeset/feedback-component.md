---
"@delacour/react-native-ui": minor
"delacour": patch
---

Add `Feedback`, a dialog for writing — the field in a recessed well, the actions on the band around it

`@delacour/react-native-ui/feedback`, and `delacour add feedback`. Built on `Dialog`, so open state,
portal, scrim, back, escape, focus and the keyboard lift are Dialog's. A compound root with
`Trigger`, `Content`, `Panel`, `Title`, `Close`, `Field`, `Footer`, `Action`, `Cancel` and `Submit`,
and `useFeedback()`. The draft is `value` / `defaultValue` / `onValueChange` on the root and survives
close and reopen until `clear()`. `Submit` is gated by `canSubmitFeedback` (empty and whitespace are
empty, `canSubmitEmpty` for chips or a rating), passes the trimmed text, shows its loading state and
makes the field read-only while a returned promise is in flight, and never closes on its own. The
well eases to its measured height when a multi-step flow swaps its content, so the card never
jumps; under Reduce Motion it changes height at once. The field grows from `minRows` (6) to
`maxRows` (12) before it scrolls, and takes the title's text as its label.
