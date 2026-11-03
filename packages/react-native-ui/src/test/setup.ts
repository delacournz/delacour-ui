/**
 * Jest setup for render tests (`*.render.test.tsx`): stands in for every native
 * module the components reach, so a component renders in Node with no device.
 *
 * Listed in `setupFiles`. Ships through the registry as `test-setup` and is
 * added to a consumer's Jest config by `delacour add --tests`. A mock goes here
 * only when the library ships none of its own; prefer the library's.
 */
import { jest } from "@jest/globals";
import type { ReactNode } from "react";

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

/**
 * A Skia font with real numbers where a layout reads them — line metrics, and
 * a fixed advance per character — so an axis gutter or a label anchor resolves
 * to finite geometry. Anything else falls through to `mockDeepStub`.
 */
function mockFont(size = 12): unknown {
	const font: Record<string, unknown> = {
		getSize: () => size,
		getMetrics: () => ({ ascent: -size * 0.8, descent: size * 0.2, leading: 0 }),
		getGlyphIDs: (text: string) => Array.from(text, (_char, index) => index),
		getGlyphWidths: (ids: readonly number[]) => ids.map(() => size * 0.6),
		getTextWidth: (text: string) => text.length * size * 0.6,
		measureText: (text: string) => ({ x: 0, y: -size * 0.8, width: text.length * size * 0.6, height: size }),
	};
	return new Proxy(font, { get: (target, key) => (key in target ? target[key as string] : mockDeepStub()) });
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
	LayoutDirection: ({ children }: { children?: ReactNode }) => children,
}));

jest.mock("react-native-skia", () => {
	const { View } = require("react-native");
	const Draw = () => null;
	return {
		Canvas: View,
		Circle: Draw,
		DashPathEffect: Draw,
		Group: Draw,
		Line: Draw,
		LinearGradient: Draw,
		Path: Draw,
		Picture: Draw,
		Rect: Draw,
		RoundedRect: Draw,
		Shader: Draw,
		Text: Draw,
		Skia: mockDeepStub(),
		BlendMode: mockDeepStub(),
		ImageFormat: mockDeepStub(),
		PaintStyle: mockDeepStub(),
		StrokeCap: mockDeepStub(),
		StrokeJoin: mockDeepStub(),
		matchFont: (style?: { fontSize?: number }) => mockFont(style?.fontSize),
		usePathInterpolation: () => mockDeepStub(),
		vec: (x = 0, y = x) => ({ x, y }),
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
		LocationManager: {
			requestPermissions: async () => true,
			addListener: () => undefined,
			removeListener: () => undefined,
			getCurrentPosition: async () => null,
		},
	};
});
