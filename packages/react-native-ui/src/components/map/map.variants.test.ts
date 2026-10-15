import { describe, expect, test } from "bun:test";
import { declaredTokens } from "../../styles/theme-tokens.test";
import {
	ANDROID_MAP_STYLE_TOKENS,
	buildAndroidMapStyle,
	hasInitialViewChanged,
	MAP_ACCESSIBILITY_LABEL,
	MAP_CAMERA_DURATION,
	MAP_CONTROLS_CORNERS,
	MAP_LABEL_SIDES,
	MAP_LABEL_SIZES,
	MAP_LABEL_TONES,
	MAP_MARKER_ANCHORS,
	MAP_PIN_DIMENSIONS,
	MAP_PIN_SIZES,
	MAP_PIN_TONE_TOKENS,
	MAP_PIN_TONES,
	MAP_ROUTE_TOKEN,
	mapPinPath,
	mapVariants,
	resolveCameraDuration,
	resolveHeadingRotation,
	resolveInitialRegion,
	resolveMapGestures,
	resolveMarkerAnchor,
	resolveMarkerCenterOffset,
	resolvePinTipAnchor,
	resolveRouteDashPattern,
	resolveUserInterfaceStyle,
	withAlpha,
} from "./map.variants";
import { centerZoomToRegion } from "./map-geometry";

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

describe("resolveMarkerCenterOffset", () => {
	test("a centred anchor needs no offset", () => {
		expect(resolveMarkerCenterOffset({ x: 0.5, y: 0.5 }, { width: 40, height: 40 })).toEqual({ x: 0, y: 0 });
	});

	test("a bottom anchor lifts the view by half its height", () => {
		expect(resolveMarkerCenterOffset({ x: 0.5, y: 1 }, { width: 28, height: 36 })).toEqual({ x: 0, y: -18 });
	});

	test("a left anchor pushes the view right by half its width", () => {
		expect(resolveMarkerCenterOffset({ x: 0, y: 0.5 }, { width: 40, height: 20 })).toEqual({ x: 20, y: 0 });
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

describe("withAlpha", () => {
	test("full opacity is the colour untouched", () => {
		expect(withAlpha("#3b82f6", 1)).toBe("#3b82f6");
	});

	test("appends an alpha byte to a six-digit hex", () => {
		expect(withAlpha("#3b82f6", 0.5)).toBe("#3b82f680");
		expect(withAlpha("#3b82f6", 0)).toBe("#3b82f600");
	});

	test("expands a short hex first", () => {
		expect(withAlpha("#abc", 0.5)).toBe("#aabbcc80");
	});

	test("multiplies an alpha the colour already has", () => {
		expect(withAlpha("#3b82f680", 0.5)).toBe("#3b82f640");
	});

	test("rewrites rgb as rgba", () => {
		expect(withAlpha("rgb(1, 2, 3)", 0.25)).toBe("rgba(1, 2, 3, 0.25)");
	});

	test("clamps, and passes an unknown notation through rather than guessing", () => {
		expect(withAlpha("#000000", 2)).toBe("#000000");
		expect(withAlpha("oklch(0.5 0.1 200)", 0.5)).toBe("oklch(0.5 0.1 200)");
		expect(withAlpha(undefined, 0.5)).toBeUndefined();
	});
});

describe("buildAndroidMapStyle", () => {
	const TOKENS = { background: "#fafafa", border: "#e4e4e7", muted: "#f4f4f5", mutedForeground: "#71717a" };

	test("water is muted, land the page, roads the border, labels the muted foreground", () => {
		const style = buildAndroidMapStyle(TOKENS);
		const colorOf = (featureType: string, elementType: string) =>
			style.find((rule) => rule.featureType === featureType && rule.elementType === elementType)?.stylers;

		expect(colorOf("water", "geometry")).toEqual([{ color: "#f4f4f5" }]);
		expect(colorOf("landscape", "geometry")).toEqual([{ color: "#fafafa" }]);
		expect(colorOf("road", "geometry")).toEqual([{ color: "#e4e4e7" }]);
		expect(colorOf("all", "labels.text.fill")).toEqual([{ color: "#71717a" }]);
		expect(colorOf("all", "labels.text.stroke")).toEqual([{ color: "#fafafa" }]);
	});

	test("drops the alpha byte Google's styler cannot read", () => {
		const style = buildAndroidMapStyle({ ...TOKENS, muted: "#f4f4f5ff" });
		expect(JSON.stringify(style)).toContain('"#f4f4f5"');
		expect(JSON.stringify(style)).not.toContain("#f4f4f5ff");
	});

	test("a token that did not resolve leaves that feature on the basemap's own colour", () => {
		const style = buildAndroidMapStyle({ ...TOKENS, muted: undefined });
		expect(style.some((rule) => rule.featureType === "water")).toBe(false);
		expect(style.some((rule) => rule.featureType === "landscape")).toBe(true);
	});

	test("reads tokens every theme declares", () => {
		for (const token of Object.values(ANDROID_MAP_STYLE_TOKENS)) {
			expect(declaredTokens("light").has(token)).toBe(true);
			expect(declaredTokens("dark").has(token)).toBe(true);
		}
	});
});

describe("resolveRouteDashPattern", () => {
	test("solid by default", () => {
		expect(resolveRouteDashPattern(false, 3)).toBeUndefined();
	});

	test("dashes scale with the stroke so they stay dashes at any width", () => {
		expect(resolveRouteDashPattern(true, 3)).toEqual([6, 6]);
		expect(resolveRouteDashPattern(true, 6)).toEqual([12, 12]);
	});

	test("the default line colour is a token the theme declares", () => {
		expect(declaredTokens("light").has(MAP_ROUTE_TOKEN)).toBe(true);
	});
});

describe("resolveMapGestures", () => {
	test("interactive and flat by default", () => {
		expect(resolveMapGestures({ isInteractive: true, isRotatable: false })).toEqual({
			pitchEnabled: false,
			rotateEnabled: false,
			scrollEnabled: true,
			zoomEnabled: true,
		});
	});

	test("rotatable turns on rotation and tilt together", () => {
		expect(resolveMapGestures({ isInteractive: true, isRotatable: true })).toEqual({
			pitchEnabled: true,
			rotateEnabled: true,
			scrollEnabled: true,
			zoomEnabled: true,
		});
	});

	test("not interactive turns everything off, rotation included", () => {
		expect(resolveMapGestures({ isInteractive: false, isRotatable: true })).toEqual({
			pitchEnabled: false,
			rotateEnabled: false,
			scrollEnabled: false,
			zoomEnabled: false,
		});
	});
});

describe("resolveUserInterfaceStyle", () => {
	test("follows the active theme, not the system", () => {
		expect(resolveUserInterfaceStyle("dark")).toBe("dark");
		expect(resolveUserInterfaceStyle("light")).toBe("light");
		expect(resolveUserInterfaceStyle(undefined)).toBe("light");
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

describe("resolveInitialRegion", () => {
	test("bounds win over a centre and zoom", () => {
		const region = resolveInitialRegion({ aspect: 1, bounds: [174, -42, 176, -40], center: [0, 0], zoom: 10 });
		expect(region.longitude).toBe(175);
		expect(region.latitude).toBe(-41);
	});

	test("a centre and zoom, else the world at zoom 2", () => {
		expect(resolveInitialRegion({ aspect: 1, center: [174.776, -41.286], zoom: 12 })).toEqual(
			centerZoomToRegion([174.776, -41.286], 12, 1)
		);
		expect(resolveInitialRegion({ aspect: 1 })).toEqual(centerZoomToRegion([0, 0], 2, 1));
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
