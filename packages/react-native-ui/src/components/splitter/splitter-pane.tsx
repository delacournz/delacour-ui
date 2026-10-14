import type { ReactElement } from "react";
import type { ViewProps } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useSplitterIndex, useSplitterPart } from "./splitter.context";
import type { SplitterSlotProps } from "./splitter.types";
import { isPaneCollapsed, splitterVariants } from "./splitter.variants";

export type SplitterPaneProps = Omit<ViewProps, "style"> &
	SplitterSlotProps & {
		/** Share of the box when no layout is given. Percent. */
		defaultSize?: number;
		/** Floor, percent. Default 0. */
		minSize?: number;
		/** Ceiling, percent. Default 100. */
		maxSize?: number;
		/** Past half of `minSize` the pane collapses to `collapsedSize` instead of stopping at `minSize`. */
		isCollapsible?: boolean;
		/** Size a collapsed pane holds. Percent. Default 0. */
		collapsedSize?: number;
	};

/**
 * One region of the box.
 *
 * **Its size is a flex ratio, not a measurement.** `flexGrow` is the pane's
 * percentage straight off the shared value and `flexBasis` is zero, so Yoga
 * divides the box on the UI thread and nothing has to be measured to lay a pane
 * out. A drag writes one array and every pane follows in the same frame.
 *
 * **Its constraints are read by the root, not registered.** `minSize`,
 * `maxSize` and the rest are plain props the root reads off the element in
 * render, so there is no mount effect and no first frame with the wrong limits.
 * They are taken out of the props here and go nowhere.
 *
 * A collapsed pane is hidden from screen readers along with everything in it:
 * a region with no size has nothing a finger could reach either.
 */
export function SplitterPane({
	defaultSize: _defaultSize,
	minSize: _minSize,
	maxSize: _maxSize,
	isCollapsible: _isCollapsible,
	collapsedSize: _collapsedSize,
	className,
	children,
	...props
}: SplitterPaneProps): ReactElement {
	const index = useSplitterIndex();
	const { sizes, variant, orientation, layout, constraints } = useSplitterPart("Splitter.Pane");
	const isCollapsed = isPaneCollapsed(layout, index, constraints);

	const style = useAnimatedStyle(() => ({
		flexBasis: 0,
		flexGrow: sizes.value[index] ?? 0,
		flexShrink: 1,
	}));

	return (
		<Animated.View
			accessibilityElementsHidden={isCollapsed}
			className={splitterVariants({ orientation, variant }).pane({ className })}
			importantForAccessibility={isCollapsed ? "no-hide-descendants" : "auto"}
			style={style}
			{...props}
		>
			{children}
		</Animated.View>
	);
}
SplitterPane.displayName = "DelacourUI.Splitter.Pane";
