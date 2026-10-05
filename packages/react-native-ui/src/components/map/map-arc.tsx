import { type ReactElement, useMemo } from "react";
import { Polyline } from "react-native-maps";
import { useThemeColor } from "../../hooks/use-theme-color";
import { useMapPart } from "./map.context";
import type { LngLat } from "./map.types";
import { MAP_ROUTE_TOKEN, withAlpha } from "./map.variants";
import { arcCoordinates, lngLatToLatLng } from "./map-geometry";

export type MapArcProps = {
	from: LngLat;
	to: LngLat;
	/**
	 * How far it bows off the straight line, as a fraction of the line's
	 * length; negative bows the other way. Defaults to `0.2`.
	 */
	curvature?: number;
	/** A theme token or a literal colour. Defaults to `primary`. */
	color?: string;
	/** Stroke width in points. Defaults to `2`. */
	width?: number;
	/** `0`–`1`. Defaults to `0.9`. */
	opacity?: number;
};

/** Points sampled along the curve — smooth at any zoom a connection is read at. */
const ARC_SAMPLES = 64;

/**
 * A curve from one point to another — a flight, a transfer, a connection
 * rather than a path someone travelled.
 *
 * A quadratic curve sampled into a polyline, not a great circle: at the scale
 * a connection is drawn the two are indistinguishable, and the curve's bow is a
 * choice the caller makes rather than one the globe makes for them. The line
 * starts and ends exactly on `from` and `to`, so markers there sit on it.
 */
export function MapArc({
	from,
	to,
	curvature = 0.2,
	color = MAP_ROUTE_TOKEN,
	width = 2,
	opacity = 0.9,
}: MapArcProps): ReactElement {
	useMapPart("Map.Arc");
	const stroke = withAlpha(useThemeColor(color), opacity);
	const [fromLng, fromLat] = from;
	const [toLng, toLat] = to;
	const coordinates = useMemo(
		() => arcCoordinates([fromLng, fromLat], [toLng, toLat], curvature, ARC_SAMPLES).map(lngLatToLatLng),
		[fromLng, fromLat, toLng, toLat, curvature]
	);

	return <Polyline coordinates={coordinates} lineCap="round" strokeColor={stroke} strokeWidth={width} />;
}
MapArc.displayName = "DelacourUI.Map.Arc";
