import { type ReactElement, type ReactNode, useEffect } from "react";
import { View, type ViewProps } from "react-native";
import Animated, {
	useAnimatedRef,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { cn } from "../../lib/cn";
import { useSkeletonGroup } from "./skeleton.context";
import {
	resolveSkeletonAccessibility,
	resolveSkeletonAnimation,
	resolveSkeletonLineWidths,
	SKELETON_REVEAL_MS,
	type SkeletonAnimation,
	type SkeletonShape,
	skeletonPulseOpacity,
	skeletonVariants,
} from "./skeleton.variants";
import { useSkeletonClock } from "./skeleton-clock";
import { SkeletonGroup } from "./skeleton-group";
import { SkeletonShimmer } from "./skeleton-shimmer";

export type SkeletonProps = Omit<ViewProps, "children"> & {
	/** `rect` (a card or an image), `line` (a line of text) or `circle` (an avatar). Defaults to `rect`. */
	shape?: SkeletonShape;
	/**
	 * `shimmer` sweeps a glint across the placeholder, `pulse` breathes its
	 * opacity, `none` holds it still. Inherited from an enclosing `Skeleton.Group`,
	 * then `shimmer`. Every animation stills under the OS reduce-motion setting.
	 */
	animation?: SkeletonAnimation;
	/**
	 * Whether the content is still loading. Inherited from an enclosing
	 * `Skeleton.Group`, then `true`. Flipped off, the placeholder gives way to its
	 * children, which fade in.
	 */
	isLoading?: boolean;
	/**
	 * What is loading, for a screen reader. Setting it makes this skeleton
	 * announce as a busy status; leaving it unset keeps the placeholder out of the
	 * accessibility tree. Label the one skeleton standing for a region, not all of them.
	 */
	label?: string;
	className?: string;
	/**
	 * The real content. Rendered invisibly underneath while loading, so the
	 * placeholder takes its exact size and nothing moves when it lands.
	 */
	children?: ReactNode;
};

function SkeletonRoot({
	shape = "rect",
	animation,
	isLoading,
	label,
	className,
	style,
	children,
	...props
}: SkeletonProps): ReactElement {
	const group = useSkeletonGroup();
	const isReduceMotion = useReducedMotion();

	const loading = isLoading ?? group?.isLoading ?? true;
	const resolvedAnimation = resolveSkeletonAnimation(animation ?? group?.animation, isReduceMotion);
	const isAnimating = loading && resolvedAnimation !== "none";

	// One clock drives either animation, so a group's clock serves every
	// skeleton inside it whatever each of them draws. A skeleton starts its own
	// only when there is no running group clock to share.
	const groupClock = group?.isRunning ? group.progress : undefined;
	const ownClock = useSkeletonClock(isAnimating && groupClock === undefined);
	const progress = groupClock ?? ownClock;

	const root = useAnimatedRef<Animated.View>();
	const reveal = useSharedValue(loading ? 0 : 1);

	useEffect(() => {
		// Hidden at once when loading starts again; faded in when it stops. The
		// default reduce-motion policy makes the fade instant under that setting.
		reveal.value = loading ? 0 : withTiming(1, { duration: SKELETON_REVEAL_MS });
	}, [loading, reveal]);

	const isPulsing = isAnimating && resolvedAnimation === "pulse";

	const pulseStyle = useAnimatedStyle(() => ({
		opacity: isPulsing ? skeletonPulseOpacity(progress.value) : 1,
	}));

	const revealStyle = useAnimatedStyle(() => ({ opacity: reveal.value }));

	const hasChildren = children !== undefined && children !== null && children !== false;
	const slots = skeletonVariants({ isEmpty: !hasChildren, isLoading: loading, shape });
	const accessibility = resolveSkeletonAccessibility({ isLoading: loading, label });

	// The pulse owns opacity, so its style goes after the caller's.
	return (
		<Animated.View
			className={slots.root({ className })}
			ref={root}
			style={[style, pulseStyle]}
			{...accessibility.props}
			{...props}
		>
			{hasChildren ? (
				<Animated.View className={slots.content()} pointerEvents={loading ? "none" : "auto"} style={revealStyle}>
					{children}
				</Animated.View>
			) : null}
			{isAnimating && resolvedAnimation === "shimmer" ? <SkeletonShimmer container={root} progress={progress} /> : null}
		</Animated.View>
	);
}

export type SkeletonLinesProps = Omit<SkeletonProps, "shape" | "children" | "style"> & {
	/** How many lines to draw. Defaults to 3. */
	lines?: number;
	/** How far across the last line runs, 0–1. Only applies with two or more lines. Defaults to 0.6. */
	lastLineWidth?: number;
	/** Classes for each line — a height to match the text it stands in for, say. */
	lineClassName?: string;
	/** The paragraph itself, shown in place of the lines once loaded. */
	children?: ReactNode;
};

/**
 * A paragraph of placeholder lines, the last one shortened the way prose ends.
 *
 * Lives in the root file because it composes `SkeletonRoot` directly — a file of
 * its own would have to import `./skeleton` and close a cycle. Its lines read
 * the enclosing group's clock, or one the paragraph holds itself when there is
 * no group, so they always glint in step. The label goes on the paragraph,
 * never on each line.
 */
function SkeletonLines({
	lines = 3,
	lastLineWidth,
	lineClassName,
	animation,
	isLoading,
	label,
	className,
	children,
	...props
}: SkeletonLinesProps): ReactElement {
	const group = useSkeletonGroup();
	const loading = isLoading ?? group?.isLoading ?? true;

	if (!loading) {
		return (
			<View className={className} {...props}>
				{children}
			</View>
		);
	}

	const widths = resolveSkeletonLineWidths(lines, lastLineWidth);
	const containerClassName = cn("w-full gap-2", className);

	// Lines are positional and never reorder, so the index is their identity.
	const content = widths.map((width, index) => (
		<SkeletonRoot
			animation={animation}
			className={lineClassName}
			isLoading
			key={`line-${index.toString()}`}
			shape="line"
			style={{ width }}
		/>
	));

	// Inside a group the lines already share its clock, so the paragraph is a
	// plain container. Alone, it becomes a group of its own — otherwise a line
	// added later starts a clock of its own and glints out of step with the rest.
	if (group) {
		const accessibility = resolveSkeletonAccessibility({ isLoading: true, label });
		return (
			<View className={containerClassName} {...accessibility.props} {...props}>
				{content}
			</View>
		);
	}

	return (
		<SkeletonGroup animation={animation} className={containerClassName} label={label} {...props}>
			{content}
		</SkeletonGroup>
	);
}
SkeletonLines.displayName = "DelacourUI.Skeleton.Lines";

/**
 * A placeholder standing in for content that is still loading.
 *
 * Drawn as a tinted shape — `rect`, `line` or `circle` — with a glint of
 * `elevated` sweeping across it on the UI thread, or a pulse of its opacity.
 * Under the OS reduce-motion setting it holds still: the shape is the message.
 *
 * Give it the size of the content it replaces, or pass that content as children
 * and let it take the size itself — the content is rendered invisibly
 * underneath, so nothing moves when `isLoading` flips off and it fades in.
 *
 * Hidden from screen readers unless given a `label`; label the one skeleton
 * that stands for a region and leave the rest silent.
 *
 * @example
 * <View className="flex-row items-center gap-3">
 *   <Skeleton shape="circle" />
 *   <Skeleton.Lines className="flex-1" lines={2} />
 * </View>
 *
 * @example
 * <Skeleton isLoading={!user} shape="circle">
 *   <Avatar user={user} />
 * </Skeleton>
 *
 * @example
 * <Skeleton.Group isLoading={isFetching} label="Loading inbox">
 *   {rows.map((row) => <Row key={row.id} row={row} />)}
 * </Skeleton.Group>
 */
export const Skeleton = Object.assign(SkeletonRoot, {
	/** One clock and one loading flag for every skeleton inside — they shimmer in step and reveal together. */
	Group: SkeletonGroup,
	/** A paragraph of placeholder lines, the last one shortened. */
	Lines: SkeletonLines,
	displayName: "DelacourUI.Skeleton",
});
