# accessibility

What a modal sheet asks of a screen reader, kept out of the parts so each part only
reads a ref or a flag.

## Files

| Path | What |
| --- | --- |
| `use-sheet-accessibility.ts` | `useSheetAccessibility` — the modal and escape flags from core's `resolveSheetModalAccessibility`, and focus in and out on the settled index; `focusSheetTarget` |

## Rules

- **Pure rules live in core.** `resolveSheetModalAccessibility` and `firstFocusTarget` are in
  `core/modal-accessibility.ts`, tested without a renderer. This folder only touches React Native.
- **Focus is `sendAccessibilityEvent(node, "focus")`**, never `setAccessibilityFocus` (deprecated)
  or `findNodeHandle`.
- **Focus moves on settled transitions**, not on the intent: the index leaving `-1` is the sheet
  having arrived, the index returning to `-1` is it having gone. Both come from the settle
  listener, so a close interrupted by a re-open never moves focus.
- **On Android the return to the trigger waits 120ms** (`ANDROID_RESTORE_FOCUS_DELAY_MS`). The settle that sets the index to `-1` also unmounts the sheet, and a skin hides the app behind a modal sheet until that commit reaches the native tree; focus sent in the same commit targets a trigger TalkBack cannot see yet. A re-open inside the wait cancels it. iOS restores at once.
- **Refs are read when focus moves**, so a `Title` that mounts after the root is still found, and
  a `Trigger` that has unmounted (its ref is `null`) is skipped.
- **A non-modal sheet moves no focus** and holds nothing; see the root's `modal` prop.
- The engine cannot import `@delacour/react-native-ui`, so this mirrors the skin package's
  `useModalAccessibility` rather than calling it. The two must keep the same rules.
