# Feedback

A dialog for writing: "What should we fix first?", a bug report, a one-question survey. It is a
[`Dialog`](../dialog/AGENTS.md) whose text field sits in a **recessed well** that says "type here",
with the actions on the band around it. Compound root plus `Feedback.Trigger`, `Feedback.Content`,
`Feedback.Panel`, `Feedback.Title`, `Feedback.Close`, `Feedback.Field`, `Feedback.Footer`,
`Feedback.Action`, `Feedback.Cancel` and `Feedback.Submit`, and `useFeedback()`.

`import { Feedback } from "@delacour/react-native-ui/feedback";`

Not for confirmations or warnings — those are a `Dialog`. Like every overlay it draws through
`Overlay.Portal`, so the app mounts `OverlayProvider` once at its root.

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/feedback` |
| `feedback.tsx` | Root — the open state, the draft, the send state — wrapping a `Dialog`, and the `Object.assign` surface |
| `feedback.context.tsx` | **Leaf.** `FeedbackProvider`, `useFeedback()`, `useFeedbackContext()`, `useFeedbackPart()` |
| `feedback-trigger.tsx` | `Feedback.Trigger` — `Dialog.Trigger` |
| `feedback-content.tsx` | `Feedback.Content` — `Dialog.Content` on the muted band, tighter padding |
| `feedback-panel.tsx` | `Feedback.Panel` — the well, in a clip that eases to its measured height |
| `feedback-title.tsx` | `Feedback.Title` — `Dialog.Title`; publishes a string title as the field's label |
| `feedback-close.tsx` | `Feedback.Close` — `Dialog.Close`, in the well's corner |
| `feedback-field.tsx` | `Feedback.Field` — a bare multiline `TextInput` bound to the draft |
| `feedback-footer.tsx` | `Feedback.Footer` |
| `feedback-action.tsx` | `Feedback.Action` — a `secondary` `Button` for custom actions |
| `feedback-cancel.tsx` | `Feedback.Cancel` — closes, keeps the draft |
| `feedback-submit.tsx` | `Feedback.Submit` — the gate, the trimmed value, the wait on a promise |
| `feedback.variants.ts` | The slotted `tv()`, the row and motion constants, `canSubmitFeedback` and the field-height resolvers — no RN imports |
| `feedback.variants.test.ts` | Slots, tokens in both themes, the submit gate, the field heights |

## Design

- **Everything a dialog does is Dialog's.** `Feedback` renders a `Dialog` and its parts *are*
  Dialog's parts with classes merged over them — open state, portal, scrim, motion, the `modal`
  band, the back button, the escape gesture, focus on open and return, and the keyboard lift that
  keeps the footer above the keyboard. Nothing is restated, so a fix to Dialog is a fix here. The
  import is `../dialog`: Dialog never imports Feedback, so there is no cycle to route around.
- **The shell is the band; the panel is the well.** `Feedback.Content` merges `bg-muted` and `p-2`
  over Dialog's `bg-popover` and `p-5` through the same `tv` merge, so the corner, hairline and
  width cap stay Dialog's. `Feedback.Panel` is `bg-background` with `rounded-md` — one step down
  the corner ramp from the card it sits in, so the two read as nested — and a hairline. The well's
  page colour against the band's muted one is what says "type here" without a field border.
- **The field has no box.** `Feedback.Field` is a raw `TextInput`, not an `Input`: the well is
  its box, and an `Input` would draw a second border inside the first. It restates `font-sans` for
  `Input`'s reason (a `TextInput` inherits nothing), sets `text-input-md` with paragraph leading
  (`leading-6`, `FEEDBACK_FIELD_LINE_HEIGHT`, pinned by a test), and takes `Input`'s `accent-*`
  placeholder, caret and selection classes from `input.variants` — a leaf, so no cycle.
- **The field is floored at `minRows` and capped at `maxRows`.** Six rows and twelve by default,
  as a style (`resolveFeedbackFieldHeightStyle`) because a runtime number cannot be a class.
  Between the two React Native's multiline `TextInput` sizes itself. `maxRows` is not in the
  original spec: without a cap a long message grows the card until Dialog's lift, which keeps the
  title on screen first, has to give up the footer to the keyboard.
- **The draft lives on the root, above `Dialog.Content`.** Content unmounts when the exit animation
  ends; the root does not, so an uncontrolled draft survives a close and a reopen. Cancel, Close,
  the scrim and back all keep it — a long message put down for a moment must not be thrown away.
  `useFeedback().clear()` is the one way to empty it.
- **Submit never closes.** `canSubmitFeedback` gates it (empty and whitespace are empty;
  `canSubmitEmpty` lets an empty one through for chips or a rating; disabled outranks both), and
  `onSubmit` gets the trimmed text. A returned promise turns on the button's loading state and
  makes the field read-only until it settles — and the dialog is still open, so a failure can be
  shown in the well with the draft intact. The caller closes and clears on success. A rejection is
  not swallowed: handle failures inside `onSubmit`, or the app's unhandled-rejection reporting sees
  it, which is better than a send that failed silently.
- **The well eases between heights; the shell never jumps.** A multi-step flow (rating → text →
  thanks) is the caller swapping the panel's and footer's children. `Feedback.Panel` measures the
  well with `onLayout` and animates a clip around it to that height over `FEEDBACK_PANEL_RESIZE_MS`
  (200ms). The spec named a Reanimated `LinearTransition` on the panel; that animates the panel's
  frame inside a shell that has already snapped to its final size and re-centred, which is exactly
  the jump to avoid. A real height changing on every frame moves the shell through ordinary layout
  and keeps it centred — Accordion's reasoning for its own panel. The first layout lands without
  animating, and under reduce motion every change does.
- **The field's label is the title.** `Feedback.Title` publishes its children to the root when
  they are a plain string, and `Feedback.Field` uses that as its default `accessibilityLabel`, so
  a screen reader announces the question rather than only the placeholder. A non-string title
  publishes nothing; pass `accessibilityLabel` then.
- **Close sits in the well, not the shell.** `Feedback.Close` is `Dialog.Close` with its slot
  re-pinned to the well's corner (`top-3 right-3`, against the panel's `p-4`); the title keeps
  Dialog's `pr-8` clearance.
- **No blur backdrop.** As for every overlay: frosted scrims need `expo-blur`, not a peer.

## Testing

`bun test` reaches `feedbackVariants`, the tokens in both themes, `canSubmitFeedback` and the
field-height resolvers. Opening, the submit gate, the async send, the draft across close and
reopen, the keyboard, the multi-step resize and every dismissal path are verified on a simulator
through `/feedback` in the playground.

Preview media is held back with the rest of the overlays (see `docs/plans/overlays/README.md`).
When a capture tool is back, re-add `capture` with these settings and run
`bun run previews -- -- --only feedback`: `basic` `{ flow: "feedback/basic", frame: "device", hero: true }`,
and `sending`, `multi-step` `{ flow: "feedback/<id>", frame: "device" }`. The flows are in
`.argent/flows/previews/feedback/`.
