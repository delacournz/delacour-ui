import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { SharedValue } from "react-native-reanimated";
import type { SkeletonAnimation } from "./skeleton.variants";

export type SkeletonGroupContextValue = {
	/** The group's clock, 0 → 1 once per cycle. Only meaningful while `isRunning`. */
	progress: SharedValue<number>;
	/** Whether the clock is ticking — the group is loading and has an animation to run. */
	isRunning: boolean;
	/** The animation the group resolved, reduce-motion already applied. */
	animation: SkeletonAnimation;
	/** Whether the group's content is still loading. */
	isLoading: boolean;
};

const SkeletonGroupContext = createContext<SkeletonGroupContextValue | null>(null);

/**
 * Supplies a `Skeleton.Group`'s clock and loading state to every skeleton in
 * its subtree.
 *
 * Lives in its own module, importing nothing but React and types, so the root
 * and the group can both read it without importing each other. See AGENTS.md
 * rule 3.
 */
export function SkeletonGroupProvider({
	value,
	children,
}: {
	value: SkeletonGroupContextValue;
	children: ReactNode;
}): ReactElement {
	return <SkeletonGroupContext value={value}>{children}</SkeletonGroupContext>;
}
SkeletonGroupProvider.displayName = "DelacourUI.Skeleton.GroupProvider";

/**
 * The enclosing `Skeleton.Group`, or null outside one.
 *
 * Optional by design: a skeleton is complete on its own, and a group only
 * synchronises the ones it holds.
 */
export function useSkeletonGroup(): SkeletonGroupContextValue | null {
	return use(SkeletonGroupContext);
}
