---
"@delacour/react-native-ui": minor
"@delacour/react-native-charts": minor
---

Move every gesture to Gesture Handler 3's hooks, on Expo SDK 58

Both libraries now need `react-native-gesture-handler` 3 or newer — the version Expo SDK 58 bundles —
and their peer range says so. `Pressable`, `Switch`, `Slider`, `Rating`, `Tabs`, the chart scrub and the
pie's slice tap are built on `usePanGesture`, `useTapGesture`, `useLongPressGesture` and
`useSimultaneousGestures` instead of the `Gesture.Pan()` builder. What you see and feel is unchanged, with
one fix: a press whose tap is cancelled — the finger slid off, or another gesture won — no longer fires
`onPress`.

Two public types change with it:

- `useTabsMotion().panGesture` is a Gesture Handler 3 `PanGesture`. Relate a horizontal scroller inside a
  panel to it with the hook API:

  ```diff
  - const native = useMemo(() => Gesture.Native().blocksExternalGesture(panGesture), [panGesture]);
  + const native = useNativeGesture({ block: panGesture });
  ```

- `useScrubGesture({ blocks })` takes a Gesture Handler 3 gesture, and returns a `PanGesture` (or `null`).

`react-native-ui` also reads React Native 0.88's generated types: `ScreenScrollViewRef` and the
`Input` ref are `ComponentRef<typeof ScrollView>` and `ComponentRef<typeof TextInput>`, which name the
same instances on older React Natives too.
