import { type ReactElement, type ReactNode, useEffect, useMemo, useState } from "react";
import { type LayoutChangeEvent, View, type ViewProps } from "react-native";
import { Marker } from "react-native-maps";
import { useUniwind } from "uniwind";
import { type MapMarkerContextValue, type MapMarkerFrame, MapMarkerProvider, useMapPart } from "./map.context";
import type { LngLat } from "./map.types";
import {
	type MapMarkerAnchor,
	mapVariants,
	resolveMarkerAnchor,
	resolveMarkerCenterOffset,
	resolvePinTipAnchor,
} from "./map.variants";
import { lngLatToLatLng } from "./map-geometry";

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
 * How long a marker keeps redrawing after its content last moved, in ms.
 * Google Maps draws a custom marker as a bitmap and only refreshes it while
 * `tracksViewChanges` is on; leaving it on for good costs a redraw per frame
 * per marker, so it is on just long enough for a layout or a theme to settle.
 */
const TRACKING_WINDOW = 500;

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
 */
export function MapMarker({
	lngLat,
	anchor,
	onPress,
	accessibilityLabel,
	className,
	children,
	...props
}: MapMarkerProps): ReactElement {
	useMapPart("Map.Marker");
	const { theme } = useUniwind();
	const [size, setSize] = useState<{ width: number; height: number } | null>(null);
	const [pin, setPin] = useState<MapMarkerFrame | null>(null);
	const [isTracking, setIsTracking] = useState(true);

	// Every change to what the marker draws — its size, where its pin sits, the
	// theme — reopens the redraw window, then closes it once things settle.
	// biome-ignore lint/correctness/useExhaustiveDependencies: the dependencies are the re-run triggers, see above
	useEffect(() => {
		setIsTracking(true);
		const timeout = setTimeout(() => setIsTracking(false), TRACKING_WINDOW);
		return () => clearTimeout(timeout);
	}, [size, pin, theme]);

	const anchorPoint =
		anchor !== undefined
			? resolveMarkerAnchor(anchor)
			: ((size !== null && pin !== null ? resolvePinTipAnchor({ marker: size, pin }) : undefined) ??
				resolveMarkerAnchor("center"));
	const centerOffset = size === null ? undefined : resolveMarkerCenterOffset(anchorPoint, size);

	const markerContext = useMemo<MapMarkerContextValue>(() => ({ reportPin: setPin }), []);

	const onLayout = (event: LayoutChangeEvent) => {
		const { width, height } = event.nativeEvent.layout;
		setSize((current) => (current?.width === width && current.height === height ? current : { height, width }));
	};

	return (
		<Marker
			accessibilityLabel={accessibilityLabel}
			accessibilityRole={onPress === undefined ? undefined : "button"}
			anchor={anchorPoint}
			centerOffset={centerOffset}
			coordinate={lngLatToLatLng(lngLat)}
			onPress={onPress === undefined ? undefined : () => onPress()}
			stopPropagation={onPress !== undefined}
			tracksViewChanges={isTracking}
			{...props}
		>
			<MapMarkerProvider value={markerContext}>
				<View className={mapVariants().marker({ className })} collapsable={false} onLayout={onLayout}>
					{children}
				</View>
			</MapMarkerProvider>
		</Marker>
	);
}
MapMarker.displayName = "DelacourUI.Map.Marker";
