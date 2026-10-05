import type { ReactElement } from "react";
import { Polyline } from "react-native-maps";
import { useThemeColor } from "../../hooks/use-theme-color";
import { useMapPart } from "./map.context";
import type { LngLat } from "./map.types";
import { MAP_ROUTE_TOKEN, resolveRouteDashPattern, withAlpha } from "./map.variants";
import { lngLatToLatLng } from "./map-geometry";

export type MapRouteProps = {
	/** The points the line runs through, in order. */
	coordinates: readonly LngLat[];
	/** A theme token or a literal colour. Defaults to `primary`. */
	color?: string;
	/** Stroke width in points. Defaults to `3`. */
	width?: number;
	/** Dashes scaled to the stroke — for a planned or estimated leg. */
	isDashed?: boolean;
	/** `0`–`1`. Defaults to `1`. */
	opacity?: number;
	/** A tap on the line itself. */
	onPress?: () => void;
};

/**
 * A line through a list of coordinates — a route, a run, a boundary.
 *
 * Round caps and joins, in the theme's `primary` unless given a colour, which
 * may be a token as well as a literal. The native polyline takes no opacity, so
 * `opacity` is folded into the colour's alpha.
 */
export function MapRoute({
	coordinates,
	color = MAP_ROUTE_TOKEN,
	width = 3,
	isDashed = false,
	opacity = 1,
	onPress,
}: MapRouteProps): ReactElement {
	useMapPart("Map.Route");
	const stroke = withAlpha(useThemeColor(color), opacity);

	return (
		<Polyline
			coordinates={coordinates.map(lngLatToLatLng)}
			lineCap="round"
			lineDashPattern={resolveRouteDashPattern(isDashed, width)}
			lineJoin="round"
			onPress={onPress === undefined ? undefined : () => onPress()}
			strokeColor={stroke}
			strokeWidth={width}
			tappable={onPress !== undefined}
		/>
	);
}
MapRoute.displayName = "DelacourUI.Map.Route";
