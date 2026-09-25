import { type ReactElement, type ReactNode, useMemo } from "react";
import { View, type ViewProps } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { cn } from "../../lib/cn";
import { type SkeletonGroupContextValue, SkeletonGroupProvider } from "./skeleton.context";
import { resolveSkeletonAccessibility, resolveSkeletonAnimation, type SkeletonAnimation } from "./skeleton.variants";
import { useSkeletonClock } from "./skeleton-clock";

export type SkeletonGroupProps = Omit<ViewProps, "children"> & {
	/** Whether the group's content is still loading. Every skeleton inside follows it unless told otherwise. Defaults to `true`. */
	isLoading?: boolean;
	/** The animation every skeleton inside runs unless it names its own. Defaults to `shimmer`. */
	animation?: SkeletonAnimation;
	/**
	 * What is loading, for a screen reader. Announced once for the whole group, as
	 * a busy status, while it loads. Leave the skeletons inside unlabelled.
	 */
	label?: string;
	className?: string;
	children?: ReactNode;
};

/**
 * Holds one clock for every skeleton inside it, and one loading flag.
 *
 * Separate placeholders each start their own clock when they mount, so a list
 * whose rows arrive a frame apart shimmers out of step — a ripple of unrelated
 * glints instead of one sweep. Inside a group they all read this clock, so they
 * move together, and flipping one `isLoading` reveals the whole region at once.
 *
 * It lays nothing out; it is a plain `View` for the caller to arrange.
 */
export function SkeletonGroup({
	isLoading = true,
	animation,
	label,
	className,
	children,
	...props
}: SkeletonGroupProps): ReactElement {
	const isReduceMotion = useReducedMotion();
	const resolvedAnimation = resolveSkeletonAnimation(animation, isReduceMotion);
	const isRunning = isLoading && resolvedAnimation !== "none";
	const progress = useSkeletonClock(isRunning);

	const context = useMemo<SkeletonGroupContextValue>(
		() => ({ animation: resolvedAnimation, isLoading, isRunning, progress }),
		[resolvedAnimation, isLoading, isRunning, progress]
	);

	// Only a labelled group takes a role. An unlabelled one may hold real
	// content beside its placeholders, and hiding it would hide that too — each
	// skeleton already hides itself.
	const accessibility = label ? resolveSkeletonAccessibility({ isLoading, label }).props : undefined;

	return (
		<SkeletonGroupProvider value={context}>
			<View className={cn(className)} {...accessibility} {...props}>
				{children}
			</View>
		</SkeletonGroupProvider>
	);
}
SkeletonGroup.displayName = "DelacourUI.Skeleton.Group";
