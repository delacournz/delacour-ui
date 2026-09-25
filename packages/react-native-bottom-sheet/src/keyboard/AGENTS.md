# keyboard

keyboard-controller's shared values, turned into the sheet's; which keyboard
is the sheet's to answer; and what each `keyboardBehavior` does about it.

## Files

| Path | What |
| --- | --- |
| `use-sheet-keyboard.ts` | The writer reaction (`keyboardHeight`, `keyboardProgress`, `keyboardOwned`) and the behaviour reaction (`extend` / `fillParent` snaps, `restore`); returns the registry `useBottomSheetTextInput` writes into |
| `use-bottom-sheet-text-input.ts` | `useBottomSheetTextInput()` → `{ ref, onFocus, onBlur }`, the explicit registration; inert outside a sheet |
| `use-keyboard-animation-guard.ts` | `useKeyboardAnimationGuard` and `reconcileKeyboardAnimation` — the stale-keyboard repair over `core/keyboard/keyboard-reset-guard` |

The decisions are in `core/keyboard/`: `resolveKeyboardOwner` (who owns it),
`keyboardStep` (what a behaviour does this frame), `keyboardInContainer`,
`keyboardLift`, `contentArea`, `isInputInsideSheet`. Nothing here contains a
rule; it samples shared values and carries out what the core returns.

## Source

`useKeyboardContext().reanimated` — `height` is **negative**, pixels from the
window's bottom edge; `progress` runs 0 to 1 and tracks an interactive
dismiss frame by frame. `useReanimatedFocusedInput().input` is the focused
field's frame, `null` between a blur and the next focus. All three are
UI-thread shared values, which is why every reaction here is a
`useAnimatedReaction` and nothing crosses to JS.

`keyboardInContainer` subtracts `containerBottomOffset` — a frame that ends
above the window's bottom is overlapped by that much less — and the result
is the positive `keyboardHeight` the geometry reads.

## Ownership

`keyboardScope` picks the rule. `registered`: only a field that went through
`useBottomSheetTextInput` or `BottomSheet.TextInput`. `inside` (the default):
those, plus any focused input whose frame overlaps the sheet — the frame
comes from keyboard-controller, the sheet's top from `position`, and
`isInputInsideSheet` compares them in window space. `always`: every keyboard.

Ownership is **sticky through a transition**. The focused-input frame can
land a frame after `progress` starts, and it goes null the moment a field
blurs while the keyboard takes another quarter second to leave; without
stickiness the sheet would drop by the lift and chase the keyboard down. A
different focused input releases at once — that keyboard is someone else's
— and so does `progress` reaching zero. `resolveKeyboardOwner` is the rule,
with its tests.

The registration path is the reliable one. `ref` records the field's native
node, `onFocus` claims, and `onBlur` releases unless React Native's own focus
registry says another registered field already has focus — the check that
stops a tap from one field to the next reading as a close and a reopen.

## Behaviours

| `keyboardBehavior` | On show | `keyboardBlurBehavior: "restore"` on hide |
| --- | --- | --- |
| `interactive` (default) | Nothing — `keyboardLift` is a derivation over `progress`, so the sheet rides the keyboard up and follows an interactive dismiss down | Nothing to restore; `base` never moved |
| `extend` | `animateTo(highest, "keyboard")` | Back to the detent held before |
| `fillParent` | `animateTo(maxHeight, "keyboard")`; no lift; the body shrinks by the keyboard | Back to the detent held before |
| `none` | Nothing; the keyboard is not the sheet's problem | Nothing |

The behaviour reaction samples `progress` and `keyboardOwned` and hands two
consecutive samples to `keyboardStep`, which answers `apply`, `restore`,
`release` or nothing. A rise applies once; a fall restores once; an
interactive dismiss that turns back mid-way applies again. A finger on the
sheet owns `base`, so neither runs while a gesture is active — the release
settles wherever the finger left it.

`enableBlurKeyboardOnGesture` (default on) dismisses the keyboard the moment
a pan starts, and a pan that ends heading down dismisses it regardless; both
live in `gesture/use-sheet-pan.ts`, through `KeyboardController.dismiss` on
the JS thread.

## The stale-keyboard guard

On iOS `KeyboardProvider` writes its shared values on `keyboardWillShow` /
`keyboardWillHide` and nothing else, so a teardown that produces no
`willHide` — a native-stack pop over a focused field, an app suspend —
leaves them pinned open app-wide, and a sheet mounted into that would lift
for a keyboard that is not there. `reconcileKeyboardAnimation` snaps them to
closed when React Native's focus registry says nothing is focused; the sheet
runs it on every presentation, and `useKeyboardAnimationGuard` is the same
thing for a screen of your own. Same decision as `@delacour/react-native-ui`'s
guard, over the same core function, so the two never disagree.
