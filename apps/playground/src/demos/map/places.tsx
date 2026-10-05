import { Map } from "@delacour/react-native-ui/map";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Places",
	capture: { align: "stretch", flow: "map/places", hero: true },
	caption:
		"Markers are React views pinned to a coordinate. Each one anchors on its pin's tip, so the label under it moves nothing; tap one to select it.",
};

type Place = { id: string; name: string; lngLat: readonly [number, number] };

const PLACES: readonly Place[] = [
	{ id: "museum", lngLat: [174.7821, -41.2905], name: "Museum" },
	{ id: "gardens", lngLat: [174.7675, -41.2817], name: "Gardens" },
	{ id: "market", lngLat: [174.7768, -41.2952], name: "Market" },
	{ id: "lookout", lngLat: [174.7943, -41.2959], name: "Lookout" },
];

export function Demo(): ReactElement {
	const [selected, setSelected] = useState<string>("museum");

	return (
		<View className="gap-3">
			<Map center={[174.779, -41.2895]} className="h-96" testID="map-places" zoom={13}>
				{PLACES.map((place) => (
					<Map.Marker
						accessibilityLabel={place.name}
						key={place.id}
						lngLat={place.lngLat}
						onPress={() => setSelected(place.id)}
						testID={`map-places-${place.id}`}
					>
						<Map.Pin tone={place.id === selected ? "primary" : "default"} />
						<Map.Label tone={place.id === selected ? "primary" : "default"}>{place.name}</Map.Label>
					</Map.Marker>
				))}
			</Map>
			<Text.Caption testID="map-places-selected">
				Selected: {PLACES.find((place) => place.id === selected)?.name}
			</Text.Caption>
		</View>
	);
}
