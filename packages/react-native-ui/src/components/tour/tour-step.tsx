import { type ReactElement, type ReactNode, useEffect, useId, useRef } from "react";
import { View, type ViewInstance, type ViewProps } from "react-native";
import { useTourRegistryPart } from "./tour.context";
import type { TourGeometryProps } from "./tour.types";

export type TourStepProps = ViewProps &
	TourGeometryProps & {
		/** Where the step falls in the tour. Sorted, so gaps are fine — 10, 20, 30 leaves room. */
		order: number;
		/** The card's heading, and the first thing a screen reader hears after the position. */
		title: string;
		/** The card's body. */
		description?: string;
		className?: string;
		children: ReactNode;
	};

/**
 * Marks one control as a stop on the tour.
 *
 * A layout descriptor, not an overlay: it wraps its child in a `View` the tour measures, and it
 * is always mounted, open tour or not. It registers on mount and unregisters on unmount, so a
 * step on a screen that is not showing simply is not in the tour.
 *
 * `collapsable={false}` is load-bearing: Android flattens a `View` that only lays out its child,
 * and a flattened view has nothing to measure.
 */
export function TourStep({
	order,
	title,
	description,
	shape,
	padding,
	radius,
	placement,
	className,
	children,
	...props
}: TourStepProps): ReactElement {
	const { register } = useTourRegistryPart("Tour.Step");
	const ref = useRef<ViewInstance>(null);
	const id = useId();

	useEffect(
		() => register({ id, order, title, description, options: { shape, padding, radius, placement }, ref }),
		[register, id, order, title, description, shape, padding, radius, placement]
	);

	return (
		<View className={className} collapsable={false} ref={ref} {...props}>
			{children}
		</View>
	);
}
TourStep.displayName = "DelacourUI.Tour.Step";
