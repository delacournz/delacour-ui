import { useCallback } from "react";
import { type SharedValue, useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { playHaptic } from "../pressable";
import { resolveColumnAtOffset } from "./timeline.variants";

/**
 * The horizontal strip's reading edge: which column sits at the left content
 * inset, kept on the UI thread.
 *
 * The scroll handler resolves the column every frame from the pure offset table,
 * but only acts on a **change** — writes the shared value the titles animate off,
 * ticks the haptic from the worklet itself so it lands in the frame the column
 * crossed, and only then crosses to the JS thread with `scheduleOnRN`. So
 * `onColumnChange` fires once per change, never once per frame, and never on
 * mount.
 */
export function useTimelineReadingEdge({
	offsets,
	haptic,
	onColumnChange,
}: {
	offsets: readonly number[];
	haptic: boolean;
	onColumnChange?: (index: number) => void;
}): {
	activeColumn: SharedValue<number>;
	scrollHandler: ReturnType<typeof useAnimatedScrollHandler>;
} {
	const activeColumn = useSharedValue(offsets.length > 0 ? 0 : -1);
	const hasListener = onColumnChange !== undefined;

	const notify = useCallback(
		(index: number) => {
			onColumnChange?.(index);
		},
		[onColumnChange]
	);

	const scrollHandler = useAnimatedScrollHandler({
		onScroll: (event) => {
			const next = resolveColumnAtOffset(offsets, event.contentOffset.x);
			if (next === activeColumn.value) return;
			activeColumn.value = next;
			if (haptic) playHaptic("selection");
			if (hasListener) scheduleOnRN(notify, next);
		},
	});

	return { activeColumn, scrollHandler };
}
