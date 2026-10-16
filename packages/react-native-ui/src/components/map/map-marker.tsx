import { Marker } from "@maplibre/maplibre-react-native";
import { type ReactElement, type ReactNode, useMemo, useState } from "react";
import { type LayoutChangeEvent, View, type ViewProps } from "react-native";
import { type MapMarkerContextValue, type MapMarkerFrame, MapMarkerProvider, useMapPart } from "./map.context";
import type { LngLat } from "./map.types";
import {
	type MapMarkerAnchor,
	mapVariants,
	resolveMarkerAnchor,
	resolveMarkerOffset,
	resolvePinTipAnchor,
} from "./map.variants";

export type MapMarkerProps = Omit<ViewProps, "children"> & {
	/** Where it sits. */
	lngLat: LngLat;
	/**
	 * Which point of the marker sits on `lngLat`. Omitted, a marker holding a
	 * `Map.Pin` anchors on the pin's tip and any other marker on its centre.
	 */
	anchor?: MapMarkerAnchor;
	/** Makes the marker a button. */
	onPress?: () => void;
	/** What a screen reader announces. Name the place, not the pin. */
	accessibilityLabel?: string;
	className?: string;
	children?: ReactNode;
};

/**
 * A React view pinned to a coordinate.
 *
 * Anchors on the tip of the `Map.Pin` inside it, wherever the pin sits — so a
 * marker can hold a popup over its pin, or a label under it, and the tip still
 * lands on the coordinate with no offset worked out at the call site. The pin
 * has to be a direct child for its position to be measured.
 *
 * A marker with `onPress` is a button, announced by its `accessibilityLabel`,
 * and its tap does not reach the map's `onPress`.
 *
 * `testID` goes on the native marker and, suffixed `-content`, on the view
 * inside it, which is the one an e2e selector can always find and tap.
 */
export function MapMarker({
	lngLat,
	anchor,
	onPress,
	accessibilityLabel,
	className,
	children,
	testID,
	...props
}: MapMarkerProps): ReactElement {
	useMapPart("Map.Marker");
	const [size, setSize] = useState<{ width: number; height: number } | null>(null);
	const [pin, setPin] = useState<MapMarkerFrame | null>(null);

	const anchorPoint =
		anchor !== undefined
			? resolveMarkerAnchor(anchor)
			: ((size !== null && pin !== null ? resolvePinTipAnchor({ marker: size, pin }) : undefined) ??
				resolveMarkerAnchor("center"));
	const offset = size === null ? undefined : resolveMarkerOffset(anchorPoint, size);

	const markerContext = useMemo<MapMarkerContextValue>(() => ({ reportPin: setPin }), []);

	const onLayout = (event: LayoutChangeEvent) => {
		const { width, height } = event.nativeEvent.layout;
		setSize((current) => (current?.width === width && current.height === height ? current : { height, width }));
	};

	// MapLibre places a marker by a named anchor plus a pixel offset, so the
	// marker is centred on its coordinate and moved until the anchor point —
	// a pin's tip, wherever it sits — lands there instead.
	return (
		<Marker
			accessibilityLabel={accessibilityLabel}
			accessibilityRole={onPress === undefined ? undefined : "button"}
			anchor="center"
			lngLat={[lngLat[0], lngLat[1]]}
			offset={offset}
			onPress={
				onPress === undefined
					? undefined
					: (event) => {
							event.stopPropagation();
							onPress();
						}
			}
			testID={testID}
			{...props}
		>
			<MapMarkerProvider value={markerContext}>
				<View
					className={mapVariants().marker({ className })}
					collapsable={false}
					onLayout={onLayout}
					testID={testID === undefined ? undefined : `${testID}-content`}
				>
					{children}
				</View>
			</MapMarkerProvider>
		</Marker>
	);
}
MapMarker.displayName = "DelacourUI.Map.Marker";
