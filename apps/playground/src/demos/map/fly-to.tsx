import { Button } from "@delacour/react-native-ui/button";
import { Map, type MapHandle, type ViewState } from "@delacour/react-native-ui/map";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useRef, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Fly to",
	caption:
		"Props set the opening view only. The ref moves the camera afterwards — fly to a place, frame a box, or go back to where it opened.",
};

const AUCKLAND = [174.7633, -36.8485] as const;
const SOUTH_ISLAND = [166.3, -46.7, 174.4, -40.4] as const;

export function Demo(): ReactElement {
	const ref = useRef<MapHandle>(null);
	const [view, setView] = useState<ViewState | null>(null);

	return (
		<View className="gap-3">
			<Map
				center={[174.7762, -41.2865]}
				className="h-80"
				onViewStateChange={setView}
				ref={ref}
				testID="map-fly-to"
				zoom={11}
			>
				<Map.Marker accessibilityLabel="Auckland" lngLat={AUCKLAND}>
					<Map.Pin />
				</Map.Marker>
			</Map>
			<View className="flex-row flex-wrap gap-2">
				<Button
					onPress={() => ref.current?.flyTo({ center: AUCKLAND, zoom: 12 })}
					size="sm"
					testID="map-fly-to-auckland"
					variant="outline"
				>
					Auckland
				</Button>
				<Button
					onPress={() => ref.current?.fitBounds(SOUTH_ISLAND)}
					size="sm"
					testID="map-fly-to-south"
					variant="outline"
				>
					South Island
				</Button>
				<Button onPress={() => ref.current?.recenter()} size="sm" testID="map-fly-to-recenter" variant="outline">
					Recenter
				</Button>
			</View>
			<Text.Caption testID="map-fly-to-state">
				{view === null
					? "Move the map"
					: `${view.center[1].toFixed(3)}, ${view.center[0].toFixed(3)} · zoom ${view.zoom.toFixed(1)}`}
			</Text.Caption>
		</View>
	);
}
