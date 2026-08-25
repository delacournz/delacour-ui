import type { BottomSheetHandleProps as GorhomBottomSheetHandleProps } from "@gorhom/bottom-sheet";
import type { ReactElement } from "react";
import { View, type ViewProps } from "react-native";
import { bottomSheetVariants } from "./bottom-sheet.variants";

export type BottomSheetHandleProps = Partial<GorhomBottomSheetHandleProps> &
	Omit<ViewProps, "children"> & {
		className?: string;
		/** Style for the pill itself. What gorhom's `handleIndicatorStyle` becomes. */
		indicatorStyle?: ViewProps["style"];
		indicatorClassName?: string;
	};

/**
 * The grabber at the top of the sheet.
 *
 * Supplied to gorhom as `handleComponent` for the same reason the background is:
 * this package paints with classNames, and gorhom's `handleStyle` /
 * `handleIndicatorStyle` cannot carry one. Both still arrive — gorhom passes
 * them down as `style` and `indicatorStyle` — so a caller who has a style object
 * rather than a class is not locked out.
 *
 * The pill is drawn but never announced: gorhom's own handle container wraps this
 * in the `Animated.View` that owns the pan and carries the accessibility surface,
 * so a second announced element here would put a nameless control in front of
 * every sheet.
 *
 * The two animated variables are destructured off rather than spread — see
 * `BottomSheetBackground`.
 */
export function BottomSheetHandle({
	animatedIndex: _animatedIndex,
	animatedPosition: _animatedPosition,
	className,
	indicatorClassName,
	indicatorStyle,
	...props
}: BottomSheetHandleProps): ReactElement {
	const slots = bottomSheetVariants();

	return (
		<View className={slots.handle({ className })} {...props}>
			<View className={slots.handleIndicator({ className: indicatorClassName })} style={indicatorStyle} />
		</View>
	);
}
BottomSheetHandle.displayName = "DelacourUI.BottomSheet.Handle";
