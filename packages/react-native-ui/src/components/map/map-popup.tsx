import type { ReactElement, ReactNode } from "react";
import { View, type ViewProps } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useThemeColor } from "../../hooks/use-theme-color";
import { Surface } from "../surface";
import { Text } from "../text";
import { useMapMarkerContext, useMapPart } from "./map.context";
import type { LngLat } from "./map.types";
import { mapVariants } from "./map.variants";
import { MapMarker } from "./map-marker";

type MapPopupBaseProps = Omit<ViewProps, "children"> & {
	/** A heading over the content. */
	title?: string;
	className?: string;
	children?: ReactNode;
};

/**
 * Inside a `Map.Marker` a popup sits over the marker's pin and needs no
 * coordinate; on its own it needs one. The union says so, so a popup that
 * would have nowhere to go is a type error rather than an empty map.
 */
export type MapPopupProps = MapPopupBaseProps & ({ lngLat: LngLat } | { lngLat?: undefined });

/** The caret's box in points: wide and short, pointing down at the place. */
const CARET = { width: 14, height: 8 } as const;

/**
 * A card over a place — a name, a line of detail, an action.
 *
 * Inside a `Map.Marker`, write it before the `Map.Pin`: the marker is a column,
 * so the card lands over the pin and the marker still anchors on the pin's tip.
 * Outside one, give it a `lngLat` and it becomes a marker of its own, its caret
 * on the coordinate.
 *
 * It is a React view rather than the platform's native callout, so it takes
 * the theme — a card-coloured `Surface` with a caret in the same fill and
 * hairline. Show and hide it by rendering it or not; it holds no open state of
 * its own, because the caller is the one who knows which place is selected.
 */
export function MapPopup({ lngLat, title, className, children, ...props }: MapPopupProps): ReactElement | null {
	useMapPart("Map.Popup");
	const marker = useMapMarkerContext();
	const card = useThemeColor("card");
	const border = useThemeColor("border");
	const slots = mapVariants();

	const body = (
		<View accessibilityRole="summary" {...props}>
			<Surface className={slots.popup({ className })} padding="sm" variant="default">
				{title === undefined ? null : <Text className={slots.popupTitle()}>{title}</Text>}
				{children}
			</Surface>
			<View className={slots.popupCaret()}>
				<Svg height={CARET.height} width={CARET.width}>
					<Path
						d={`M0 0 L${CARET.width / 2} ${CARET.height} L${CARET.width} 0`}
						fill={card}
						stroke={border}
						strokeWidth={1}
					/>
				</Svg>
			</View>
		</View>
	);

	if (marker !== null) return body;

	if (lngLat === undefined) {
		if (__DEV__) {
			console.warn("[DelacourUI.Map.Popup] A popup outside a Map.Marker needs a `lngLat`; it was not drawn.");
		}
		return null;
	}

	return (
		<MapMarker anchor="bottom" lngLat={lngLat}>
			{body}
		</MapMarker>
	);
}
MapPopup.displayName = "DelacourUI.Map.Popup";
