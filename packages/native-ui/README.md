# @delacour/native-ui

A React Native component library. Styling is
[Uniwind](https://github.com/kirillzyusko/uniwind) — Tailwind v4 for React
Native; interaction is Reanimated and Gesture Handler; haptics are Pulsar.

The package **ships raw `.tsx` with no build step.** Uniwind's transform has to
run inside the consuming app's Metro pipeline, so a precompiled build would
arrive with its classNames already dead.

## Install

```bash
bun add @delacour/native-ui
```

Native modules are **peer dependencies**, because two copies of a native module
register twice and break at runtime. Install the ones you need:

```
react  react-native  react-native-gesture-handler  react-native-reanimated
react-native-worklets  react-native-safe-area-context  react-native-svg
react-native-keyboard-controller  react-native-pulsar  @gorhom/bottom-sheet
tailwindcss  uniwind
@central-icons-react-native/round-outlined-radius-1-stroke-1.5
```

Two are **optional** — you only need them if you import what depends on them:

| Peer | Needed for |
| --- | --- |
| `expo-router` | `@delacour/native-ui/expo/navigation-theme` |
| `@legendapp/list` | `Screen.LegendList` and `Screen.ChatList` |

Granular exports are what make that safe: an app that never imports a subpath
never makes Metro resolve its peers.

## Setup

**1. Styles.** In your app's `global.css`:

```css
@import '@delacour/native-ui/styles';
@source '../../../../packages/native-ui/src';
```

Use the real workspace path, not a `node_modules` one — Bun symlinks workspace
packages and Tailwind's scanner cannot follow symlinks, so classes would be
silently dropped from production builds.

**2. Provider.** Wrap the app's root:

```tsx
import { DelacourProvider } from "@delacour/native-ui/provider";

<DelacourProvider>{children}</DelacourProvider>;
```

That is the gesture root every `Pressable` needs above it, the safe-area provider
and keyboard provider `Screen` reads, the bottom-sheet modal provider, and the
keyboard state sync that keeps them honest.

## Usage

There is **no package-wide barrel.** Import from the subpath:

```tsx
import { Button } from "@delacour/native-ui/button";
import { Icon } from "@delacour/native-ui/icon";
import { IconArrowRight } from "@delacour/native-ui/icons/central";

// The icon inherits the button's size and its variant's colour.
<Button haptic="selection" onPress={next}>
  <Button.Label>Continue</Button.Label>
  <Icon icon={IconArrowRight} />
</Button>;
```

## Components

| Component | Import | |
| --- | --- | --- |
| Accordion | `@delacour/native-ui/accordion` | Selection modes, measured panels, indicators |
| Badge | `@delacour/native-ui/badge` | Variants, colours, sizes, dismiss |
| BottomSheet | `@delacour/native-ui/bottom-sheet` | Overlay, snap points, sticky footer, keyboard |
| Button | `@delacour/native-ui/button` | Variants, sizes, icons, loading |
| Checkbox | `@delacour/native-ui/checkbox` | Colours, sizes, indeterminate, groups |
| Field | `@delacour/native-ui/field` | Form layout, grouping, state cascade |
| Icon | `@delacour/native-ui/icon` | Central Icons, with inherited size and colour |
| Input | `@delacour/native-ui/input` | Variants, sizes, prefix and suffix |
| ListGroup | `@delacour/native-ui/list-group` | Grouped rows, dividers, slots |
| Pressable | `@delacour/native-ui/pressable` | Gestures, haptics, `asChild` |
| Radio | `@delacour/native-ui/radio` | Groups, selection, sizes, orientation |
| Screen | `@delacour/native-ui/screen` | Navbar, footer, scrollables, keyboard |
| Separator | `@delacour/native-ui/separator` | Orientations, insets, weight |
| Slider | `@delacour/native-ui/slider` | Range, orientation, colours, steps |
| Spinner | `@delacour/native-ui/spinner` | Sizes, colours, custom glyphs |
| Switch | `@delacour/native-ui/switch` | Drag or tap, colours, sizes, end content |
| Tabs | `@delacour/native-ui/tabs` | Variants, sizes, swipe, scrolling |
| Text | `@delacour/native-ui/text` | Type scale, presets, inline nesting |
| DelacourProvider | `@delacour/native-ui/provider` | The app's root layer stack |

Also exported: `hooks/*`, `lib/*`, `expo/navigation-theme`, `icons/central`, and
the `styles/*` CSS entries.

## Theming

Tokens are CSS variables under `@variant light` / `@variant dark`. Components
reference semantic names — `bg-background`, `text-muted-foreground` — never a raw
palette colour or a `dark:` prefix. For a prop needing a colour *value* rather
than a class, use `useThemeColor`.

## Documentation

[`AGENTS.md`](AGENTS.md) is the reference — the rules, the patterns, and the
reasoning behind each decision. Each component has its own alongside its source
in [`src/components`](src/components).
