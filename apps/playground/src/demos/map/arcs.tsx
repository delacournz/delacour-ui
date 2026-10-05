import { Map } from "@delacour/react-native-ui/map";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Arcs",
	align: "stretch",
	caption:
		"A curve from one point to another, for a connection rather than a path. Each starts and ends exactly on its coordinates, so the markers sit on the line.",
};

type City = { name: string; lngLat: readonly [number, number] };

const HUB: City = { lngLat: [174.7762, -41.2865], name: "Wellington" };

const DESTINATIONS: readonly City[] = [
	{ lngLat: [174.7633, -36.8485], name: "Auckland" },
	{ lngLat: [172.6362, -43.5321], name: "Christchurch" },
	{ lngLat: [170.5028, -45.8788], name: "Dunedin" },
	{ lngLat: [176.2497, -38.1368], name: "Rotorua" },
];

export function Demo(): ReactElement {
	return (
		<Map bounds={[166.5, -47.3, 178.6, -34.4]} className="h-96" isInteractive={false} testID="map-arcs">
			{DESTINATIONS.map((city) => (
				<Map.Arc
					curvature={city.lngLat[0] < HUB.lngLat[0] ? -0.25 : 0.25}
					from={HUB.lngLat}
					key={city.name}
					to={city.lngLat}
				/>
			))}
			{[HUB, ...DESTINATIONS].map((city) => (
				<Map.Marker accessibilityLabel={city.name} key={city.name} lngLat={city.lngLat}>
					<Map.Pin size="sm" tone={city === HUB ? "primary" : "default"} />
				</Map.Marker>
			))}
		</Map>
	);
}
