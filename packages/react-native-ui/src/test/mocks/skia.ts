/** Skia, drawn as nothing: a `Canvas` is a `View` and every primitive renders null. A setup file, beside `setup.ts`. */
import { jest } from "@jest/globals";
import { mockDeepStub } from "../mock-stub";

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
