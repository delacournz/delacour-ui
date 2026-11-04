/**
 * Jest setup for render tests (`*.render.test.tsx`): stands in for every native
 * module the components reach, so a component renders in Node with no device.
 *
 * Listed in `setupFiles`. Ships through the registry as `test-setup` and is
 * added to a consumer's Jest config by `delacour add --tests`. A mock goes here
 * only when the library ships none of its own; prefer the library's.
 *
 * Only modules every copy of the kit can count on are mocked here. A module only some
 * components bring — Skia, MapLibre, a gradient — has its own file under `mocks/`, its own
 * registry item, and reaches a project only with a component that needs it: a `jest.mock` of a
 * module that is not installed fails every suite at load.
 */
import { jest } from "@jest/globals";
import type { ReactNode } from "react";

jest.mock("react-native-worklets", () => ({
	...jest.requireActual<Record<string, unknown>>("react-native-worklets"),
	getUIRuntimeHolder: () => ({}),
}));

require("react-native-reanimated").setUpTests();
require("react-native-gesture-handler/jestSetup");

/**
 * React Native's Jest mock leaves `AppState.currentState` a mock function, which
 * reads as "not active": anything that pauses in the background (a toast's
 * auto-dismiss clock) would never run. A test runs in the foreground.
 */
Object.defineProperty(require("react-native").AppState, "currentState", { configurable: true, value: "active" });

jest.mock("react-native-safe-area-context", () => require("react-native-safe-area-context/jest/mock").default);
jest.mock("react-native-keyboard-controller", () => require("react-native-keyboard-controller/jest"));
jest.mock("react-native-teleport", () => require("react-native-teleport/jest"));
/**
 * Teleport's mock draws a portal where it is written, inside the app content `OverlayProvider` hides
 * from screen readers while a modal is up. This tells the provider so, and it leaves the app visible,
 * as a device's teleport host does for the modal. The symbol is `overlay-teleport.ts`'s
 * `TELEPORT_INLINE`.
 */
(globalThis as unknown as Record<symbol, unknown>)[Symbol.for("delacour.overlay.teleportInline")] = true;
jest.mock("uniwind", () => ({
	withUniwind: <T>(component: T): T => component,
	useResolveClassNames: () => ({}),
	useCSSVariable: (name: string | string[]) => (Array.isArray(name) ? name.map(() => undefined) : undefined),
	useUniwind: () => ({ theme: "light", hasAdaptiveThemes: true }),
	Uniwind: { setTheme: () => undefined, currentTheme: "light", hasAdaptiveThemes: true },
	LayoutDirection: ({ children }: { children?: ReactNode }) => children,
}));
