import type { ReactElement, ReactNode } from "react";
import type { ViewProps } from "react-native";
import { Surface } from "../surface";
import { Text } from "../text";
import { type MapLabelSide, type MapLabelSize, type MapLabelTone, mapVariants } from "./map.variants";

export type MapLabelProps = Omit<ViewProps, "children"> & {
	/**
	 * Which side of the pin it sits on — the side it keeps its gap from. Write
	 * it after the pin for `bottom` and before it for `top`; a marker is a column
	 * and draws its children in order.
	 */
	side?: MapLabelSide;
	size?: MapLabelSize;
	/** The text's colour. The pill is the card either way. */
	tone?: MapLabelTone;
	className?: string;
	children: ReactNode;
};

/**
 * A pill of text beside a pin — the place's name, a price, an arrival time.
 *
 * A card-coloured `Surface` with a hairline, so it reads over satellite-dark
 * water and pale streets alike, on one line that truncates rather than wraps.
 */
export function MapLabel({
	side = "bottom",
	size = "sm",
	tone = "default",
	className,
	children,
	...props
}: MapLabelProps): ReactElement {
	const slots = mapVariants({ labelSide: side, labelSize: size, labelTone: tone });

	return (
		<Surface className={slots.label({ className })} padding="none" variant="default" {...props}>
			<Text className={slots.labelText()} numberOfLines={1}>
				{children}
			</Text>
		</Surface>
	);
}
MapLabel.displayName = "DelacourUI.Map.Label";
