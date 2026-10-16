import { GeoJSONSource, Layer } from "@maplibre/maplibre-react-native";
import { type ReactElement, useId, useMemo } from "react";
import { useThemeColor } from "../../hooks/use-theme-color";
import { useMapPart } from "./map.context";
import type { LngLat } from "./map.types";
import { MAP_ROUTE_TOKEN, resolveRouteDashArray, toStyleColor } from "./map.variants";

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

/** Points of slack round a line a tap still lands on — a 3-point line is a hard target. */
const ROUTE_HITBOX = 12;

/**
 * A line through a list of coordinates — a route, a run, a boundary.
 *
 * Round caps and joins, in the theme's `primary` unless given a colour, which
 * may be a token as well as a literal. Drawn by the map itself — a GeoJSON
 * source and a line layer — so it sits over the basemap and under every
 * marker, and `opacity` is the layer's own rather than folded into the colour.
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
	const stroke = toStyleColor(useThemeColor(color));
	const id = `delacour-route-${useId()}`;
	const data = useMemo<GeoJSON.Feature<GeoJSON.LineString>>(
		() => ({
			geometry: { coordinates: coordinates.map(([longitude, latitude]) => [longitude, latitude]), type: "LineString" },
			properties: {},
			type: "Feature",
		}),
		[coordinates]
	);
	const dashArray = resolveRouteDashArray(isDashed);

	return (
		<GeoJSONSource
			data={data}
			hitbox={
				onPress === undefined
					? undefined
					: { bottom: ROUTE_HITBOX, left: ROUTE_HITBOX, right: ROUTE_HITBOX, top: ROUTE_HITBOX }
			}
			id={id}
			onPress={
				onPress === undefined
					? undefined
					: (event) => {
							event.stopPropagation();
							onPress();
						}
			}
		>
			<Layer
				id={`${id}-line`}
				layout={{ "line-cap": "round", "line-join": "round" }}
				paint={{
					...(stroke === undefined ? {} : { "line-color": stroke }),
					...(dashArray === undefined ? {} : { "line-dasharray": dashArray }),
					"line-opacity": Math.min(1, Math.max(0, opacity)),
					"line-width": width,
				}}
				type="line"
			/>
		</GeoJSONSource>
	);
}
MapRoute.displayName = "DelacourUI.Map.Route";
