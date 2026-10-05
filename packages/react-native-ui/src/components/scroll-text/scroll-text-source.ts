import { useEffect } from "react";
import { useWindowDimensions } from "react-native";
import type Animated from "react-native-reanimated";
import {
	type AnimatedRef,
	measure,
	type SharedValue,
	useAnimatedReaction,
	useSharedValue,
} from "react-native-reanimated";
import { useScreenContext } from "../screen/screen.context";
import type { ScrollTextSource } from "./scroll-text.types";
import { resolveScrollProgress, resolveScrollTextWindow, type ScrollTextWindow } from "./scroll-text.variants";

let hasWarnedOutsideScreen = false;

export type ScrollTextProgress = {
	/** 0..1 for the whole block. Units stagger off this. */
	progress: SharedValue<number>;
	/** Call from the block's `onLayout`, so a block that moved without a scroll re-reads its place. */
	remeasure: () => void;
};

/**
 * The block's progress through its window, computed on the UI thread.
 *
 * Whenever the trigger — a `scrollY`, or a layout pass — changes, the block is
 * `measure`d and its `pageY` read against the viewport. Nesting depth, headers
 * and insets therefore never have to be added up by hand: the page position
 * already includes them. Nothing here touches React state, so scrolling never
 * re-renders the JS thread.
 *
 * Progress is pinned to 1, with no listener at all, under calm motion and for a
 * `screen` source with no `Screen` above it (with a one-time development
 * warning). A `progress` source is handed back as is.
 */
export function useScrollTextProgress({
	source,
	window,
	target,
	isCalm,
}: {
	source: ScrollTextSource;
	window: ScrollTextWindow | undefined;
	target: AnimatedRef<Animated.View>;
	isCalm: boolean;
}): ScrollTextProgress {
	const screen = useScreenContext();
	const { height: windowHeight } = useWindowDimensions();
	const own = useSharedValue(isCalm ? 1 : 0);
	const tick = useSharedValue(0);
	const idle = useSharedValue(0);

	const isDetached = source.kind === "screen" && screen === null;
	const isLive = !isCalm && !isDetached && source.kind !== "progress";

	const trigger = source.kind === "offset" ? source.scrollY : (screen?.scrollY ?? idle);
	const layoutHeight = source.kind === "screen" && screen ? screen.layoutHeight : idle;
	const viewport = source.kind === "offset" ? source.viewport : undefined;
	const { start, end } = resolveScrollTextWindow(window);

	useEffect(() => {
		if (!isLive) own.value = 1;
	}, [isLive, own]);

	useEffect(() => {
		if (__DEV__ && isDetached && !hasWarnedOutsideScreen) {
			hasWarnedOutsideScreen = true;
			console.warn(
				'ScrollText: `source: { kind: "screen" }` needs a <Screen> above it. Rendering revealed; pass an `offset` or `progress` source instead.'
			);
		}
	}, [isDetached]);

	useAnimatedReaction(
		() => {
			if (!isLive) return -1;
			// Read for the dependency: either one changing re-runs the measure.
			const scrolled = trigger.value + tick.value;
			const block = measure(target);
			if (!block || !Number.isFinite(scrolled)) return -1;

			let top = block.pageY;
			let viewportHeight = layoutHeight.value > 0 ? layoutHeight.value : windowHeight;
			if (viewport) {
				const bounds = measure(viewport);
				if (!bounds) return -1;
				top -= bounds.pageY;
				viewportHeight = bounds.height;
			}

			return resolveScrollProgress(top, viewportHeight, { start, end });
		},
		(next) => {
			if (next >= 0) own.value = next;
		},
		[isLive, start, end, windowHeight, viewport]
	);

	const remeasure = (): void => {
		tick.value += 1;
	};

	return { progress: !isCalm && source.kind === "progress" ? source.progress : own, remeasure };
}
