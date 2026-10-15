# MessageScroller

A conversation list. Anchored at the newest message, it follows new messages while the reader is
there, leaves them alone once they have scrolled up, offers a jump back with an unread count, loads
older history at the top and rises with the keyboard. Compound root plus `MessageScroller.List`,
`.JumpButton`, `.DateSeparator`, `.UnreadDivider`, `.LoadingOlder` and `.Provider`, and a
`useMessageScrollerState` hook for driving another list.

`import { MessageScroller } from "@delacour/react-native-ui/message-scroller";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/message-scroller` |
| `message-scroller.tsx` | Root + the `Object.assign` surface: turns messages into rows, tracks which are new, guards `onLoadOlder` |
| `message-scroller-list.tsx` | `MessageScroller.List` — the `KeyboardAwareLegendList` wiring and the row dispatch |
| `message-scroller-jump-button.tsx` | `MessageScroller.JumpButton` — the floating pill and its count |
| `message-scroller-date-separator.tsx` | `MessageScroller.DateSeparator` |
| `message-scroller-unread-divider.tsx` | `MessageScroller.UnreadDivider` |
| `message-scroller-loading-older.tsx` | `MessageScroller.LoadingOlder` |
| `message-scroller.context.tsx` | The scroller context and the internal list context; `useMessageScroller()`, `useMessageScrollerPart()` |
| `message-scroller.types.ts` | Root, render-info, controller, state and jump-button prop types |
| `use-message-scroller-state.ts` | The scroll-tracking hook: at-end, unread count, controller, announcements |
| `message-scroller.utils.ts` | Pure: row building, stick and jump hysteresis, unread, older-page guard, announce coalescing, labels |
| `message-scroller.variants.ts` | `tv()` slots, jump motion and lift resolvers |
| `*.test.ts` | Both pure modules, written first |

## Design

- **It owns scroll behaviour, never a message's appearance.** Each message is the app's own, from
  `renderMessage`. The scroller imports no bubble, no attachment and no `Screen`; it hands
  `renderMessage` the message's `position` in its sender's run, which a bubble turns into corners.
  Run computation lives here and corner computation lives in the bubble, so neither repeats the
  other.
- **`MessageRunPosition` is restated, not imported.** A bubble declares the same
  `"single" | "first" | "middle" | "last"` union; the two are structurally interchangeable, so the
  position passes straight across without either folder importing the other.
- **Not inverted.** An inverted list draws newest-first and flips it with a transform, which leaves
  VoiceOver walking the conversation backwards, flips horizontal gestures on rows and makes prepend
  semantics backwards. LegendList's `alignItemsAtEnd` anchors to the bottom with the order intact.
- **LegendList, not a `ScrollView` or `FlatList`.** A conversation is the case virtualisation exists
  for, and LegendList's `maintainScrollAtEnd`, `maintainVisibleContentPosition` and
  `onStartReached` are exactly this component's job. A `ScrollView` cannot hold position on a
  prepend without measuring by hand.
- **`maintainVisibleContentPosition` is `{ data: true, size: false }`.** `data` keeps the viewport
  still when an older page prepends. `size` stays off for the reason `Screen.ChatList` gives: it
  reacts to the keyboard's animated inset and compounds against end anchoring.
- **Position is read on the UI thread.** The list writes its offset into a shared value
  (`sharedValues.scrollOffset`); a reaction derives "at the end" and the jump button's hysteresis
  there, and only a crossing of the end boundary is scheduled back to React. A scroll at 120 Hz
  costs React nothing.
- **The jump button has hysteresis.** It shows past 1.5 × `stickThreshold` and hides at
  `stickThreshold`; between the two it keeps what it was. One boundary flickers under a resting
  thumb.
- **Following at the end is LegendList's `maintainScrollAtEnd`, with our threshold.** The stick
  threshold is in points; LegendList's is a fraction of the viewport, so the hook converts it once
  the viewport has a height. Following animates unless motion is calm.
- **The viewer's own message always scrolls to the end**, even from deep history — sending is a
  request to see what you sent. It waits one frame so the new row is in the list's data before the
  scroll targets it, and animates only for a move under one viewport (`resolveFollowAnimation`).
- **`onLoadOlder` fires once per first key.** The list's start-reached callback fires again as
  momentum carries the reader back across the threshold; the guard keys on the first message, which
  the page that answers moves, so the next reach re-arms it. Nothing fires while `isLoadingOlder`.
- **The loading row has no height animation.** A tween during a prepend fights the visible-content
  anchoring and nudges the reader by its own height.
- **`isNew` is tracked during render, not in an effect.** The root keeps a baseline of keys and adds
  to it on anything but an append, using React's "store information from previous renders"
  pattern, so `isNew` is right on the render the row first appears in. An effect would render every
  arrival once as old, and the row's entrance would never run.
- **The list's classes go through `useResolveClassNames`, not `withUniwind`.** `Screen.ChatList`
  already wraps `KeyboardAwareLegendList`, and a third-party component is wrapped once, in one file.
- **The pill has a border and no shadow**, like every surface in this package: React Native's shadow
  props differ by platform, and the border already lifts it off the bubbles.
- **The jump button rises with the keyboard by the same amount the content does**:
  `bottomInset + max(0, |keyboardHeight| − keyboardOffset)`. Keyboard-controller reports the height
  as a negative translation, so the sign is dropped (`resolveJumpButtonLift`).
- **Hidden, the pill is untouchable and out of the accessibility tree.** Its opacity animates on the
  UI thread; its `pointerEvents` and `importantForAccessibility` follow through one React update per
  crossing.
- **Announcements coalesce.** An arrival from someone else while the reader is at the end is
  announced once; arrivals inside 1.5 s of the last announcement batch into "3 new messages". An
  arrival while scrolled up is not announced — the jump button's count carries it, and its badge is a
  polite live region on Android.
- **Date separators and the unread divider are headers**, so heading navigation walks the
  conversation a day at a time and lands on the divider.
- **The initial unread target is frozen at mount.** A divider that moves later must not drag the
  reader back to it.

## Using it with `Screen.ChatList`

`useMessageScrollerState({ keys, isOwn })` returns the same value the root builds. Spread its
`listRef` as `ref`, `sharedValues`, `onLayout`, `onContentSizeChange` and
`maintainScrollAtEndThreshold` onto the chat list, wrap both in `MessageScroller.Provider`, and
render `MessageScroller.JumpButton` beside it. Having `Screen.ChatList` adopt the hook itself is a
follow-up, not part of this component.

## Peers

`@legendapp/list` (optional peer, via `@legendapp/list/keyboard`), `react-native-keyboard-controller`,
`react-native-reanimated` and `react-native-worklets`. An app without LegendList fails at resolution
when it imports this subpath, the same as `Screen.ChatList`.

**Registry spike:** the builder classifies imports by package, so `@legendapp/list/keyboard`
normalises to `@legendapp/list`, already `expo` in `PACKAGE_INSTALL` — no explicit dependency list
needed.

## Verified on a device

iOS simulator (iPhone 17, dev client), 2026-10-05: opens at the end; a reply at the end is followed,
one while scrolled up is held and the jump button appears with its count; the button scrolls to the
end and leaves the accessibility tree; four older pages prepend down to the first message with the
viewport held (a ~4pt drift on landing); the unread divider and day separators draw; sending from
history scrolls to the end; with a measured `keyboardOffset` the newest message stays above the
keyboard. **Outstanding:** Android, VoiceOver walk order and announcements, and a 5,000-message
scroll.

- **The jump button's transform is two translations.** `withTiming` returns an animation
  descriptor, not a number; `withTiming(…) - lift` was NaN and the pill rendered nowhere while its
  accessibility node said "3 unread". Found on the simulator.
- **`keyboardOffset` must be the list's real distance from the screen's bottom.** Left at 0 for a
  list that ends above the bottom, the full keyboard lift scrolls every row out of a short list. The
  `keyboard` demo measures it with `measureInWindow`.

**Preview media.** Six demos are captured, each `align: "stretch"`. Three are clips: `basic`
(the hero) scrolls back through the history and returns to the end, `load-older` reaches the top,
pulls in a page and comes back down, and `jump-to-latest` scrolls up while replies arrive and taps
the button. `stick-to-bottom`, `date-separators` and `unread-divider` are stills.
`stick-to-bottom` stays a still because every press appends a message, so no flow can bring it back
to where the clip began. `jump-to-latest` keeps arriving for the same reason. Its seed therefore
ends on a run of Aria's messages in the same form as the arrivals, so the newest end has the same
shape whenever the clip loops.
