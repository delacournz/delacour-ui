import { type ReactElement, useMemo } from "react";
import { View, type ViewProps } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { cn } from "../../lib/cn";
import { type MarqueeGroupContextValue, MarqueeGroupProvider } from "./marquee.context";
import type { MarqueePause } from "./marquee.variants";

export type MarqueeGroupProps = ViewProps & {
	/** Points per second, inherited by each `Marquee` inside that sets none. */
	speed?: number;
	/** One pause for the whole group: a press on any row holds every row. Unset, each strip keeps its own. */
	pause?: MarqueePause;
	className?: string;
};

/**
 * Holds one pause state and a default speed for every strip inside it.
 *
 * Two rows drifting opposite ways are two signs of one speed, so they stay in
 * proportion; and the group's single `isPressed` flag means a finger on either
 * row holds both, instead of one row stopping while its neighbour slides on.
 *
 * It lays nothing out; it is a plain `View` for the caller to arrange.
 */
export function MarqueeGroup({ speed, pause, className, children, ...props }: MarqueeGroupProps): ReactElement {
	const isPressed = useSharedValue(false);

	const context = useMemo<MarqueeGroupContextValue>(() => ({ isPressed, pause, speed }), [isPressed, pause, speed]);

	return (
		<MarqueeGroupProvider value={context}>
			<View className={cn(className)} {...props}>
				{children}
			</View>
		</MarqueeGroupProvider>
	);
}
MarqueeGroup.displayName = "DelacourUI.Marquee.Group";
