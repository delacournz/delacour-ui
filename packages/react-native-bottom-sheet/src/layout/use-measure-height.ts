import { useCallback, useEffect } from "react";
import type { LayoutChangeEvent } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import { UNMEASURED } from "../core";

/**
 * Feeds a view's height into a shared value from its `onLayout`, and resets
 * it to `UNMEASURED` when the view goes away.
 *
 * The reset is the important half. A portal that unmounts its children on
 * close takes the handle and the content with it; if their heights stayed,
 * `layoutReady` would be true for a sheet with nothing in it and the next open
 * would animate before the new content had measured. `-1` puts the open back
 * on the queue until the measurement lands again.
 *
 * Written once per part rather than shared with the container, because a part
 * only wants its own height; the container also wants its offset from the
 * window's bottom.
 */
export function useMeasureHeight(target: SharedValue<number>): (event: LayoutChangeEvent) => void {
	useEffect(
		() => () => {
			target.value = UNMEASURED;
		},
		[target]
	);

	return useCallback(
		(event: LayoutChangeEvent) => {
			const height = event.nativeEvent.layout.height;
			if (target.value !== height) target.value = height;
		},
		[target]
	);
}
