import { type RefObject, useCallback, useEffect, useRef } from "react";
import { Dimensions, type LayoutChangeEvent, type View } from "react-native";
import { acceptContainerLayout, UNMEASURED } from "../core";
import type { SheetSharedState } from "../state/state.types";

export type ContainerLayout = {
	ref: RefObject<View | null>;
	onLayout: (event: LayoutChangeEvent) => void;
};

/**
 * Measures the frame every sheet renders around itself.
 *
 * `onLayout` gives the height and width; `measureInWindow` gives where the
 * frame's bottom edge sits relative to the window's, which is what a keyboard
 * has to clear before it overlaps the sheet — a frame inside a tab bar's
 * screen ends above the window, and the keyboard's first pixels overlap
 * nothing.
 *
 * The height goes through `acceptContainerLayout`, which refuses Android's
 * adjustResize double-count while a keyboard is up. Inert until BSHEET-3
 * writes `keyboardHeight`, and correct once it does.
 *
 * Unmounting resets every value to `UNMEASURED`, for the same reason
 * `useMeasureHeight` does.
 */
export function useContainerLayout(state: SheetSharedState): ContainerLayout {
	const ref = useRef<View | null>(null);
	const { containerHeight, containerWidth, containerBottomOffset, keyboardHeight, keyboardProgress } = state;

	useEffect(
		() => () => {
			containerHeight.value = UNMEASURED;
			containerWidth.value = UNMEASURED;
			containerBottomOffset.value = 0;
		},
		[containerHeight, containerWidth, containerBottomOffset]
	);

	const onLayout = useCallback(
		(event: LayoutChangeEvent) => {
			const { height, width } = event.nativeEvent.layout;
			if (containerWidth.value !== width) containerWidth.value = width;

			const accepted = acceptContainerLayout({
				prev: containerHeight.value,
				next: height,
				keyboardHeight: keyboardHeight.value,
				progress: keyboardProgress.value,
			});
			if (accepted && containerHeight.value !== height) containerHeight.value = height;

			ref.current?.measureInWindow((_x, y, _width, measuredHeight) => {
				const offset = Dimensions.get("window").height - (y + measuredHeight);
				const clamped = Number.isFinite(offset) && offset > 0 ? offset : 0;
				if (containerBottomOffset.value !== clamped) containerBottomOffset.value = clamped;
			});
		},
		[containerHeight, containerWidth, containerBottomOffset, keyboardHeight, keyboardProgress]
	);

	return { ref, onLayout };
}
