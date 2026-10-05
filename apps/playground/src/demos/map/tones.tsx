import { MAP_PIN_TONES, Map, type MapPinTone } from "@delacour/react-native-ui/map";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Tones and theme",
	caption:
		"Pins in each tone, labels on the card. The basemap follows the app's theme rather than the system's — switch the theme and it follows.",
};

const LABELS: Record<MapPinTone, string> = {
	default: "Default",
	destructive: "Destructive",
	primary: "Primary",
};

const POSITIONS: Record<MapPinTone, readonly [number, number]> = {
	default: [174.7705, -41.2885],
	destructive: [174.7855, -41.2885],
	primary: [174.778, -41.2925],
};

export function Demo(): ReactElement {
	return (
		<Map center={[174.778, -41.29]} className="h-80" testID="map-tones" zoom={14}>
			{MAP_PIN_TONES.map((tone) => (
				<Map.Marker accessibilityLabel={LABELS[tone]} key={tone} lngLat={POSITIONS[tone]}>
					<Map.Pin tone={tone} />
					<Map.Label tone={tone === "primary" ? "primary" : "default"}>{LABELS[tone]}</Map.Label>
				</Map.Marker>
			))}
		</Map>
	);
}
