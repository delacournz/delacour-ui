# Render tests

A component's render test is `{name}.render.test.tsx`, beside its source. It mounts the component
under Jest with `@testing-library/react-native` (RNTL v14) and asserts what a person — or a screen
reader — can observe. Class strings and pure resolvers are not its job; those live in the folder's
logic suites.

## Files

| File | What it is |
| --- | --- |
| `setup.ts` | Jest `setupFiles` entry: a stand-in for every native module the components reach |
| `render.tsx` | `renderWithProviders` — `render` inside `DelacourProvider` — and RNTL re-exported |

Jest needs three settings to run them, all in the package's Jest config: `preset: "jest-expo"`,
`resolver: "react-native-reanimated/jest/resolver"` and `setupFiles` naming `setup.ts`. **The resolver
is not optional.** Without it Reanimated and Worklets load their `.native` modules and every suite
dies at import with "`runOnUISync` is not supported on web".

RNTL's own guides ship in `node_modules/@testing-library/react-native/docs/` — read
`guides/llm-guidelines.md` there before writing a suite, since v14 differs from older examples.

## How a suite is written

```tsx
import { describe, expect, jest, test } from "@jest/globals";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Button } from "./button";

describe("Button", () => {
	test("an assistive activation calls onPress", async () => {
		const onPress = jest.fn();
		await renderWithProviders(<Button onPress={onPress}>Save</Button>);
		await fireEvent(screen.getByRole("button", { name: "Save" }), "accessibilityTap");
		expect(onPress).toHaveBeenCalledTimes(1);
	});
});
```

- **Import the globals from `@jest/globals`.** A render suite is Jest-only and says so; it never
  imports another runner's module.
- **Every `render`, `rerender`, `unmount` and `fireEvent` is awaited.** RNTL v14 made them async;
  an un-awaited one asserts against the tree before the update lands.
- **Render through `renderWithProviders`.** Every `Pressable` sits in a `GestureDetector`, which
  throws without the gesture root `DelacourProvider` mounts. An overlay adds `OverlayProvider` through
  `wrapper`; a direction test adds a `Direction` provider the same way. The wrapper you pass sits
  inside `DelacourProvider`.
- **Query by role, then label, then text.** `getByRole("button", { name })` →
  `getByLabelText` → `getByText` → `getByTestId` last. A component a role query cannot find is
  usually missing `accessible` or an `accessibilityRole` — fix the component, not the query.
- **Use RNTL's matchers.** `toBeOnTheScreen`, `toBeDisabled`, `toBeBusy`, `toBeChecked`,
  `toBeSelected`, `toBeExpanded`, `toHaveAccessibilityValue`, `toHaveTextContent`. `queryBy*` only
  for absence, with `.not.toBeOnTheScreen()`.

## Driving a control

**Touches go through Gesture Handler, and Jest has no touch system.** `userEvent.press` calls an
`onPress` prop on a host view, and these components have none: the `Animated.View` under a
`GestureDetector` receives touches natively. So a test drives a control the way an assistive
technology does, which is a real path every control must honour anyway:

| To | Fire |
| --- | --- |
| Activate (iOS VoiceOver double-tap) | `fireEvent(el, "accessibilityTap")` |
| Activate (Android TalkBack) | `fireEvent(el, "accessibilityAction", { nativeEvent: { actionName: "activate" } })` |
| Step an adjustable (`Slider`, `NumberInput`) | `accessibilityAction` with `increment` / `decrement` |
| Long press | `accessibilityAction` with `longpress` |
| Type | `fireEvent.changeText(input, "text")`, or `userEvent.type` on a real `TextInput` |
| Scroll | `fireEvent.scroll(scrollable, { nativeEvent: … })` |

A behaviour that only a drag can reach — a `Sortable` reorder, a `Swipe` reveal — is driven with
Gesture Handler's `fireGestureHandler` from `react-native-gesture-handler/jest-utils`, which needs the
gesture to carry `.withTestId(...)`. Add one to the component when the test needs it; that is a
legitimate change. If a behaviour still cannot be reached, test what can and say so in a comment
above the `describe`.

## What every suite covers

1. **It renders** with its minimum props, and its accessible name and role are right.
2. **Accessibility state** — `disabled`, `checked`, `selected`, `expanded`, `busy`, and
   `accessibilityValue` for anything with a value.
3. **Callbacks** — each public `on*` prop fires with the documented arguments, and does **not** fire
   when disabled or busy.
4. **Controlled and uncontrolled** — `defaultX` seeds it and it changes itself; with `x` it reports
   through `onXChange` and waits for the prop (`rerender`) before the tree changes.
5. **Compound parts** — each public part renders inside its root, and a part used outside its root
   throws its documented error — `await expect(renderWithProviders(…)).rejects.toThrow(…)`, with
   `console.error` silenced for that test by swapping it for a no-op and restoring it after.
6. **Variants that change semantics** — not class strings, but anything that changes what is
   announced or what is interactive.

What a suite does **not** do: snapshot the tree, assert `className`, assert animation frames or
spring values, or test a native module's behaviour through its mock.

## Mocks

`setup.ts` mocks a module only when the module ships no Jest mock of its own. The ones it uses
from the libraries themselves: Reanimated's `setUpTests()`, Gesture Handler's `jestSetup`, Safe Area
Context's `jest/mock`, Keyboard Controller's `jest` entry and Teleport's `jest` entry. Skia, Pulsar,
Uniwind, Maplibre, `expo-linear-gradient` and `expo-blur` are stubbed by hand — drawing primitives
render nothing, and `useCSSVariable` returns `undefined`, so a component must already tolerate a
token that has not resolved.

A suite needing a module that is not mocked fails at import with the module's own native error
("`TurboModuleRegistry.getEnforcing(...)` … could not be found"). Add the mock to `setup.ts`, inside
the `jest.mock` factory; a helper the factory calls must be named `mock…`, or Jest's hoisting guard
refuses it.

<!-- registry:omit -->
The reference suites are `button/button.render.test.tsx` (press, disabled, busy, group),
`switch/switch.render.test.tsx` (controlled and uncontrolled, accessibility actions) and
`dialog/dialog.render.test.tsx` (overlay wrapper, trigger, close, controlled open). Run one with
`bunx jest src/components/<name>` from this package, all with `bun run test:render`.
`src/render-tests.test.ts` fails for a component folder with no render test and not on its pending list.
<!-- /registry:omit -->
