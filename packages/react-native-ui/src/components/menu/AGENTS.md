# Menu

A list of **verbs** dropped from a control that exists to open it — a ⋯ button,
a toolbar item. Rename, duplicate, share, delete. A menu is not a select: its
rows run actions, they never become the trigger's value. Compound root plus
`Menu.Trigger`, `Menu.Content`, `Menu.Background`, `Menu.Label`, `Menu.Item`,
`Menu.CheckboxItem`, `Menu.RadioGroup`, `Menu.RadioItem`, `Menu.Separator`,
`Menu.Sub`, `Menu.SubTrigger` and `Menu.SubContent`.

`import { Menu } from "@delacour/react-native-ui/menu";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/menu` |
| `menu.tsx` | Root — `useMenuRootValue` into `MenuRootProvider`; the `Object.assign` |
| `menu-trigger.tsx` | `Menu.Trigger` — measures itself and toggles; `asChild` donates the press |
| `menu-content.tsx` | `Menu.Content` — the transparent `Modal`, the outside-tap layer, the placed and animated panel, the scroller |
| `menu-background.tsx` | `Menu.Background` — the `bg-popover` surface behind the scroller |
| `menu-label.tsx` | `Menu.Label` — a section heading |
| `menu-item.tsx` | `MenuRow`, the row every row is built on, and `Menu.Item` |
| `menu-checkbox-item.tsx` | `Menu.CheckboxItem` |
| `menu-radio-group.tsx` | `Menu.RadioGroup` — holds the value |
| `menu-radio-item.tsx` | `Menu.RadioItem` |
| `menu-separator.tsx` | `Menu.Separator` — `Separator` with `my-1` |
| `menu-sub.tsx` | `Menu.Sub` — the submenu's open state, `progress` and measured height |
| `menu-sub-trigger.tsx` | `Menu.SubTrigger` — the row with the turning chevron |
| `menu-sub-content.tsx` | `Menu.SubContent` — the measured clip |
| `menu.context.tsx` | The menu, submenu and radio-group contexts; `useMenu`, `useMenuRootValue`, `MenuRootProvider` |
| `menu.types.ts` | `MenuItemProps`, shared by every row |
| `menu.variants.ts` | The slotted `tv()`, the constants and the pure resolvers — no RN imports |
| `menu.variants.test.ts` | Placement (flip, cap, clamp, RTL, the zero-size anchor), width, close rules, accessibility, tokens |

## The panel

- **It is a minimal anchored panel built here, not a Popover.** There is no
  Popover in the package yet. `Menu.Content` renders inside a transparent RN
  `Modal` — top-most layer, Android back through `onRequestClose`, screen-reader
  containment — so it needs no new peer. **When Popover lands, Menu.Content moves
  onto it and `resolveMenuPlacement` moves with it.** The resolver is exported
  for exactly that.
- **Placement takes a rect, never a ref.** `resolveMenuPlacement({ anchor, content,
  window, insets, placement, align, offset, isRTL })` places against
  `{ x, y, width, height }`, so a zero-size point — ContextMenu's long-press —
  goes through the same arithmetic with no special case, and a test proves it.
- **Flip, then cap.** The requested side wins when the content fits; otherwise
  the other side if it fits there; otherwise the larger side, and `maxHeight`
  caps it so the rows scroll. Room is measured inside the safe area plus an 8pt
  margin, and the panel is clamped horizontally inside the same bounds. `align`
  start and end swap under RTL.
- **Measure, place, show.** The panel's first frame is at opacity 0; the
  scroller's `onContentSizeChange` reports the rows' height, placement runs with
  it, and only then does the enter start — there is no jump.
- **The side is locked for the visit.** A submenu expanding mid-visit must not
  flip the panel under the finger. A panel above the anchor is positioned by
  its **bottom** edge (`MenuPlacementResult.bottom`), so it grows upward, away
  from the anchor, with nothing re-placed; past the cap the rows scroll.
- **Its surface is `bg-popover`, never `bg-overlay`.** `overlay` is the
  translucent scrim colour (`oklch(0 0 0 / 45%)`); a panel in it is a
  see-through card. `hasScrim` (ContextMenu sets it) draws `bg-overlay` behind
  the panel, fading with it.
- **The shadow is on an outer layer with no clip.** iOS clips a shadow to a
  clipping view's bounds, so `panel` casts `shadow-lg` and the inner `content`
  slot carries the corner, the hairline and `overflow-hidden`.
- **A caller's `Menu.Background` is lifted out by type** and drawn behind the
  scroller, so it stays put while the rows scroll. The default is drawn when
  there is none.
- **Enter 160ms, exit 120ms**, opacity with a 0.96 scale from the anchor's side.
  React Native has no animatable transform origin on both platforms, so
  `resolveMenuOrigin` approximates it with a translate that falls to zero as the
  panel arrives. Under reduced motion it is opacity alone — the panel still
  appears, so the information is not lost. The `Modal` unmounts when the exit's
  timing finishes; a reopen mid-exit cancels it and runs the enter instead.
- **Gesture Handler needs its own root inside a `Modal`.** On Android a `Modal`
  is a separate window the app's root view cannot see into, so every tap in the
  panel would be dead. `Menu.Content` wraps its tree in a `GestureHandlerRootView`.

## Rows

- **One row, `MenuRow`, under every row kind.** `Menu.Item`, `CheckboxItem`,
  `RadioItem` and `SubTrigger` are `MenuRow` with a `kind`, a leading override
  and an `accessibilityState`. Four hand-rolled rows would be four press fills
  that drift.
- **The press fill is the row's background.** An absolute `bg-accent` layer
  (`bg-destructive-soft` on a destructive row) fades in over 90ms and out over
  160ms while the row dips to 0.98 — one shared value for both. There is no
  wash or ripple on top. A row is built on its own Gesture Handler tap rather
  than `Pressable`, because `Pressable` owns its `pressed` value privately and
  the fill has to read it.
- **Under reduced motion the fill snaps and the scale does not run.** The
  scale is movement and goes; the fill is colour, and it is what says the tap
  landed, so it stays — instantly.
- **A tap that travels is a scroll.** The tap fails past 10pt
  (`MENU_TAP_MAX_DISTANCE`), so a long menu scrolls without choosing the row the
  finger started on.
- **Rows take `ViewProps`, not `PressableProps`.** The spec sketched
  `Omit<PressableProps, …>`, but a row ignores `feedback`, `asChild`, `busy` and
  the rest; a type that accepts props it drops is a quiet bug. `isDisabled` is
  the row's own.
- **Close rules live in one resolver.** `resolveCloseOnSelect(kind, explicit?)`:
  item and radio close, checkbox and sub-trigger stay open; an explicit
  `isClosedOnSelect` wins. `resolveRadioNext` pins that re-choosing a selected
  radio keeps it — a radio never clears.
- **A checkbox's tick and a radio's mark take the leading icon column**, so the
  labels of every row line up; an `icon` on those rows moves to the trailing
  edge. `isInset` reserves the same column on a plain row, and on a `Menu.Label`.
- **The icon column is 18pt, `size-icon-md`.** The spec named `size-icon-sm`,
  which is 16pt in `tokens.css`; the 18pt it also named wins, since that is the
  footprint `isInset` and the label's `ps-[42px]` (12 + 18 + 12) are built on.
- **Haptics are the root's `haptic`, played on select**, from the tap's worklet,
  and off by default.

## Submenus

- **They expand in place, never fly out.** A phone has no room beside the
  panel, and a second layer over the first hides where the user came from.
  `Menu.SubContent` is `Collapsible.Content`'s measured clip — restated, not
  imported, so `delacour add menu` copies one folder — and `MENU_SUB_SPRING` is
  `Collapsible`'s spring.
- **The chevron turns 90° off the submenu's own `progress`**, so it and the
  height cannot drift. Under RTL it is mirrored with `scaleX: -1` on a wrapper
  view, so it points to the trailing edge and still turns downward; the
  rotation lives on the inner view.
- **Nothing on the JS thread reads `contentHeight.value`** — the accordion's
  Release-build bug. "Measured" is React state.

## State

- **`isOpen` / `defaultOpen` / `onOpenChange` through `useControllableState`**,
  in `useMenuRootValue`. `open(anchor?)` opens at a rect, or measures the
  trigger first; `close()`; `toggle()`. Callbacks are ref-backed so the context
  keeps its identity.
- **A controlled open is measured too.** A parent flipping `isOpen` to `true`
  without a trigger press still gets the trigger measured, by an effect that
  tells such an open from one `open()` started.
- **`Menu.Trigger asChild` donates the press**, `BottomSheet.Trigger`'s rule: a
  `Button` wrapped in a pressable trigger would win the touch and the menu
  would never open. The child gets `onPress`, the measured ref and the
  accessibility props through `Slot`.

## Accessibility

- Content: `accessibilityRole="menu"`, `accessibilityViewIsModal`.
- Rows: `accessibilityRole="menuitem"`; checkbox → `checked`, radio →
  `selected`, sub-trigger → `expanded`, all → `disabled`. One source:
  `resolveMenuItemAccessibility`, a discriminated union on `kind`.
- Trigger: `accessibilityState={{ expanded }}`, hint "Opens a menu".
- A closed submenu is out of the accessibility tree, not just clipped.

## Reuse contract for ContextMenu

ContextMenu renders this component's rows and panel rather than a copy:

- **Import leaves, never `../menu`.** `../menu/menu-item` (`MenuRow`,
  `MenuItem`), `../menu/menu-content`, `../menu/menu.context` and
  `../menu/menu.variants` are each importable on their own. None imports
  `./menu`, so no cycle can close (rule 3).
- **Drive the state with your own anchor.** Build a value with
  `useMenuRootValue(...)`, wrap your tree in `MenuRootProvider`, and call
  `open({ x, y, width: 0, height: 0 })` from the long-press. Or pass
  `anchor` straight to `Menu.Content`.
- **`hasScrim`** tints the screen behind the panel; **`iconPlacement="trailing"`**
  puts a row's icon at its end.

## Out of scope

- **`presentation="bottom-sheet"`.** Importing `../bottom-sheet` would force the
  optional sheet engine and `react-native-teleport` on every Menu consumer. A
  follow-up.
- **Keyboard navigation and focus return on web.**
- **Typeahead, and rows that open a second panel.**
