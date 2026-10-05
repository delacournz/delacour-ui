import { Button } from "@delacour/react-native-ui/button";
import { Map } from "@delacour/react-native-ui/map";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Popup",
	caption:
		"A themed card over a marker's pin, rendered or not by whoever knows which place is selected. Tap a marker to open its card, the map to close it.",
	capture: { align: "stretch" },
};

type Stop = { id: string; name: string; detail: string; lngLat: readonly [number, number] };

const STOPS: readonly Stop[] = [
	{ detail: "Open until 6 pm", id: "cafe", lngLat: [174.7752, -41.2938], name: "Corner café" },
	{ detail: "Two-hour parking", id: "car-park", lngLat: [174.7808, -41.2899], name: "Car park" },
];

export function Demo(): ReactElement {
	const [openId, setOpenId] = useState<string | null>("cafe");

	return (
		<Map center={[174.778, -41.2905]} className="h-96" onPress={() => setOpenId(null)} testID="map-popup" zoom={15}>
			{STOPS.map((stop) => (
				<Map.Marker
					accessibilityLabel={stop.name}
					key={stop.id}
					lngLat={stop.lngLat}
					onPress={() => setOpenId(stop.id)}
					testID={`map-popup-${stop.id}`}
				>
					{openId === stop.id ? (
						<Map.Popup title={stop.name}>
							<Text.Caption>{stop.detail}</Text.Caption>
							<Button onPress={() => setOpenId(null)} size="sm" testID={`map-popup-${stop.id}-close`} variant="outline">
								Close
							</Button>
						</Map.Popup>
					) : null}
					<Map.Pin />
				</Map.Marker>
			))}
		</Map>
	);
}
