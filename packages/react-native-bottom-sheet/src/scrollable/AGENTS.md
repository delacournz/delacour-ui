# scrollable

A `ScrollView`, `FlatList` or `SectionList` as the sheet's body, and the
factory that makes one out of any animated scrollable.

## Files

| Path | What |
| --- | --- |
| `scrollable.types.ts` | `BottomSheetScrollableProps` (`focusHook`), `FocusHook`, `ScrollableHandle`, the inner shape the wrapper is written against, and the restated generic component types |
| `create-bottom-sheet-scrollable.tsx` | `createBottomSheetScrollable(AnimatedComponent, type)` — the two detectors, the lock, the clip and the clamp, the trailing spacer, content size, registration |
| `bottom-sheet-scroll-view.tsx` | `BottomSheet.ScrollView` over `Animated.ScrollView` |
| `bottom-sheet-flat-list.tsx` | `BottomSheet.FlatList` over `Animated.FlatList`, generic in `ItemT` |
| `bottom-sheet-section-list.tsx` | `BottomSheet.SectionList` over a module-scope `createAnimatedComponent(SectionList)`, generic in `ItemT, SectionT` |

The UI-thread half — the scroll handler, the lock reaction and the animated
props — is `gesture/use-scroll-lock.ts`, beside the pan it cooperates with.
The numbers are `core/scroll/`: `shouldLockScroll`, `listDragHeight`,
`listOwnsRelease`, `scrollLockTarget`.

## How a list and the sheet share a finger

The content pan and the list's native scroll are **simultaneous**: the list's
`Native` gesture is declared `simultaneousWithExternalGesture(pans.content)`,
so both see every touch. The rule for who moves is the sheet's state:

- **Below the highest snap point — locked.** Every scroll event is answered with
  `scrollTo(ref, 0, scrollLockedAt, false)` and the offset the pan reads is
  pinned there, so the list consumes nothing and the pan moves the sheet. The
  indicator is hidden, `bounces` is off and `decelerationRate` is `0`, so a
  fling has no momentum for the lock to fight.
- **At the highest snap point — unlocked.** The list scrolls. The pan treats the
  offset the list *began* the gesture with as a budget the finger spends
  downward before the sheet moves (`listDragHeight`): the list scrolls
  one-for-one under the same finger, so it reaches its top exactly as the
  budget runs out and the sheet takes over from there. Upward, the clamp at
  `highest` means the list scrolls and bounces rather than the sheet
  over-dragging.
- **A release while scrolled at the top** belongs to the list
  (`listOwnsRelease`): the velocity is the list's momentum, not a snap. The
  library this replaces snapped here and hopped a snap point under interrupted
  scrolls.

The budget is the offset at the *start* of the gesture, never the live one.
The live offset was tried first: the pan and the scroll event for one touch
move land in the same frame in no fixed order, and when the pan ran first the
sheet dipped a pixel, the lock engaged and the list froze where it was. A
fixed budget cannot race anything. A list held by the lock — scrolled, and
below the top — has no budget until the sheet reaches the top this gesture
(`listHeld` in `use-sheet-pan.ts`), the previous engine's
`isScrollablePositionLocked` under another name.

The lock's target is taken when the lock engages, by any path — a drag, a
`snapToIndex`, a keyboard — as `max(0, offset)`. A pull-down from the top
locks at `0`; a handle drag on a scrolled list holds the rows where they are.

## Sizing

The list fills the body to the sheet's bottom line: its `maxHeight` follows
`contentArea + bodyInset` on the UI thread, exactly as `Content`'s layout box
does. What the footer or the safe-area band would cover is reserved *inside*
the content, as a trailing spacer — appended to a `ScrollView`'s children,
composed after the consumer's `ListFooterComponent` on a `FlatList` or
`SectionList` — the height of the geometry's `bodyInset`, so the rows scroll
under the footer or the band and the last row can still be brought fully clear
of them. The spacer is animated because the band collapses as the keyboard
rises, and `contentContainerStyle` cannot be; `scrollIndicatorInsets.bottom`
follows the same value through the lock's `animatedProps`, so the indicator
ends where the rows stop being visible. The outer view clips to `bodyClip`,
which under a footer is the footer's live top edge.

The list must not shrink to that clip. A React Native scrollable ships
`flexShrink: 1`, and Yoga shrank it to the wrapper — the footer's top — so
the spacer's clearance landed on top of the wrapper's and the last row stopped
a whole footer above the footer. `flexShrink: 0` on the list leaves
`maxHeight` as its only bound. A `marginBottom` of the footer's height was the
earlier answer and is gone: it ended the list above the footer with the rows
cut at that edge and an empty band under them.

`onContentSizeChange`, less the spacer's own measured height
(`scrollContentHeight`), writes `contentHeight`, which is the dynamic snap point's
measurement. A `BottomSheet.ScrollView` of forty rows therefore needs neither
`snapPoints` nor `dynamicSizing={false}`: it sizes to its rows, capped by
`maxDynamicContentSize`, and scrolls inside that. The content size and the
spacer's layout arrive as two events from one commit; both are held in refs
and folded into a single write after the batch, because the first open
resolves on whatever `contentHeight` says first and the mount animation, once
running, ignores a corrected snap point list — a frame of rows-plus-spacer would
open the sheet a footer too tall. `contentHeight` goes back to `UNMEASURED` on
unmount for the same reason `useMeasureHeight` resets it.

## The factory's contract

The component handed to `createBottomSheetScrollable` must already be
animated, and must be made **once at module scope** — `Animated.ScrollView`,
`Animated.FlatList`, or `Animated.createAnimatedComponent(X)` in a module
body. The wrapper drives it with `animatedProps` and an animated `onScroll`;
a component created inside a render is a new type every frame and remounts
its subtree.

The wrapper is written once against the props every React Native scrollable
shares (`ScrollableInnerProps`) and passes the rest through. The built-ins
cast back to a generic signature so `data` and `renderItem` keep checking
against each other — the same move `Screen.FlatList` makes in
`@delacour/react-native-ui`.

`contentContainerStyle` reaches the list flattened to one object. A
virtualised list measures its content container, and an array style makes
that measurement lag the layout by a frame.

The consumer's `onScroll`, `onScrollBeginDrag`, `onScrollEndDrag` and
`onMomentumScrollEnd` are called on the JS thread through `scheduleOnRN` with
the event the worklet saw; they cannot be worklets of their own.

`focusHook` defaults to `useEffect`. Under React Navigation pass
`useFocusEffect`, and a list on a screen that is not showing withdraws from
the sheet.

## Out of scope

Refresh control. `refreshControl` and `onRefresh` pass through untouched, but
a pull-to-refresh at the top of a locked list fights the sheet's own
pull-down, and no rule for that is written yet.
