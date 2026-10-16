import type { StyleSpecification, SymbolLayerSpecification } from "@maplibre/maplibre-react-native";
import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";
import type { LngLat, LngLatBounds } from "./map.types";
import { fitBoundsCamera } from "./map-geometry";

/** Which point of a marker sits on its coordinate. */
export const MAP_MARKER_ANCHORS = ["center", "top", "bottom", "left", "right"] as const;

/** Where `Map.Controls` sits. */
export const MAP_CONTROLS_CORNERS = ["top-left", "top-right", "bottom-left", "bottom-right"] as const;

/** A pin's colour — the theme's primary, its foreground, or destructive. */
export const MAP_PIN_TONES = ["primary", "default", "destructive"] as const;

export const MAP_PIN_SIZES = ["sm", "md"] as const;

/** Which side of the pin a label keeps its distance from. */
export const MAP_LABEL_SIDES = ["top", "bottom"] as const;

export const MAP_LABEL_SIZES = ["sm", "md"] as const;

export const MAP_LABEL_TONES = ["default", "muted", "primary"] as const;

export type MapMarkerAnchor = (typeof MAP_MARKER_ANCHORS)[number];
export type MapControlsCorner = (typeof MAP_CONTROLS_CORNERS)[number];
export type MapPinTone = (typeof MAP_PIN_TONES)[number];
export type MapPinSize = (typeof MAP_PIN_SIZES)[number];
export type MapLabelSide = (typeof MAP_LABEL_SIDES)[number];
export type MapLabelSize = (typeof MAP_LABEL_SIZES)[number];
export type MapLabelTone = (typeof MAP_LABEL_TONES)[number];

/** A point in a view's unit square — `{ x: 0.5, y: 1 }` is bottom centre. */
export type MapAnchorPoint = { x: number; y: number };

/** What the map view is announced as. */
export const MAP_ACCESSIBILITY_LABEL = "Map";

/** How long a camera move takes when the caller names no duration, in ms. */
export const MAP_CAMERA_DURATION = 600;

/** How far one press of a zoom control moves — one step of the tile pyramid. */
export const MAP_ZOOM_STEP = 1;

/** What a map shows when it is given neither a centre nor a box. */
export const MAP_DEFAULT_ZOOM = 2;

/** The colour token a route, an arc and a pin take unless told otherwise. */
export const MAP_ROUTE_TOKEN = "primary";

/**
 * A pin's fill and the dot punched in its head. The dot is the fill's own
 * foreground, so it holds its contrast in every theme without a second choice.
 */
export const MAP_PIN_TONE_TOKENS: Record<MapPinTone, { fill: string; dot: string }> = {
	primary: { fill: "primary", dot: "primary-foreground" },
	default: { fill: "foreground", dot: "background" },
	destructive: { fill: "destructive", dot: "destructive-foreground" },
};

/** A pin's box in points. Taller than wide: a round head and a tip. */
export const MAP_PIN_DIMENSIONS: Record<MapPinSize, { width: number; height: number }> = {
	sm: { width: 20, height: 26 },
	md: { width: 28, height: 36 },
};

/**
 * A pin's outline in its own box: a round head the full width, narrowing to a
 * tip at bottom centre. The path starts at the tip, because the tip is the
 * point the marker anchors on.
 */
export function mapPinPath(width: number, height: number): string {
	const r = width / 2;
	const cx = r;
	const cy = r;
	// Where the head's circle hands over to the straight sides running to the
	// tip, about 40° below the horizontal on each side.
	const shoulderY = cy + r * 0.64;
	const shoulderDx = r * 0.77;

	return [
		`M${cx} ${height}`,
		`L${cx - shoulderDx} ${shoulderY}`,
		`A${r} ${r} 0 1 1 ${cx + shoulderDx} ${shoulderY}`,
		"Z",
	].join(" ");
}

/** The unit-square point a named anchor stands for. */
export function resolveMarkerAnchor(anchor: MapMarkerAnchor): MapAnchorPoint {
	switch (anchor) {
		case "center":
			return { x: 0.5, y: 0.5 };
		case "top":
			return { x: 0.5, y: 0 };
		case "bottom":
			return { x: 0.5, y: 1 };
		case "left":
			return { x: 0, y: 0.5 };
		case "right":
			return { x: 1, y: 0.5 };
	}
}

type Size = { width: number; height: number };
type Frame = Size & { x: number; y: number };

/**
 * The anchor that lands a pin's tip on the coordinate, wherever the pin sits
 * inside the marker — under a popup, above a label, or alone.
 *
 * This is what lets a marker hold a pin and a label, or a pin with a popup over
 * it, without the caller computing an offset: the marker anchors on the tip of
 * the pin it measured rather than on its own bottom edge. `undefined` until both
 * have been measured.
 */
export function resolvePinTipAnchor({ marker, pin }: { marker: Size; pin: Frame }): MapAnchorPoint | undefined {
	if (marker.width <= 0 || marker.height <= 0 || pin.width <= 0 || pin.height <= 0) return undefined;

	return { x: (pin.x + pin.width / 2) / marker.width, y: (pin.y + pin.height) / marker.height };
}

/**
 * The anchor as a shift in points, for a marker placed by its centre.
 *
 * MapLibre takes a named anchor and a pixel `offset`, not a point in the unit
 * square, so a pin's tip — which can sit anywhere in its marker — is reached by
 * centring the marker and moving it. Positive moves right and down, so a
 * bottom anchor is a lift of half the view's height.
 */
export function resolveMarkerOffset(anchor: MapAnchorPoint, size: Size): [x: number, y: number] {
	return [(0.5 - anchor.x) * size.width, (0.5 - anchor.y) * size.height];
}

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/**
 * A theme colour as the style spec reads it.
 *
 * Uniwind hands theme colours to JavaScript as hex. MapLibre parses three- and
 * six-digit hex but not eight, so a token carrying alpha is rewritten as
 * `rgba()` rather than drawn opaque or not at all. Any other notation passes
 * through untouched.
 */
export function toStyleColor(color: string | undefined): string | undefined {
	if (color === undefined || !HEX.test(color) || color.length !== 9) return color;
	const channel = (index: number) => Number.parseInt(color.slice(1 + index * 2, 3 + index * 2), 16);
	const alpha = Math.round((channel(3) / 255) * 1000) / 1000;
	return `rgba(${channel(0)}, ${channel(1)}, ${channel(2)}, ${alpha})`;
}

/** The theme tokens the basemap is painted from. */
export const MAP_STYLE_TOKENS = {
	background: "background",
	border: "border",
	muted: "muted",
	mutedForeground: "muted-foreground",
} as const;

export type MapStyleTokens = Record<keyof typeof MAP_STYLE_TOKENS, string | undefined>;

/**
 * Where the basemap's data comes from: a TileJSON URL for vector tiles in the
 * OpenMapTiles schema, the glyph URL template its labels are set from, and the
 * font stack to ask that server for.
 */
export type MapBasemap = {
	tiles: string;
	glyphs: string;
	font: string;
};

/**
 * OpenFreeMap: OpenMapTiles-schema vector tiles of OpenStreetMap, free and with
 * no key. The data is © OpenStreetMap contributors under the ODbL, which is why
 * the map keeps its attribution button.
 */
export const MAP_DEFAULT_BASEMAP: MapBasemap = {
	tiles: "https://tiles.openfreemap.org/planet",
	glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
	font: "Noto Sans Regular",
};

type StyleLayer = StyleSpecification["layers"][number];

/** A place's name, in English where the data has it. */
const NAME: NonNullable<SymbolLayerSpecification["layout"]>["text-field"] = [
	"coalesce",
	["get", "name:en"],
	["get", "name"],
];

/**
 * A MapLibre style painted from the theme: land on the page's `background`,
 * water and green space in `muted`, roads and buildings in `border`, and labels
 * in `muted-foreground` haloed in `background`. Retune the theme and the map
 * retunes with it, on both platforms.
 *
 * A token that did not resolve drops the layers it paints rather than leaving
 * MapLibre to draw them in its default black.
 */
export function buildMapStyle(tokens: MapStyleTokens, basemap: MapBasemap = MAP_DEFAULT_BASEMAP): StyleSpecification {
	const background = toStyleColor(tokens.background);
	const border = toStyleColor(tokens.border);
	const muted = toStyleColor(tokens.muted);
	const label = toStyleColor(tokens.mutedForeground);
	const source = "openmaptiles";
	const font = [basemap.font];
	const when = (color: string | undefined, layers: (color: string) => StyleLayer[]): StyleLayer[] =>
		color === undefined ? [] : layers(color);

	const halo = background === undefined ? {} : { "text-halo-color": background, "text-halo-width": 1.2 };

	return {
		version: 8,
		name: "Delacour",
		glyphs: basemap.glyphs,
		sources: { [source]: { type: "vector", url: basemap.tiles } },
		layers: [
			...when(background, (color) => [{ id: "background", type: "background", paint: { "background-color": color } }]),
			...when(muted, (color) => [
				{
					id: "landcover",
					type: "fill",
					source,
					"source-layer": "landcover",
					filter: ["in", ["get", "class"], ["literal", ["wood", "grass", "farmland", "wetland"]]],
					paint: { "fill-color": color, "fill-opacity": 0.5 },
				},
				{
					id: "park",
					type: "fill",
					source,
					"source-layer": "park",
					paint: { "fill-color": color, "fill-opacity": 0.6 },
				},
				{ id: "water", type: "fill", source, "source-layer": "water", paint: { "fill-color": color } },
				{
					id: "waterway",
					type: "line",
					source,
					"source-layer": "waterway",
					paint: { "line-color": color, "line-width": ["interpolate", ["linear"], ["zoom"], 8, 0.5, 16, 3] },
				},
			]),
			...when(border, (color) => [
				{
					id: "building",
					type: "fill",
					source,
					"source-layer": "building",
					minzoom: 14,
					paint: { "fill-color": color, "fill-opacity": 0.6 },
				},
				{
					id: "boundary",
					type: "line",
					source,
					"source-layer": "boundary",
					filter: ["all", ["<=", ["get", "admin_level"], 4], ["!=", ["get", "maritime"], 1]],
					paint: {
						"line-color": color,
						"line-dasharray": ["case", ["<=", ["get", "admin_level"], 2], ["literal", [1, 0]], ["literal", [3, 2]]],
						"line-width": ["interpolate", ["linear"], ["zoom"], 2, 0.5, 10, 1.5],
					},
				},
				{
					id: "road-minor",
					type: "line",
					source,
					"source-layer": "transportation",
					minzoom: 12,
					filter: ["in", ["get", "class"], ["literal", ["minor", "service", "track", "path"]]],
					layout: { "line-cap": "round", "line-join": "round" },
					paint: {
						"line-color": color,
						"line-width": ["interpolate", ["exponential", 1.5], ["zoom"], 12, 0.5, 18, 8],
					},
				},
				{
					id: "road-major",
					type: "line",
					source,
					"source-layer": "transportation",
					minzoom: 5,
					filter: ["in", ["get", "class"], ["literal", ["motorway", "trunk", "primary", "secondary", "tertiary"]]],
					layout: { "line-cap": "round", "line-join": "round" },
					paint: {
						"line-color": color,
						"line-width": ["interpolate", ["exponential", 1.5], ["zoom"], 5, 0.5, 18, 14],
					},
				},
			]),
			...when(label, (color) => [
				{
					id: "water-name",
					type: "symbol",
					source,
					"source-layer": "water_name",
					layout: { "text-field": NAME, "text-font": font, "text-size": 11 },
					paint: { "text-color": color, ...halo },
				},
				{
					id: "road-name",
					type: "symbol",
					source,
					"source-layer": "transportation_name",
					minzoom: 14,
					layout: {
						"symbol-placement": "line",
						"text-field": NAME,
						"text-font": font,
						"text-size": 11,
					},
					paint: { "text-color": color, ...halo },
				},
				{
					id: "place",
					type: "symbol",
					source,
					"source-layer": "place",
					filter: ["!=", ["get", "class"], "continent"],
					layout: {
						"text-field": NAME,
						"text-font": font,
						"text-max-width": 8,
						"text-size": ["match", ["get", "class"], "country", 13, "city", 14, "town", 12, 11],
					},
					paint: { "text-color": color, ...halo },
				},
			]),
		],
	};
}

/**
 * A dashed route's on and off lengths. MapLibre measures a dash in multiples of
 * the line's width, so one pattern stays dashes at any weight. `undefined` is solid.
 */
export function resolveRouteDashArray(isDashed: boolean): [on: number, off: number] | undefined {
	return isDashed ? [2, 2] : undefined;
}

/**
 * Which gestures the map takes. Rotation and tilt travel together — a map that
 * can be turned but not tilted back flat is one a reader gets lost in — and a
 * map that is not interactive takes none, rotation included.
 */
export function resolveMapGestures({ isInteractive, isRotatable }: { isInteractive: boolean; isRotatable: boolean }): {
	dragPan: boolean;
	touchZoom: boolean;
	doubleTapZoom: boolean;
	doubleTapHoldZoom: boolean;
	touchRotate: boolean;
	touchPitch: boolean;
} {
	const rotates = isInteractive && isRotatable;
	return {
		doubleTapHoldZoom: isInteractive,
		doubleTapZoom: isInteractive,
		dragPan: isInteractive,
		touchPitch: rotates,
		touchRotate: rotates,
		touchZoom: isInteractive,
	};
}

/** A camera move's duration: the caller's, else the default, and a jump when motion is reduced. */
export function resolveCameraDuration(duration: number | undefined, isReducedMotion: boolean): number {
	if (isReducedMotion) return 0;
	return Math.max(0, duration ?? MAP_CAMERA_DURATION);
}

/** A device heading as a rotation in degrees, or `undefined` when the device does not know it. */
export function resolveHeadingRotation(heading: number | undefined): number | undefined {
	if (heading === undefined || !Number.isFinite(heading) || heading < 0) return undefined;
	return heading;
}

/** The view a map mounts with. `bounds` wins; then a centre and zoom; then the world at zoom 2. */
export type MapInitialView = { center?: LngLat; zoom?: number; bounds?: LngLatBounds };

/**
 * The centre and zoom a map mounts on, for a view of the given size. A box is
 * framed edge to edge — the caller's box, not the caller's box plus a margin.
 */
export function resolveInitialCamera({
	size,
	bounds,
	center,
	zoom,
}: MapInitialView & { size: { width: number; height: number } }): { center: LngLat; zoom: number } {
	if (bounds !== undefined) return fitBoundsCamera(bounds, size);
	return { center: center ?? [0, 0], zoom: zoom ?? MAP_DEFAULT_ZOOM };
}

function sameNumbers(a: readonly number[] | undefined, b: readonly number[] | undefined): boolean {
	if (a === undefined || b === undefined) return a === b;
	return a.length === b.length && a.every((value, index) => value === b[index]);
}

/**
 * Whether the initial-view props now name a different view.
 *
 * Compared by value, because `center={[174.7, -41.2]}` is a new array every
 * render; by reference every map would warn on every render. The map uses it
 * to warn, in development, that a changed prop will not move the camera.
 */
export function hasInitialViewChanged(previous: MapInitialView, next: MapInitialView): boolean {
	return (
		!sameNumbers(previous.center, next.center) ||
		previous.zoom !== next.zoom ||
		!sameNumbers(previous.bounds, next.bounds)
	);
}

/**
 * Every styled part of the map, in one slotted `tv()`.
 *
 * The map view itself takes no class: a native view that is not a React
 * Native primitive cannot, so the root is a `View` the map fills, and the
 * caller sizes the root.
 */
export const mapVariants = tv({
	slots: {
		root: "h-72 w-full overflow-hidden rounded-lg bg-muted",
		/** The layer floating parts sit on. `box-none` passes touches on empty space to the map. */
		overlay: "absolute inset-0",
		marker: "items-center",
		label: "max-w-40 rounded-full px-2 py-0.5",
		labelText: "font-medium",
		popup: "max-w-64 gap-1",
		popupTitle: "font-semibold text-card-foreground",
		popupCaret: "-mt-px self-center",
		controls: "absolute gap-2",
		userHeading: "items-center justify-center",
	},
	variants: {
		corner: {
			"top-left": { controls: "top-3 left-3" },
			"top-right": { controls: "top-3 right-3" },
			"bottom-left": { controls: "bottom-3 left-3" },
			"bottom-right": { controls: "right-3 bottom-3" },
		},
		labelSide: {
			top: { label: "mb-1" },
			bottom: { label: "mt-1" },
		},
		labelSize: {
			sm: { labelText: "text-xs" },
			md: { labelText: "text-sm" },
		},
		labelTone: {
			default: { labelText: "text-card-foreground" },
			muted: { labelText: "text-muted-foreground" },
			primary: { labelText: "text-primary" },
		},
	},
	defaultVariants: {
		corner: "bottom-right",
		labelSide: "bottom",
		labelSize: "sm",
		labelTone: "default",
	},
});

export type MapVariantProps = VariantProps<typeof mapVariants>;
