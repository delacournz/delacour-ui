import { Map } from "@delacour/react-native-ui/map";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Route",
	align: "stretch",
	caption:
		"A line through a list of coordinates, in the theme's primary with round caps. The walked leg is solid; the leg still to go is dashed and fainter.",
};

const WALKED = [
	[174.7768, -41.2952],
	[174.7779, -41.2934],
	[174.7795, -41.2921],
	[174.7812, -41.2912],
] as const;

const AHEAD = [
	[174.7812, -41.2912],
	[174.7841, -41.2918],
	[174.7876, -41.2935],
	[174.7943, -41.2959],
] as const;

export function Demo(): ReactElement {
	return (
		<Map bounds={[174.774, -41.2975, 174.797, -41.289]} className="h-80" testID="map-route">
			<Map.Route coordinates={WALKED} width={4} />
			<Map.Route coordinates={AHEAD} isDashed opacity={0.6} width={4} />
			<Map.Marker accessibilityLabel="Start" lngLat={WALKED[0]}>
				<Map.Pin size="sm" tone="default" />
			</Map.Marker>
			<Map.Marker accessibilityLabel="Destination" lngLat={AHEAD[AHEAD.length - 1]}>
				<Map.Pin />
				<Map.Label>Lookout</Map.Label>
			</Map.Marker>
		</Map>
	);
}
