# @delacour/react-native-bottom-sheet

A headless bottom sheet engine for React Native — Gesture Handler for the
pans, Reanimated for the motion, keyboard-controller for the keyboard,
teleport for the portal.

No tokens, no `className`, no theme. Every radius, colour and inset is a
`style` you pass in. If you want a sheet already wearing a design system, use
[`@delacour/react-native-ui/bottom-sheet`](https://ui.delacour.co.nz/docs/native/components/bottom-sheet),
which is this engine with the tokens attached.

> **Alpha.** This package, `@delacour/react-native-ui` and
> `@delacour/react-native-charts` publish to npm's `alpha` tag, and every alpha
> is also `latest`. The engine is being built in phases; until the React layer
> lands, only `@delacour/react-native-bottom-sheet/core` has exports.

## Install

```bash
bun add @delacour/react-native-bottom-sheet@alpha
bunx expo install react-native-gesture-handler react-native-reanimated react-native-worklets react-native-keyboard-controller react-native-safe-area-context react-native-teleport
```

The native peers go through `expo install`, so the SDK picks versions it can
build; `react` and `react-native` are already in any app.

**Fabric only, dev client only.** `react-native-teleport` moves native views
between hosts, which needs the new architecture — the default since React
Native 0.76 and the only architecture in Expo SDK 53 and later. It is a native
module, so it does not run in Expo Go: build a dev client
(`npx expo run:ios`, or an EAS development build) and rebuild it after
installing.

| Peer | Range | Why |
| --- | --- | --- |
| `react` | `>=19` | Ref-as-prop |
| `react-native` | `>=0.81` | Fabric `getBoundingClientRect` |
| `react-native-gesture-handler` | `>=2.28` | The handle and content pans |
| `react-native-reanimated` | `>=4` | Every animated value |
| `react-native-worklets` | `>=0.5` | `scheduleOnRN` from the UI thread |
| `react-native-keyboard-controller` | `>=1.18` | The only keyboard source — frame-accurate height and progress |
| `react-native-safe-area-context` | `>=5` | The bottom band under a sticky footer |
| `react-native-teleport` | `>=1.2` | The portal — the React tree stays put, so context reaches every part |

Your app needs a `GestureHandlerRootView`, a `SafeAreaProvider` and a
`KeyboardProvider` at its root, and a `BottomSheetProvider` from this package
wherever sheets should draw over the navigator. This package renders none of
the first three — a nested root is dead weight, and a nested
`KeyboardProvider` is a second, disagreeing keyboard.

## The maths on its own

`@delacour/react-native-bottom-sheet/core` is every detent, keyboard, footer
and geometry calculation in the package, importable with no native module in
the module graph:

```ts
import { positionFor, UNMEASURED } from "@delacour/react-native-bottom-sheet/core";
```

## Licence

MIT
