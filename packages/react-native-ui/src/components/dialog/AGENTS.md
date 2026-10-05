# Dialog

A centred card over a dimmed app that asks for a decision or a short input before the user goes
on: confirm a delete, rename a file, accept terms. Compound root plus `Dialog.Trigger`,
`Dialog.Content`, `Dialog.Close`, `Dialog.Header`, `Dialog.Title`, `Dialog.Description`,
`Dialog.Body` and `Dialog.Footer`, and `useDialog()`.

`import { Dialog } from "@delacour/react-native-ui/dialog";`

It is drawn with the [overlay foundation](../overlay/AGENTS.md) — `Overlay.Portal`,
`Overlay.Scrim`, `useOverlayPresence`, `useOverlayBackHandler` — so the app has to mount
`OverlayProvider` once at its root. Without one the dialog draws inline and warns once.

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/dialog` |
| `dialog.tsx` | Root — the open state, the ids and the focus refs — and the `Object.assign` compound surface |
| `dialog.context.tsx` | **Leaf.** `DialogProvider`, `DialogSizeProvider`, `useDialog()`, `useDialogContext()`, `useDialogPart()`, `useDialogSize()` |
| `dialog-trigger.tsx` | `Dialog.Trigger` — donates the open with `asChild`, keeps the trigger's ref for focus return |
| `dialog-content.tsx` | `Dialog.Content` — presence, portal, scrim, card, motion, keyboard lift, back button, focus |
| `dialog-close.tsx` | `Dialog.Close` — the corner ✕, or with `asChild` any control that closes |
| `dialog-header.tsx` | `Dialog.Header` |
| `dialog-title.tsx` | `Dialog.Title` — a `Text.Header` carrying the title `nativeID` and the focus ref |
| `dialog-description.tsx` | `Dialog.Description` — a muted `Text.Paragraph` |
| `dialog-body.tsx` | `Dialog.Body` |
| `dialog-footer.tsx` | `Dialog.Footer` — `plain` or `panel`, row or stacked by size |
| `dialog.variants.ts` | The slotted `tv()`, the size classes, the motion and slop constants, and three pure resolvers — no RN imports |
| `dialog.variants.test.ts` | Slots per size and footer variant, tokens in both themes, the resolvers |

## Design

- **One axis on the card, one on the footer.** `size` (`sm` 320, `md` 400, `lg` 520, `full`) is a
  `max-w-*` on a `w-full` card, so a narrow phone shrinks every size to the screen gutter and only
  a wider screen reaches the cap. `Dialog.Footer`'s `variant` is `plain` — a right-aligned row
  inside the card's padding — or `panel`, which bleeds out of the padding to the card's edges on a
  `bg-muted` band under a hairline, rounding only its bottom corners.
- **An `sm` footer stacks.** Two labelled buttons side by side on a 320pt card leave each label a
  few characters before it truncates. `resolveDialogFooterDirection` is the rule, and the footer
  reads the size from `DialogSizeProvider`, which `Dialog.Content` mounts — a context of its own
  rather than a field on the root's, because the size belongs to the content, not the dialog.
  Stacked actions keep written order, so the primary action, written last, sits last either way.
- **The card is a popover surface with the card corner.** `bg-popover`, the token a layer over the
  app paints with (as `BottomSheet` does), and `rounded-lg`, the package's card step. The scrim is
  the foundation's `bg-overlay` at opacity 1, faded by presence.
- **`Dialog.Content` renders nothing until the dialog opens, and stays through the exit.**
  `useOverlayPresence` keeps it mounted until the exit animation ends, and the portal is mounted
  only while present, so the registry entry, the z-order and the back handler all follow presence
  — the foundation's contract. A re-open mid-exit reverses from wherever `progress` is.
- **It draws in the `modal` band**, above every bottom sheet and the navigator's header. A sheet
  opened *from* a dialog would draw under it; open a dialog from a sheet, never the reverse.
- **Every path to closed is one `setOpen(false)`** — the trigger, `Dialog.Close`, the scrim, the
  back button, the escape gesture and `useDialog().close()`. The root drops a set that does not
  change the value, so a second tap on the scrim while the card is already leaving does not report
  `onOpenChange(false)` twice.
- **`isDismissible={false}` turns off the ways out the user did not choose.** The scrim still takes
  the touch — the app under an alert dialog must not be pressable — but does nothing; the back
  button is not subscribed; `onAccessibilityEscape` is not set; and the card announces as
  `alertdialog`. `Dialog.Close` still closes it: it is one of the dialog's own actions.
- **Triggers and closes donate the press.** With `asChild` they hand `onPress` to the child,
  chained ahead of the child's own, for `BottomSheet.Trigger`'s reason: two tap gestures in an
  ancestor/descendant pair are not simultaneous, so a pressable wrapped around a `Button` never
  fires. The child has to be something that handles `onPress`.
- **The corner ✕ presses with `fade` and 8pt of slop.** A scale on a glyph this small reads as a
  jitter, and a bare glyph has no capsule to bring it toward 44pt. It sits out of the flow, and
  `Dialog.Title`'s `pr-8` reserves its clearance on every dialog, so adding a close never reflows
  the title.
- **The title and description carry no type of their own.** They *are* `Text.Header` and a muted
  `Text.Paragraph`; a size in the slot would be a second definition of a preset. A test asserts
  the `title` slot is exactly `pr-8`. There is no `description` slot: `tv` emits `undefined` for an
  empty string, so the part merges its `className` with `cn()`, as `BottomSheet.Description` does.
- **Motion.** Scrim opacity is `progress`; the card fades with it and grows from
  `DIALOG_ENTER_SCALE` (0.96) and `DIALOG_ENTER_TRANSLATE_Y` (8pt) below. Under reduce motion the
  transforms drop and the fade stays, per the foundation. `isMotionCalm` does not still it.
- **The keyboard lifts the card just enough.** `resolveDialogKeyboardLift` is the smallest lift
  that keeps the card's bottom `DIALOG_KEYBOARD_MARGIN` (16pt) above the keyboard, never negative,
  and capped so the card's top never rises under the top safe-area inset — a card too tall for
  both keeps its title on screen. It is a worklet read in the card's animated style against
  `useReanimatedKeyboardAnimation`'s height, so it rides the keyboard's own frames. The card's
  edges come from `onLayout`, which ignores transforms, so the lift never feeds back into itself.
  The positioner fills the portal host, which fills the window, so layout `y` is window `y`.
- **Accessibility.** The card is `accessibilityViewIsModal` with `role="dialog"` (or
  `"alertdialog"`, `resolveDialogRole`) and `accessibilityLabelledBy` the title's `nativeID` for
  Android. Once the entrance finishes (`onEntered`) focus moves to the title; once the exit
  finishes, to the trigger, if one is still mounted. `findNodeHandle` of a ref that has gone is
  null, and focus is then left where the system puts it. `Dialog.Title` takes no `ref` for that
  reason — the dialog holds it.
- **No blur backdrop.** Frosted scrims need `expo-blur`, which is not a peer; recorded as a
  follow-up for every overlay.

## Testing

`bun test` reaches `dialogVariants`, the size classes, the footer direction, the role and the
keyboard lift. Opening from a trigger and controlled, every dismissal path, the alert dialog, the
z-order over a sheet, the exit, the keyboard, VoiceOver focus and reduce motion are verified on a
simulator through `/dialog` in the playground — `over-sheet` is the z-order case.
