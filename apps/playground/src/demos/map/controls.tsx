import { Map } from "@delacour/react-native-ui/map";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Controls",
	align: "stretch",
	caption:
		"Zoom, compass, recenter and locate, floated in a corner as ghost buttons on a card. Pans on the empty space around them still reach the map.",
	note: "Locate asks for location permission the first time, and the position never leaves the device.",
};

export function Demo(): ReactElement {
	return (
		<Map center={[174.7762, -41.2865]} className="h-96" isRotatable testID="map-controls" zoom={12}>
			<Map.Controls showCompass showLocate showRecenter />
		</Map>
	);
}
