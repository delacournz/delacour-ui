# @delacour/react-native-bottom-sheet

## 0.3.0

### Minor Changes

- [#278](https://github.com/delacournz/delacour-ui/pull/278) [`d2c5481`](https://github.com/delacournz/delacour-ui/commit/d2c54818db2e1348dfd97596d995324c8e60cd57) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - `BottomSheet` takes `keyboardLiftLimit="highestSnapPoint"`: the keyboard lifts the sheet no higher than its highest snap point, so a sheet resting there holds still and its body shrinks by the keyboard instead. `Combobox` opens at its full height with it, so its sheet no longer opens half-height, jumps up when the search field's keyboard rises, and drops back as the keyboard leaves on close. `resolveComboboxSheetHeight` takes only `topInset` and `windowHeight` now.

- [#262](https://github.com/delacournz/delacour-ui/pull/262) [`9876ccb`](https://github.com/delacournz/delacour-ui/commit/9876ccbfd6e9dffe801c8c1269cd58818dd4e44f) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - `BottomSheet` takes `keyboardLiftLimit`. Set to `"maxDynamicContentSize"`, a sheet sized to its content is lifted by a keyboard only as far as its cap, decided on the UI thread from the keyboard's first frame. `Select` opts in, so a searchable select no longer shoots to the top of the screen when the keyboard opens and then settles back to its cap.

### Patch Changes

- [#269](https://github.com/delacournz/delacour-ui/pull/269) [`16f8413`](https://github.com/delacournz/delacour-ui/commit/16f8413724b5468cc2d22a9391ee8a43b9fbc7be) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - `Combobox` keeps its keyboard up while the results scroll; only a drag that carries the sheet down, or a close, puts it away. The sheet's scrollables now take a caller's `keyboardDismissMode` instead of always using `interactive`.

- [#284](https://github.com/delacournz/delacour-ui/pull/284) [`839fdc5`](https://github.com/delacournz/delacour-ui/commit/839fdc5c9547835ffe59304f847db1d207e2ab84) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Components no longer pass dependency arrays to Reanimated's `useAnimatedStyle`, `useDerivedValue`, `useAnimatedReaction` and `useAnimatedScrollHandler`. Reanimated ignores them on native and warned once per app in development: "Dependencies should only be used on the web and are always ignored on native". Nothing changes at runtime; the worklets still rebuild from their closures.

## 0.2.0

### Minor Changes

- [#226](https://github.com/delacournz/delacour-ui/pull/226) [`c6f3e76`](https://github.com/delacournz/delacour-ui/commit/c6f3e76b1f0a421d09107793dea1acfcb3c18361) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Move to Expo SDK 58: React Native 0.88, React 19.3, Gesture Handler 3

  The peer floors are now `react-native >=0.88` and `react-native-gesture-handler >=3.3`. React Native
  0.88 types its components through the strict API by default, so every ref is typed as the host
  instance it receives — `ViewInstance`, `TextInputInstance`, `ScrollViewInstance` — rather than as
  the component, and `ScreenScrollViewRef` is now `ScrollViewInstance`. Those types do not exist
  before 0.88. The sheet's and the drawer's pans keep the builder API under Gesture Handler 3's
  `LegacyPanGesture` type. The CLI's
  `verify:expo` scaffolds against SDK 58.

## 0.1.0

### Minor Changes

- [#116](https://github.com/delacournz/delacour-ui/pull/116) [`e9ef1d4`](https://github.com/delacournz/delacour-ui/commit/e9ef1d4055a8159c5edab24658d03bedd6057b6f) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - First alpha of `@delacour/react-native-bottom-sheet`, the headless bottom sheet engine `@delacour/react-native-ui`'s `BottomSheet` is built on. Snap points and dynamic sizing in height space, handle, content and scrollable pans, over-drag, pan-down-to-close, a backdrop, keyboard behaviours driven by `react-native-keyboard-controller`, a sticky footer counted in the dynamic snap point, `ScrollView` / `FlatList` / `SectionList` bodies, a teleport portal with `BottomSheetProvider` and `BottomSheet.Host`, detached sheets, a typed step machine (`defineSheetMachine`, `BottomSheet.Steps`), an imperative ref and worklet haptic callbacks. Pure geometry ships from `./core`. No `className`, no tokens; Fabric only.

- [#118](https://github.com/delacournz/delacour-ui/pull/118) [`77e6f73`](https://github.com/delacournz/delacour-ui/commit/77e6f73efca451681d4a34c83825f7f0c0865564) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Detents are snap points everywhere, matching the `snapPoints` prop. `DetentSpec` is `SnapPointSpec`, `onDetentHaptic` is `onSnapPointHaptic`, `useBottomSheetAnimated()`'s `detents` is `snapPoints`, the internal `detentCount` is `snapPointCount`, and the core helpers follow (`normalizeSnapPoints`, `parseSnapPoint`, `dynamicSnapPoint`, `crossedSnapPoint`, `snapPointUnder`). The handle's accessibility value reads "Snap point 1 of 2". The docs page moves to `/docs/bottom-sheet/snap-points`.

### Patch Changes

- [#120](https://github.com/delacournz/delacour-ui/pull/120) [`033b774`](https://github.com/delacournz/delacour-ui/commit/033b7743238fbdc3fa2aef46f1c2613cf78f4a5f) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `OverlayProvider`, the layer every overlay is drawn on

  `@delacour/react-native-ui/overlay` mounts the one teleport host that overlays and bottom sheets
  share, and a registry that orders them in bands — every overlay above every sheet, an anchored
  panel above the dialog that opened it, a toast above both — and gives Android's back button to the
  topmost overlay only. `Overlay.Portal`, `Overlay.Scrim`, `useOverlayPresence` (keeps an overlay
  mounted through its exit animation) and `useOverlayBackHandler` are exported for building more.
  `BottomSheetProvider` now detects an `OverlayProvider` above or below it and mounts teleport's
  provider only once; the engine's provider takes `hasPortalProvider` to make that possible.
  `bunx delacour add overlay` copies it into a project.
