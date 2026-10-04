---
"@delacour/react-native-ui": minor
---

`BottomSheet` is rewritten on `@delacour/react-native-bottom-sheet`, this repository's own headless engine, with the same compound shape — `Trigger`, `Portal`, `Overlay`, `Container`, `Content`, `ScrollView`, `Footer`, `Close`, `Title`, `Description` — and eight new parts: `Background`, `Handle`, `FlatList`, `SectionList`, `LegendList`, `TextInput`, `Steps` / `Step`, `Host` and `Provider`. `@gorhom/bottom-sheet` is no longer imported anywhere; its peer entry leaves in the next release.

**Install.** The engine is an optional peer, like `@delacour/react-native-charts`: `bun add @delacour/react-native-bottom-sheet@alpha` and `expo install react-native-teleport`, then rebuild the dev client — teleport is a native module and needs the new architecture. `delacour add bottom-sheet` does both.

**Provider.** `DelacourProvider` no longer mounts a sheet provider. Mount `BottomSheetProvider` from `@delacour/react-native-ui/bottom-sheet` once, inside `DelacourProvider` and around the navigator. Without it a `Portal` renders where it is written, as an inline sheet.

**Renamed and moved props.** The engine's names win, and sizing and behaviour move from `Container` to the root:

- `<BottomSheet.Container enableDynamicSizing={false} snapPoints={…} maxDynamicContentSize={…}>` → `<BottomSheet dynamicSizing={false} snapPoints={…} maxDynamicContentSize={…}>`. `Container` takes `className`, `style` and the three `*ClassName` props only.
- `keyboardBehavior`, `keyboardBlurBehavior`, `enablePanDownToClose`, `enableOverDrag` and the other gorhom modal props move to the root under the same names; `android_keyboardInputMode` is gone (keyboard-controller owns the window). New on the root: `keyboardScope`, `detached`, `topInset`, `bottomInset` (defaults to the safe-area bottom), `stackBehavior`, `closeOnBack`, `keepMounted`, `animation`, `onSnapPointHaptic` / `onCloseHaptic` / `onOverDragHaptic`.
- `<BottomSheet.Overlay isCloseOnPress={false}>` → `<BottomSheet.Overlay pressBehavior="none">`. Omitting `Overlay` still draws no scrim.
- `BottomSheet.ScrollView` no longer needs `dynamicSizing={false}` or `snapPoints`: a list's content size is the dynamic snap point, capped by `maxDynamicContentSize`.
- `BottomSheetHandle` (the ref type) is now `BottomSheetRef`; the old name is a deprecated alias. `useBottomSheetInput()` stays as an alias of the engine's `useBottomSheetTextInput()`. `resolveSheetBottomInset` / `resolveSheetScrollEndPadding` are re-exported from the engine's `./core`.
- Removed: `BOTTOM_SHEET_KEYBOARD_DEFAULTS`, `resolveFooterPlacement`, and the container and portal contexts.
