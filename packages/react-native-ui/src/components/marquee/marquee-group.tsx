import { type ReactElement, useMemo } from "react";
import { View, type ViewProps } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { useControllableState } from "../../hooks/use-controllable-state";
import { cn } from "../../lib/cn";
import { type MarqueeGroupContextValue, MarqueeGroupProvider } from "./marquee.context";
import type { MarqueePause } from "./marquee.variants";

export type MarqueeGroupProps = ViewProps & {
	/** Points per second, inherited by each `Marquee` inside that sets none. */
	speed?: number;
	/** One pause for the whole group: a press on any row holds every row. Unset, each strip keeps its own. */
	pause?: MarqueePause;
	/** Pauses every strip inside — the persistent pause an app wires to its own control. Wins over a strip's own `isPaused`. Controlled. */
	isPaused?: boolean;
	/** Whether the group starts paused when `isPaused` is not set. Default `false`. */
	defaultPaused?: boolean;
	/** Called when a strip's accessibility action pauses or resumes the group. */
	onPausedChange?: (isPaused: boolean) => void;
	className?: string;
};

/**
 * Holds one pause state and a default speed for every strip inside it.
 *
 * Two rows drifting opposite ways are two signs of one speed, so they stay in
 * proportion; and the group's single `isPressed` flag means a finger on either
 * row holds both, instead of one row stopping while its neighbour slides on.
 *
 * It also holds the user's pause for the strips inside, which wins over theirs,
 * so a paused group never has one row sliding on.
 *
 * It lays nothing out; it is a plain `View` for the caller to arrange.
 */
export function MarqueeGroup({
	speed,
	pause,
	isPaused: isPausedProp,
	defaultPaused = false,
	onPausedChange,
	className,
	children,
	...props
}: MarqueeGroupProps): ReactElement {
	const isPressed = useSharedValue(false);
	const [isPaused, setPaused] = useControllableState({
		value: isPausedProp,
		defaultValue: defaultPaused,
		onChange: onPausedChange,
	});

	const context = useMemo<MarqueeGroupContextValue>(
		() => ({ isPaused, isPressed, onPausedChange: setPaused, pause, speed }),
		[isPaused, isPressed, setPaused, pause, speed]
	);

	return (
		<MarqueeGroupProvider value={context}>
			<View className={cn(className)} {...props}>
				{children}
			</View>
		</MarqueeGroupProvider>
	);
}
MarqueeGroup.displayName = "DelacourUI.Marquee.Group";
