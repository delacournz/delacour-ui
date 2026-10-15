import { type ReactElement, useEffect, useId } from "react";
import { View, type ViewProps } from "react-native";
import { IconCompassRound, IconLocation, IconMinusSmall, IconPlusSmall, IconTarget } from "../../icons/central";
import { Button } from "../button";
import { Icon } from "../icon";
import { Surface } from "../surface";
import { useMapPart } from "./map.context";
import type { LngLat } from "./map.types";
import { MAP_ZOOM_STEP, type MapControlsCorner, mapVariants } from "./map.variants";

export type MapControlsProps = Omit<ViewProps, "children"> & {
	/** Defaults to `bottom-right`, under the thumb. */
	corner?: MapControlsCorner;
	/** Zoom in and out. Defaults to `true`. */
	showZoom?: boolean;
	/** Fly to the device's location — turns the location dot on and asks for permission. */
	showLocate?: boolean;
	/** Turn the map back to north-up. Useful only on a map that rotates. */
	showCompass?: boolean;
	/** Return to the view the map opened on. */
	showRecenter?: boolean;
	/** Called with the device's position once a locate press has flown there. */
	onLocate?: (lngLat: LngLat) => void;
	className?: string;
};

/**
 * Zoom, locate, compass and recenter buttons, floated in a corner of the map.
 *
 * Each group is a card-coloured `Surface` holding ghost `Button`s, so the
 * controls read over any basemap and take the theme like every other button.
 * Each is labelled for a screen reader by what it does.
 *
 * Drawn on the layer above the map rather than inside it — the native map
 * takes only map features as children — and that layer passes touches on its
 * empty space through, so only the buttons themselves intercept a pan.
 *
 * `showLocate` turns on the platform's location dot, which asks for foreground
 * location permission the first time; the app's config has to declare why.
 */
export function MapControls({
	corner = "bottom-right",
	showZoom = true,
	showLocate = false,
	showCompass = false,
	showRecenter = false,
	onLocate,
	className,
	...props
}: MapControlsProps): null {
	const map = useMapPart("Map.Controls");
	const id = useId();
	const { requestUserLocation, setOverlay } = map;

	useEffect(() => (showLocate ? requestUserLocation() : undefined), [showLocate, requestUserLocation]);

	const slots = mapVariants({ corner });

	const node: ReactElement = (
		<View className={slots.controls({ className })} pointerEvents="box-none" {...props}>
			{showZoom ? (
				<Surface padding="none" variant="default">
					<Button
						accessibilityLabel="Zoom in"
						onPress={() => map.zoomBy(MAP_ZOOM_STEP)}
						size="icon-sm"
						testID="map-controls-zoom-in"
						variant="ghost"
					>
						<Icon icon={IconPlusSmall} />
					</Button>
					<Button
						accessibilityLabel="Zoom out"
						onPress={() => map.zoomBy(-MAP_ZOOM_STEP)}
						size="icon-sm"
						testID="map-controls-zoom-out"
						variant="ghost"
					>
						<Icon icon={IconMinusSmall} />
					</Button>
				</Surface>
			) : null}
			{showCompass ? (
				<Surface padding="none" variant="default">
					<Button
						accessibilityLabel="Point north"
						onPress={() => map.resetBearing()}
						size="icon-sm"
						testID="map-controls-compass"
						variant="ghost"
					>
						<Icon icon={IconCompassRound} />
					</Button>
				</Surface>
			) : null}
			{showRecenter ? (
				<Surface padding="none" variant="default">
					<Button
						accessibilityLabel="Recenter map"
						onPress={() => map.handle.recenter()}
						size="icon-sm"
						testID="map-controls-recenter"
						variant="ghost"
					>
						<Icon icon={IconTarget} />
					</Button>
				</Surface>
			) : null}
			{showLocate ? (
				<Surface padding="none" variant="default">
					<Button
						accessibilityLabel="Show my location"
						onPress={() => map.locate(onLocate)}
						size="icon-sm"
						testID="map-controls-locate"
						variant="ghost"
					>
						<Icon icon={IconLocation} />
					</Button>
				</Surface>
			) : null}
		</View>
	);

	useEffect(() => {
		setOverlay(id, node);
	}, [id, node, setOverlay]);

	useEffect(() => () => setOverlay(id, null), [id, setOverlay]);

	return null;
}
MapControls.displayName = "DelacourUI.Map.Controls";
