/**
 * Jest setup for render tests (`*.render.test.tsx`): stands in for every native
 * module the components reach, so a component renders in Node with no device.
 *
 * Listed in `setupFiles`. Ships through the registry as `test-setup` and is
 * added to a consumer's Jest config by `delacour add --tests`. A mock goes here
 * only when the library ships none of its own; prefer the library's.
 */
import { jest } from "@jest/globals";

/**
 * A value every property read and call of which returns another such value:
 * enough for a module whose results feed native code a test never reaches
 * (`Presets.System.selection()`, `Skia.Path.Make().addCircle(...)`).
 */
function mockDeepStub(): unknown {
	const target = () => undefined;
	const handler: ProxyHandler<() => undefined> = {
		get: (_target, key) => (key === "then" ? undefined : mockDeepStub()),
		apply: () => mockDeepStub(),
	};
	return new Proxy(target, handler);
}

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
jest.mock("react-native-pulsar", () => ({
	Presets: mockDeepStub(),
	Settings: mockDeepStub(),
	useRealtimeComposer: () => mockDeepStub(),
	usePatternComposer: () => mockDeepStub(),
	useAdaptiveHaptics: () => mockDeepStub(),
	HapticSupport: {},
	RealtimeComposerStrategy: {},
}));

jest.mock("uniwind", () => ({
	withUniwind: <T>(component: T): T => component,
	useResolveClassNames: () => ({}),
	useCSSVariable: (name: string | string[]) => (Array.isArray(name) ? name.map(() => undefined) : undefined),
	useUniwind: () => ({ theme: "light", hasAdaptiveThemes: true }),
	Uniwind: { setTheme: () => undefined, currentTheme: "light", hasAdaptiveThemes: true },
	LayoutDirection: { LTR: "ltr", RTL: "rtl" },
}));

jest.mock("react-native-skia", () => {
	const { View } = require("react-native");
	const Draw = () => null;
	return {
		Canvas: View,
		Circle: Draw,
		DashPathEffect: Draw,
		Group: Draw,
		Path: Draw,
		Picture: Draw,
		Rect: Draw,
		RoundedRect: Draw,
		Shader: Draw,
		Skia: mockDeepStub(),
	};
});

jest.mock("expo-linear-gradient", () => ({ LinearGradient: require("react-native").View }));
jest.mock("expo-blur", () => ({ BlurView: require("react-native").View }));

jest.mock("@maplibre/maplibre-react-native", () => {
	const { createElement, forwardRef, useImperativeHandle } = require("react");
	const { View } = require("react-native");
	const mockHost = (name: string) => {
		const Host = forwardRef((props: Record<string, unknown>, ref: unknown) => {
			useImperativeHandle(ref, () => mockDeepStub());
			return createElement(View, { ...props, testID: props.testID ?? `maplibre-${name}` });
		});
		Host.displayName = `MapLibre.${name}`;
		return Host;
	};
	return {
		Map: mockHost("Map"),
		Camera: mockHost("Camera"),
		Marker: mockHost("Marker"),
		GeoJSONSource: mockHost("GeoJSONSource"),
		Layer: mockHost("Layer"),
		LocationManager: mockDeepStub(),
	};
});
