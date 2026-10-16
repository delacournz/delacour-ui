/**
 * A point on the map, longitude first — the order GeoJSON and every web map
 * library use, so a coordinate pasted from one lands in the right hemisphere.
 * It is MapLibre's order too, so nothing is converted on the way in.
 */
export type LngLat = readonly [longitude: number, latitude: number];

/**
 * A box on the map. `west > east` is a box that crosses the antimeridian —
 * Fiji, the Chukchi Sea — rather than an inverted one.
 */
export type LngLatBounds = readonly [west: number, south: number, east: number, north: number];

/** Where the camera is: its centre, zoom, rotation from north and tilt, in degrees. */
export type ViewState = {
	center: LngLat;
	zoom: number;
	bearing: number;
	pitch: number;
};

/** What a camera move takes. `duration` in milliseconds; `0` jumps. */
export type MapFlyToOptions = {
	center: LngLat;
	zoom?: number;
	duration?: number;
};

/** `padding` is the inset kept clear on every side, in points. */
export type MapFitBoundsOptions = {
	padding?: number;
	duration?: number;
};

/**
 * Moves the camera after mount. Props set the initial view only; this is the
 * one way to change it afterwards, from a `ref` on `<Map>` or `useMap()` inside.
 */
export type MapHandle = {
	/** Moves the camera to a centre, keeping the zoom unless one is given. */
	flyTo(options: MapFlyToOptions): void;
	/** Frames a box, leaving `padding` points clear on every side. */
	fitBounds(bounds: LngLatBounds, options?: MapFitBoundsOptions): void;
	/** Returns to the view the map mounted with. */
	recenter(duration?: number): void;
	/** Reads where the camera is now. */
	getViewState(): Promise<ViewState>;
};
