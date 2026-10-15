import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";
import type { LngLat, LngLatBounds, MapRegion } from "./map.types";
import { boundsToRegion, centerZoomToRegion } from "./map-geometry";

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
 * The anchor as Apple Maps wants it: a shift of the marker's centre in points.
 *
 * Google Maps takes the unit-square `anchor`; Apple Maps ignores it and centres
 * every custom view on its coordinate, moved by `centerOffset`. Positive moves
 * right and down, so a bottom anchor is a lift of half the view's height.
 */
export function resolveMarkerCenterOffset(anchor: MapAnchorPoint, size: Size): MapAnchorPoint {
	return { x: (0.5 - anchor.x) * size.width, y: (0.5 - anchor.y) * size.height };
}

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGB = /^rgba?\(\s*([^,]+),\s*([^,]+),\s*([^,)]+)/i;

function expandHex(color: string): string {
	const digits = color.slice(1);
	if (digits.length !== 3) return digits;
	return digits
		.split("")
		.map((digit) => digit + digit)
		.join("");
}

/**
 * A colour at a fraction of its opacity, for a native prop that takes a colour
 * but no opacity — a polyline's stroke.
 *
 * Uniwind hands theme colours to JavaScript as hex, so hex is the case that
 * matters; an alpha the colour already carries is multiplied rather than
 * replaced. A notation it cannot take apart comes back untouched rather than
 * guessed at: a line drawn opaque beats a line drawn the wrong colour.
 */
export function withAlpha(color: string | undefined, opacity: number): string | undefined {
	if (color === undefined) return undefined;
	const alpha = Math.min(1, Math.max(0, opacity));
	if (alpha === 1) return color;

	if (HEX.test(color)) {
		const digits = expandHex(color);
		const existing = digits.length === 8 ? Number.parseInt(digits.slice(6), 16) / 255 : 1;
		const byte = Math.round(existing * alpha * 255)
			.toString(16)
			.padStart(2, "0");
		return `#${digits.slice(0, 6)}${byte}`;
	}

	const channels = RGB.exec(color);
	if (channels) return `rgba(${channels[1]?.trim()}, ${channels[2]?.trim()}, ${channels[3]?.trim()}, ${alpha})`;

	return color;
}

/** Google's styler reads six-digit hex only; an eight-digit token loses its alpha byte. */
function opaqueHex(color: string): string {
	return HEX.test(color) ? `#${expandHex(color).slice(0, 6)}` : color;
}

/** The theme tokens the Android basemap is painted from. */
export const ANDROID_MAP_STYLE_TOKENS = {
	background: "background",
	border: "border",
	muted: "muted",
	mutedForeground: "muted-foreground",
} as const;

export type AndroidMapStyleTokens = Record<keyof typeof ANDROID_MAP_STYLE_TOKENS, string | undefined>;

/** One rule of a Google Maps style — `react-native-maps`' `MapStyleElement`. */
export type MapStyleRule = {
	featureType: string;
	elementType: string;
	stylers: { color: string }[];
};

/**
 * A Google Maps style painted from the theme: water in `muted`, land on the
 * page's `background`, roads in `border`, and labels in `muted-foreground`
 * haloed in `background`.
 *
 * Apple Maps takes no style — it follows light and dark and nothing finer — so
 * this is Android's alone. A token that did not resolve drops its rules, which
 * leaves that feature on Google's own colour rather than painting it black.
 */
export function buildAndroidMapStyle(tokens: AndroidMapStyleTokens): MapStyleRule[] {
	const rule = (featureType: string, elementType: string, color: string | undefined): MapStyleRule[] =>
		color === undefined ? [] : [{ featureType, elementType, stylers: [{ color: opaqueHex(color) }] }];

	return [
		...rule("landscape", "geometry", tokens.background),
		...rule("poi", "geometry", tokens.background),
		...rule("water", "geometry", tokens.muted),
		...rule("road", "geometry", tokens.border),
		...rule("transit", "geometry", tokens.border),
		...rule("administrative", "geometry.stroke", tokens.border),
		...rule("all", "labels.text.fill", tokens.mutedForeground),
		...rule("all", "labels.text.stroke", tokens.background),
	];
}

/** A dashed route's on and off lengths, scaled to its stroke. `undefined` is solid. */
export function resolveRouteDashPattern(isDashed: boolean, width: number): number[] | undefined {
	return isDashed ? [width * 2, width * 2] : undefined;
}

/**
 * Which gestures the map takes. Rotation and tilt travel together — a map that
 * can be turned but not tilted back flat is one a reader gets lost in — and a
 * map that is not interactive takes none, rotation included.
 */
export function resolveMapGestures({ isInteractive, isRotatable }: { isInteractive: boolean; isRotatable: boolean }): {
	scrollEnabled: boolean;
	zoomEnabled: boolean;
	rotateEnabled: boolean;
	pitchEnabled: boolean;
} {
	const rotates = isInteractive && isRotatable;
	return { pitchEnabled: rotates, rotateEnabled: rotates, scrollEnabled: isInteractive, zoomEnabled: isInteractive };
}

/** Uniwind's active theme as the native map's appearance. Never the system's. */
export function resolveUserInterfaceStyle(theme: string | undefined): "light" | "dark" {
	return theme === "dark" ? "dark" : "light";
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

/** The region a map mounts on, for a view of the given aspect. */
export function resolveInitialRegion({ aspect, bounds, center, zoom }: MapInitialView & { aspect: number }): MapRegion {
	if (bounds !== undefined) return boundsToRegion(bounds);
	return centerZoomToRegion(center ?? [0, 0], zoom ?? MAP_DEFAULT_ZOOM, aspect);
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
		label: "max-w-40 rounded-full border border-border bg-card px-2 py-0.5",
		labelText: "font-medium",
		popup: "max-w-64 gap-1",
		popupTitle: "font-semibold text-card-foreground",
		popupCaret: "-mt-px h-2 w-3 self-center",
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
