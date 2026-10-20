import type { ReactElement, ReactNode } from "react";
import { View, type ViewProps } from "react-native";
import { Pressable } from "../pressable";
import { useSketchPart } from "./sketch.context";
import { sketchVariants } from "./sketch.variants";

export type SketchSwatchesProps = Omit<ViewProps, "children"> & {
	/** Trailing content after the last swatch — a trigger for your own colour picker. */
	children?: ReactNode;
};

/**
 * The colour swatches, as a radio group.
 *
 * Each swatch is a 36-point target around a 24-point dot, with a ring that is
 * always reserved and only coloured when selected, so selection moves nothing.
 * A colour that resolves to nothing in the active theme is not drawn at all —
 * a swatch with no ink would select a colour the pen cannot draw with.
 *
 * Tokens are named for themselves ("Primary"); a literal is read by position
 * ("Colour 3 of 6").
 */
export function SketchSwatches({ children, className, ...props }: SketchSwatchesProps): ReactElement {
	const { swatches, color, setColor, isDisabled, haptic } = useSketchPart("Sketch.Swatches");
	const slots = sketchVariants();

	return (
		<View accessibilityRole="radiogroup" className={slots.swatches({ className })} {...props}>
			{swatches.map((swatch) => {
				const isSelected = swatch.color === color;
				const ring = sketchVariants({ isSelected });
				return (
					<Pressable
						accessibilityLabel={swatch.label}
						accessibilityRole="radio"
						accessibilityState={{ checked: isSelected, disabled: isDisabled, selected: isSelected }}
						className={slots.swatch()}
						disabled={isDisabled}
						haptic={haptic}
						key={swatch.color}
						onPress={() => setColor(swatch.color)}
						testID={`sketch-swatch-${swatch.color}`}
					>
						<View className={ring.swatchRing()}>
							<View className={slots.swatchDot()} style={{ backgroundColor: swatch.ink }} />
						</View>
					</Pressable>
				);
			})}
			{children}
		</View>
	);
}
SketchSwatches.displayName = "DelacourUI.Sketch.Swatches";
