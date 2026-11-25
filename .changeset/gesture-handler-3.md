---
"@delacour/react-native-ui": minor
"@delacour/react-native-charts": minor
"@delacour/react-native-bottom-sheet": minor
---

Move every gesture to Gesture Handler 3's hooks, on Expo SDK 58

All three libraries now need `react-native-gesture-handler` 3 or newer — the version Expo SDK 58 bundles —
and their peer range says so. Every gesture in `react-native-ui` — `Pressable`, `Switch`, `Slider`, `Rating`, `Tabs`,
`Carousel`, `Calendar`, `Compare`, `ColorPicker`, `ContextMenu`, `Drawer`, `FlipCard`, `Flow`, `ImageViewer`,
`Marquee`, `Menu`, `NumberInput`, `Planner`, `ProgressButton`, `SectionRail`, `Signature`, `Sketch`,
`SlideButton`, `Sortable`, `SplitView`, `Splitter`, `StackCard`, `Swipe`, `Toast` and `CircularText` — the chart
scrub and the pie's slice tap, and the bottom-sheet engine's handle and content pans, are built on Gesture
Handler 3's hooks (`usePanGesture`, `useTapGesture`, `useLongPressGesture`, `usePinchGesture`, `useManualGesture`
and the `useSimultaneousGestures` / `useExclusiveGestures` / `useCompetingGestures` compositions) instead of the `Gesture.Pan()` builder.
What you see and feel is unchanged, with one fix: a press whose tap is cancelled — the finger slid off, or another gesture won — no longer fires
`onPress`.

Two public types change with it:

- `useTabsMotion().panGesture` is a Gesture Handler 3 `PanGesture`. Relate a horizontal scroller inside a
  panel to it with the hook API:

  ```diff
  - const native = useMemo(() => Gesture.Native().blocksExternalGesture(panGesture), [panGesture]);
  + const native = useNativeGesture({ block: panGesture });
  ```

- `useScrubGesture({ blocks })` takes a Gesture Handler 3 gesture, and returns a `PanGesture` (or `null`).
- `Calendar`'s `yearListBlocksGesture` takes a Gesture Handler 3 `PanGesture` — the bottom-sheet engine's
  `pans.content`, as `DatePicker` already passes it.
- `Input.Group` takes a `testID`, set on its box. A `Pressable`'s tap is `${testID}-press` to Gesture
  Handler's test utilities, so a render test can press a touch-only row or box.
- The bottom-sheet engine's `SheetPans` are `PanGesture`s, and its scrollables relate to the content pan with
  `useNativeGesture({ simultaneousWith })`.
