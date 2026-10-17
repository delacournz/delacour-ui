import type { ReactElement } from "react";
import { View, type ViewProps } from "react-native";
import { useMarkerPart } from "./marker.context";
import { markerVariants } from "./marker.variants";

export type MarkerIconProps = ViewProps & { className?: string };

/**
 * The marker's leading glyph slot.
 *
 * Hidden from assistive technology: the glyph restates the text beside it, and
 * reading both would say the step twice. A bare `<Icon>` inside needs nothing
 * said — the root publishes the marker's icon size and muted colour through
 * `IconDefaultsProvider`.
 */
export function MarkerIcon({ className, ...props }: MarkerIconProps): ReactElement {
	useMarkerPart("Marker.Icon");
	return (
		<View
			accessibilityElementsHidden
			className={markerVariants().iconSlot({ className })}
			importantForAccessibility="no-hide-descendants"
			{...props}
		/>
	);
}
MarkerIcon.displayName = "DelacourUI.Marker.Icon";
