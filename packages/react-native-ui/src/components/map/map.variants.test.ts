import { describe, expect, test } from "bun:test";
import { declaredTokens } from "../../styles/theme-tokens.test";
import {
	buildMapStyle,
	hasInitialViewChanged,
	MAP_ACCESSIBILITY_LABEL,
	MAP_CAMERA_DURATION,
	MAP_CONTROLS_CORNERS,
	MAP_DEFAULT_BASEMAP,
	MAP_DEFAULT_ZOOM,
	MAP_LABEL_SIDES,
	MAP_LABEL_SIZES,
	MAP_LABEL_TONES,
	MAP_MARKER_ANCHORS,
	MAP_PIN_DIMENSIONS,
	MAP_PIN_SIZES,
	MAP_PIN_TONE_TOKENS,
	MAP_PIN_TONES,
	MAP_ROUTE_TOKEN,
	MAP_STYLE_TOKENS,
	mapPinPath,
	mapVariants,
	resolveCameraDuration,
	resolveHeadingRotation,
	resolveInitialCamera,
	resolveMapGestures,
	resolveMarkerAnchor,
	resolveMarkerOffset,
	resolvePinTipAnchor,
	resolveRouteDashArray,
	toStyleColor,
} from "./map.variants";
import { fitBoundsCamera } from "./map-geometry";

const TEXT_COLOR = /(^|\s)text-(?!(xs|sm|base|lg|xl|\dxl|center|left|right)\b)[a-z-]+/;

describe("resolveMarkerAnchor", () => {
	test("names the point of the marker that sits on the coordinate", () => {
		expect(resolveMarkerAnchor("center")).toEqual({ x: 0.5, y: 0.5 });
		expect(resolveMarkerAnchor("top")).toEqual({ x: 0.5, y: 0 });
		expect(resolveMarkerAnchor("bottom")).toEqual({ x: 0.5, y: 1 });
		expect(resolveMarkerAnchor("left")).toEqual({ x: 0, y: 0.5 });
		expect(resolveMarkerAnchor("right")).toEqual({ x: 1, y: 0.5 });
	});

	test("covers every anchor", () => {
		for (const anchor of MAP_MARKER_ANCHORS) {
			const { x, y } = resolveMarkerAnchor(anchor);
			expect(x).toBeGreaterThanOrEqual(0);
			expect(y).toBeLessThanOrEqual(1);
		}
	});
});

describe("resolvePinTipAnchor", () => {
	test("puts the pin's tip on the coordinate, wherever the pin sits in the marker", () => {
		const anchor = resolvePinTipAnchor({
			marker: { width: 120, height: 100 },
			pin: { x: 46, y: 64, width: 28, height: 36 },
		});
		expect(anchor).toEqual({ x: 0.5, y: 1 });
	});

	test("a pin under a popup anchors at the bottom of the whole marker", () => {
		const anchor = resolvePinTipAnchor({
			marker: { width: 200, height: 136 },
			pin: { x: 86, y: 100, width: 28, height: 36 },
		});
		expect(anchor).toEqual({ x: 0.5, y: 1 });
	});

	test("a pin above a label anchors part-way down", () => {
		const anchor = resolvePinTipAnchor({
			marker: { width: 80, height: 60 },
			pin: { x: 26, y: 0, width: 28, height: 36 },
		});
		expect(anchor).toEqual({ x: 0.5, y: 0.6 });
	});

	test("nothing measured is no anchor", () => {
		expect(resolvePinTipAnchor({ marker: { width: 0, height: 0 }, pin: { x: 0, y: 0, width: 0, height: 0 } })).toBe(
			undefined
		);
	});
});

describe("resolveMarkerOffset", () => {
	test("a centred anchor needs no offset", () => {
		expect(resolveMarkerOffset({ x: 0.5, y: 0.5 }, { width: 40, height: 60 })).toEqual([0, 0]);
	});

	test("a bottom anchor lifts the view by half its height", () => {
		expect(resolveMarkerOffset({ x: 0.5, y: 1 }, { width: 40, height: 60 })).toEqual([0, -30]);
	});

	test("a left anchor pushes the view right by half its width", () => {
		expect(resolveMarkerOffset({ x: 0, y: 0.5 }, { width: 40, height: 60 })).toEqual([20, 0]);
	});
});

describe("pin", () => {
	test("every tone names a fill and a dot the theme declares, in both variants", () => {
		for (const tone of MAP_PIN_TONES) {
			const { fill, dot } = MAP_PIN_TONE_TOKENS[tone];
			for (const variant of ["light", "dark"] as const) {
				expect(declaredTokens(variant).has(fill)).toBe(true);
				expect(declaredTokens(variant).has(dot)).toBe(true);
			}
		}
	});

	test("the dot is the fill's own foreground, so it reads in every theme", () => {
		expect(MAP_PIN_TONE_TOKENS.primary).toEqual({ fill: "primary", dot: "primary-foreground" });
		expect(MAP_PIN_TONE_TOKENS.destructive).toEqual({ fill: "destructive", dot: "destructive-foreground" });
	});

	test("md is bigger than sm, and both are taller than wide", () => {
		const { sm, md } = MAP_PIN_DIMENSIONS;
		expect(md.width).toBeGreaterThan(sm.width);
		for (const size of MAP_PIN_SIZES) {
			expect(MAP_PIN_DIMENSIONS[size].height).toBeGreaterThan(MAP_PIN_DIMENSIONS[size].width);
		}
	});

	test("the outline starts at the tip, bottom centre, and closes", () => {
		const path = mapPinPath(28, 36);
		expect(path.startsWith("M14 36")).toBe(true);
		expect(path.endsWith("Z")).toBe(true);
	});
});

describe("toStyleColor", () => {
	test("hex MapLibre reads passes through", () => {
		expect(toStyleColor("#3b82f6")).toBe("#3b82f6");
		expect(toStyleColor("#abc")).toBe("#abc");
	});

	test("eight-digit hex, which it does not, becomes rgba", () => {
		expect(toStyleColor("#3b82f680")).toBe("rgba(59, 130, 246, 0.502)");
		expect(toStyleColor("#000000ff")).toBe("rgba(0, 0, 0, 1)");
	});

	test("anything else is left alone", () => {
		expect(toStyleColor("rgb(1, 2, 3)")).toBe("rgb(1, 2, 3)");
		expect(toStyleColor(undefined)).toBeUndefined();
	});
});

describe("buildMapStyle", () => {
	const TOKENS = { background: "#fafafa", border: "#e4e4e7", muted: "#f4f4f5", mutedForeground: "#71717a" };
	type Paint = Record<string, unknown>;
	const layer = (style: ReturnType<typeof buildMapStyle>, id: string) =>
		style.layers.find((entry) => entry.id === id) as { paint?: Paint; layout?: Paint } | undefined;

	test("land is the page, water muted, roads the border, labels the muted foreground haloed in the page", () => {
		const style = buildMapStyle(TOKENS);
		expect(layer(style, "background")?.paint?.["background-color"]).toBe("#fafafa");
		expect(layer(style, "water")?.paint?.["fill-color"]).toBe("#f4f4f5");
		expect(layer(style, "road-major")?.paint?.["line-color"]).toBe("#e4e4e7");
		expect(layer(style, "place")?.paint?.["text-color"]).toBe("#71717a");
		expect(layer(style, "place")?.paint?.["text-halo-color"]).toBe("#fafafa");
	});

	test("reads its tiles and glyphs from the basemap, OpenFreeMap by default", () => {
		const style = buildMapStyle(TOKENS);
		expect(style.glyphs).toBe(MAP_DEFAULT_BASEMAP.glyphs);
		expect(style.sources.openmaptiles).toEqual({ type: "vector", url: MAP_DEFAULT_BASEMAP.tiles });
		expect(layer(style, "place")?.layout?.["text-font"]).toEqual([MAP_DEFAULT_BASEMAP.font]);

		const own = buildMapStyle(TOKENS, {
			font: "Inter Regular",
			glyphs: "https://x/{fontstack}/{range}",
			tiles: "https://x",
		});
		expect(own.sources.openmaptiles).toEqual({ type: "vector", url: "https://x" });
		expect(layer(own, "place")?.layout?.["text-font"]).toEqual(["Inter Regular"]);
	});

	test("an alpha token is written as rgba, which the style parser reads", () => {
		const style = buildMapStyle({ ...TOKENS, muted: "#f4f4f580" });
		expect(layer(style, "water")?.paint?.["fill-color"]).toBe("rgba(244, 244, 245, 0.502)");
	});

	test("a token that did not resolve drops its layers rather than painting them black", () => {
		const style = buildMapStyle({ ...TOKENS, muted: undefined });
		expect(layer(style, "water")).toBeUndefined();
		expect(layer(style, "background")).toBeDefined();
	});

	test("labels drop their halo, not themselves, when the page colour is missing", () => {
		const style = buildMapStyle({ ...TOKENS, background: undefined });
		expect(layer(style, "place")?.paint?.["text-halo-color"]).toBeUndefined();
		expect(layer(style, "place")?.paint?.["text-color"]).toBe("#71717a");
	});

	test("every layer id is unique", () => {
		const ids = buildMapStyle(TOKENS).layers.map((entry) => entry.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	test("reads tokens every theme declares", () => {
		for (const token of Object.values(MAP_STYLE_TOKENS)) {
			expect(declaredTokens("light").has(token)).toBe(true);
			expect(declaredTokens("dark").has(token)).toBe(true);
		}
	});
});

describe("resolveRouteDashArray", () => {
	test("solid by default", () => {
		expect(resolveRouteDashArray(false)).toBeUndefined();
	});

	test("dashes are in line widths, so one pattern holds at any weight", () => {
		expect(resolveRouteDashArray(true)).toEqual([2, 2]);
	});

	test("the default line colour is a token the theme declares", () => {
		expect(declaredTokens("light").has(MAP_ROUTE_TOKEN)).toBe(true);
	});
});

describe("resolveMapGestures", () => {
	test("interactive and flat by default", () => {
		expect(resolveMapGestures({ isInteractive: true, isRotatable: false })).toEqual({
			doubleTapHoldZoom: true,
			doubleTapZoom: true,
			dragPan: true,
			touchPitch: false,
			touchRotate: false,
			touchZoom: true,
		});
	});

	test("rotatable turns on rotation and tilt together", () => {
		const gestures = resolveMapGestures({ isInteractive: true, isRotatable: true });
		expect(gestures.touchRotate).toBe(true);
		expect(gestures.touchPitch).toBe(true);
	});

	test("not interactive turns everything off, rotation included", () => {
		expect(Object.values(resolveMapGestures({ isInteractive: false, isRotatable: true }))).toEqual(
			Array(6).fill(false)
		);
	});
});

describe("resolveCameraDuration", () => {
	test("defaults, honours a caller's, and jumps when motion is reduced", () => {
		expect(resolveCameraDuration(undefined, false)).toBe(MAP_CAMERA_DURATION);
		expect(resolveCameraDuration(250, false)).toBe(250);
		expect(resolveCameraDuration(250, true)).toBe(0);
		expect(resolveCameraDuration(-5, false)).toBe(0);
	});
});

describe("resolveHeadingRotation", () => {
	test("a heading is a rotation", () => {
		expect(resolveHeadingRotation(90)).toBe(90);
	});

	test("an unknown heading draws nothing", () => {
		expect(resolveHeadingRotation(-1)).toBeUndefined();
		expect(resolveHeadingRotation(Number.NaN)).toBeUndefined();
		expect(resolveHeadingRotation(undefined)).toBeUndefined();
	});
});

describe("resolveInitialCamera", () => {
	const SIZE = { width: 400, height: 300 };

	test("bounds win over a centre and zoom, framed for the view", () => {
		const bounds = [174, -42, 176, -40] as const;
		expect(resolveInitialCamera({ bounds, center: [0, 0], size: SIZE, zoom: 10 })).toEqual(
			fitBoundsCamera(bounds, SIZE)
		);
	});

	test("a centre and zoom, else the world at the default zoom", () => {
		expect(resolveInitialCamera({ center: [174.776, -41.286], size: SIZE, zoom: 12 })).toEqual({
			center: [174.776, -41.286],
			zoom: 12,
		});
		expect(resolveInitialCamera({ size: SIZE })).toEqual({ center: [0, 0], zoom: MAP_DEFAULT_ZOOM });
	});
});

describe("hasInitialViewChanged", () => {
	test("a re-render with the same view in new arrays is not a change", () => {
		expect(hasInitialViewChanged({ center: [1, 2], zoom: 3 }, { center: [1, 2], zoom: 3 })).toBe(false);
	});

	test("a new centre, zoom or box is", () => {
		expect(hasInitialViewChanged({ center: [1, 2] }, { center: [1, 3] })).toBe(true);
		expect(hasInitialViewChanged({ zoom: 3 }, { zoom: 4 })).toBe(true);
		expect(hasInitialViewChanged({ bounds: [0, 0, 1, 1] }, { bounds: [0, 0, 1, 2] })).toBe(true);
	});
});

describe("mapVariants", () => {
	test("the map is labelled", () => {
		expect(MAP_ACCESSIBILITY_LABEL).toBe("Map");
	});

	test("every corner pins the controls to it", () => {
		const expected = {
			"top-left": ["top-", "left-"],
			"top-right": ["top-", "right-"],
			"bottom-left": ["bottom-", "left-"],
			"bottom-right": ["bottom-", "right-"],
		} as const;
		for (const corner of MAP_CONTROLS_CORNERS) {
			const cls = mapVariants({ corner }).controls();
			expect(cls).toContain("absolute");
			for (const edge of expected[corner]) {
				expect(cls).toContain(edge);
			}
		}
	});

	test("the label's tone and size land on its text, never its pill", () => {
		for (const labelTone of MAP_LABEL_TONES) {
			for (const labelSize of MAP_LABEL_SIZES) {
				for (const labelSide of MAP_LABEL_SIDES) {
					const slots = mapVariants({ labelSide, labelSize, labelTone });
					expect(slots.label()).not.toMatch(TEXT_COLOR);
					expect(slots.labelText()).toMatch(TEXT_COLOR);
				}
			}
		}
		expect(mapVariants({ labelTone: "primary" }).labelText()).toContain("text-primary");
		expect(mapVariants({ labelTone: "muted" }).labelText()).toContain("text-muted-foreground");
	});

	test("the label keeps its distance from the pin on the side it sits", () => {
		expect(mapVariants({ labelSide: "bottom" }).label()).toContain("mt-");
		expect(mapVariants({ labelSide: "top" }).label()).toContain("mb-");
	});

	test("no view slot carries a text colour (rule 1)", () => {
		for (const corner of MAP_CONTROLS_CORNERS) {
			const slots = mapVariants({ corner });
			for (const cls of [slots.root(), slots.controls(), slots.marker(), slots.popup(), slots.popupCaret()]) {
				expect(cls).not.toMatch(TEXT_COLOR);
			}
		}
	});

	test("touches pass through the overlay layer to the map", () => {
		expect(mapVariants().overlay()).toContain("absolute");
		expect(mapVariants().overlay()).toContain("inset-0");
	});
});
