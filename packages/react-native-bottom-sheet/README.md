# @delacour/react-native-bottom-sheet

A headless bottom sheet engine for React Native — Gesture Handler for the
pans, Reanimated for the motion, keyboard-controller for the keyboard,
teleport for the portal.

No tokens, no `className`, no theme. Every radius, colour and inset is a
`style` you pass in. If you want a sheet already wearing a design system, use
[`@delacour/react-native-ui/bottom-sheet`](https://ui.delacour.co.nz/docs/native/components/bottom-sheet),
which is this engine with the tokens attached.

Documentation: [ui.delacour.co.nz/docs/bottom-sheet](https://ui.delacour.co.nz/docs/bottom-sheet).

> **Alpha.** This package, `@delacour/react-native-ui` and
> `@delacour/react-native-charts` publish to npm's `alpha` tag, and every alpha
> is also `latest`.

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
| `react-native-gesture-handler` | `>=3` | The handle and content pans, as gesture hooks |
| `react-native-reanimated` | `>=4` | Every animated value |
| `react-native-worklets` | `>=0.5` | `scheduleOnRN` from the UI thread |
| `react-native-keyboard-controller` | `>=1.18` | The only keyboard source — frame-accurate height and progress |
| `react-native-safe-area-context` | `>=5` | The bottom band under a sticky footer |
| `react-native-teleport` | `>=1.2` | The portal — the React tree stays put, so context reaches every part |

The package has no runtime dependencies of its own.

## Providers

Your app mounts four, in this order. The package renders only the last — a
nested gesture root is dead weight, and a nested `KeyboardProvider` is a
second keyboard that disagrees with the first.

```tsx
import { BottomSheetProvider } from "@delacour/react-native-bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { initialWindowMetrics, SafeAreaProvider } from "react-native-safe-area-context";

<GestureHandlerRootView style={{ flex: 1 }}>
  <SafeAreaProvider initialMetrics={initialWindowMetrics}>
    <KeyboardProvider>
      <BottomSheetProvider>{children}</BottomSheetProvider>
    </KeyboardProvider>
  </SafeAreaProvider>
</GestureHandlerRootView>;
```

`BottomSheetProvider` is the root host every sheet teleports to, so a sheet
draws over the navigator wherever it was written. Without it a `Portal`
renders where it is written, as an inline sheet.

## Anatomy

```tsx
import { BottomSheet } from "@delacour/react-native-bottom-sheet";

<BottomSheet snapPoints={["40%", "90%"]}>
  <BottomSheet.Trigger>
    <Text>Open</Text>
  </BottomSheet.Trigger>
  <BottomSheet.Portal>
    <BottomSheet.Overlay style={{ backgroundColor: "rgba(0,0,0,0.4)" }} />
    <BottomSheet.Container>
      <BottomSheet.Background style={{ backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16 }} />
      <BottomSheet.Handle style={{ alignItems: "center", paddingVertical: 12 }}>
        <View style={{ width: 36, height: 5, borderRadius: 3, backgroundColor: "#ccc" }} />
      </BottomSheet.Handle>
      <BottomSheet.Content style={{ padding: 16 }}>
        <BottomSheet.Title>Filters</BottomSheet.Title>
        <BottomSheet.Description>Narrow the list down.</BottomSheet.Description>
        <BottomSheet.TextInput placeholder="Search" />
        <BottomSheet.Close>
          <Text>Close</Text>
        </BottomSheet.Close>
      </BottomSheet.Content>
      <BottomSheet.Footer padding={16}>
        <Button title="Apply" onPress={apply} />
      </BottomSheet.Footer>
    </BottomSheet.Container>
  </BottomSheet.Portal>
</BottomSheet>;
```

`Container` is the panel that moves; `Content` is the static body inside it.
Swap the body for `BottomSheet.ScrollView`, `FlatList` or `SectionList` and
the list's content size becomes the sheet's own detent; swap it for
`BottomSheet.Steps` with a controller from `useSheetMachine` and the sheet's
height glides between the steps of a typed machine. `Footer` is sticky by
default, standing on the safe-area band and riding the keyboard's edge.
`<BottomSheet.Portal inline>` renders in place; `<BottomSheet.Host name>`
gives a native modal a target of its own; `detached` floats the sheet as a
card.

Sizing and behaviour — `snapPoints`, `dynamicSizing`, `maxDynamicContentSize`,
`keyboardBehavior`, `detached`, the haptic worklet props — are the root's.
Every part takes `style` and `ref`, and the parts that render text or a press
take `asChild` to hand their behaviour to an element of yours.

## The maths on its own

`@delacour/react-native-bottom-sheet/core` is every detent, keyboard, footer
and geometry calculation in the package, plus the step machine, importable
with no native module in the module graph:

```ts
import { defineSheetMachine, positionFor, UNMEASURED } from "@delacour/react-native-bottom-sheet/core";
```

## Licence

MIT
