import { useCallback } from "react";
import type { LayoutChangeEvent } from "react-native";
import type Animated from "react-native-reanimated";
import {
	type AnimatedRef,
	type SharedValue,
	useAnimatedReaction,
	useAnimatedRef,
	useDerivedValue,
	useSharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { type ScrollSource, useScrollSourceContext } from "../../hooks/use-scroll-source";
import {
	resolveEffectProgress,
	resolveEffectWindow,
	resolveStaticProgress,
	type ScrollCanvasEffect,
} from "./scroll-canvas.variants";

export type UseFrameProgressOptions = {
	effect: ScrollCanvasEffect;
	start?: number;
	end?: number;
	/** Drive the effect directly; nothing is measured. */
	progress?: SharedValue<number>;
	scrollSource?: ScrollSource;
	/** Hold the resting state — Reduce Motion, the calm flag, or `enabled={false}`. */
	isStill: boolean;
};

export type FrameProgress = {
	frameRef: AnimatedRef<Animated.View>;
	onLayout: (event: LayoutChangeEvent) => void;
	/** The effect's 0–1 progress, on the UI thread. */
	progress: SharedValue<number>;
	/** The frame's measured height; 0 until it lays out. */
	frameHeight: SharedValue<number>;
};

/**
 * Where a `ScrollCanvas` frame is in its effect, 0–1, derived on the UI thread
 * from the scroll offset, the frame's top in scroll-content space and the
 * viewport.
 *
 * **The frame's top comes from the first of three sources that applies.**
 * A `progress` prop needs none. A source with a scroller ref (`useScrollSource`)
 * is measured with `measureLayout` against that scroller — on layout, and again
 * whenever the content size changes, because an image loading above the canvas
 * moves it without re-laying it out. A source with no ref (a `Screen`'s) falls
 * back to `onLayout`'s `y`, which is content-space only when the frame is a
 * direct child of the scroll content container.
 *
 * Resolving the source by hand rather than through `useResolvedScrollSource` is
 * what lets a canvas driven by `progress` render with no scroller anywhere.
 */
export function useFrameProgress(options: UseFrameProgressOptions): FrameProgress {
	const { effect, start, end, progress: drive, scrollSource, isStill } = options;
	const ambient = useScrollSourceContext();
	const source = scrollSource ?? ambient;
	if (!source && !drive) {
		throw new Error(
			"`ScrollCanvas` must be given a `scrollSource` or `progress`, or rendered inside a Screen / ScrollSourceProvider."
		);
	}
	if (process.env.NODE_ENV !== "production" && source && source.orientation !== "vertical") {
		console.warn("ScrollCanvas: only a vertical scroll source is supported; the effect will not track this one.");
	}

	const frameRef = useAnimatedRef<Animated.View>();
	const frameTop = useSharedValue(0);
	const frameHeight = useSharedValue(0);
	const scroller = drive ? null : (source?.ref ?? null);

	const measure = useCallback(() => {
		const frame = frameRef.current;
		const target = scroller?.current;
		if (!frame || !target) return;
		frame.measureLayout(target, (_x, y) => {
			frameTop.value = y;
		});
	}, [frameRef, scroller, frameTop]);

	const onLayout = useCallback(
		(event: LayoutChangeEvent) => {
			const { height, y } = event.nativeEvent.layout;
			frameHeight.value = height;
			if (drive) return;
			if (scroller) {
				measure();
			} else {
				frameTop.value = y;
			}
		},
		[drive, scroller, measure, frameHeight, frameTop]
	);

	const contentSize = source?.contentSize ?? null;
	useAnimatedReaction(
		() => (contentSize ? contentSize.value : 0),
		(next, previous) => {
			if (scroller && previous !== null && next !== previous) scheduleOnRN(measure);
		},
		[contentSize, scroller, measure]
	);

	const resting = resolveStaticProgress(effect);
	const offset = source?.offset ?? null;
	const layoutSize = source?.layoutSize ?? null;

	const progress = useDerivedValue(() => {
		if (isStill) return resting;
		if (drive) {
			const value = drive.value;
			return value < 0 ? 0 : value > 1 ? 1 : value;
		}
		if (!offset || !layoutSize) return 0;

		const viewport = layoutSize.value;
		const window = resolveEffectWindow({ effect, frameHeight: frameHeight.value, viewport, start, end });
		return resolveEffectProgress({ offset: offset.value, frameTop: frameTop.value, viewport, window });
	});

	return { frameRef, onLayout, progress, frameHeight };
}
