# @delacour/react-native-bottom-sheet

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
