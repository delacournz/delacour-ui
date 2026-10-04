import { type ReactElement, useCallback, useEffect } from "react";
import { type AccessibilityActionEvent, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import { useMeasureHeight } from "../layout/use-measure-height";
import { useBottomSheet, useBottomSheetInternal } from "./bottom-sheet.context";
import type { BottomSheetHandleProps } from "./bottom-sheet.types";

const ACTIONS = [{ name: "increment" }, { name: "decrement" }, { name: "escape" }] as const;

/**
 * The grabber's row, and the sheet's one adjustable accessibility element.
 *
 * It draws nothing of its own — the skin puts the pill inside it — but it
 * owns the handle pan and reports its height into the layout, so a sheet
 * sized to its content counts it. A handle that is never written is a handle
 * of height zero; see `Container`.
 *
 * For a screen reader it is the sheet: `adjustable`, with the snap point as its
 * value, increment and decrement moving one snap point either way, and the escape
 * gesture closing. Nothing else in the sheet has to know about snap points.
 */
export function BottomSheetHandle({
	style,
	ref,
	enablePanningGesture,
	accessibilityLabel = "Bottom sheet",
	...props
}: BottomSheetHandleProps): ReactElement {
	const { state, pans, handleMounted, enableHandlePanningGesture } = useBottomSheetInternal();
	const { index, snapPointCount: count, snapToIndex, close } = useBottomSheet();
	const onLayout = useMeasureHeight(state.handleHeight);

	useEffect(() => {
		handleMounted.current = true;
		return () => {
			handleMounted.current = false;
		};
	}, [handleMounted]);

	const onAccessibilityAction = useCallback(
		(event: AccessibilityActionEvent) => {
			const action = event.nativeEvent.actionName;
			if (action === "increment") snapToIndex(index + 1);
			else if (action === "decrement") snapToIndex(index - 1);
			else if (action === "escape") close();
		},
		[index, snapToIndex, close]
	);

	// The pan is shared with every handle written in this sheet, and a gesture
	// builder mutates in place, so a per-handle opt-out leaves the detector out
	// rather than flipping a flag on the shared object.
	const enabled = enablePanningGesture ?? enableHandlePanningGesture;
	const row = (
		<View
			accessibilityActions={ACTIONS}
			accessibilityLabel={accessibilityLabel}
			accessibilityRole="adjustable"
			accessibilityValue={{ text: index < 0 ? "Closed" : `Snap point ${index + 1} of ${count}` }}
			accessible
			onAccessibilityAction={onAccessibilityAction}
			onAccessibilityEscape={close}
			onLayout={onLayout}
			ref={ref}
			style={style}
			{...props}
		/>
	);
	if (!enabled) return row;
	return <GestureDetector gesture={pans.handle}>{row}</GestureDetector>;
}
BottomSheetHandle.displayName = "DelacourBottomSheet.BottomSheet.Handle";
