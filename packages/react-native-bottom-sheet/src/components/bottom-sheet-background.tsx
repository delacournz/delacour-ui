import type { ReactElement } from "react";
import { StyleSheet, View } from "react-native";
import type { BottomSheetBackgroundProps } from "./bottom-sheet.types";

/**
 * The panel's surface: an absolute fill behind the handle and the body that
 * takes no touches. Colour, radius and shadow arrive as `style` — this is
 * where a skin puts `rounded-t-2xl bg-popover`, and a detached sheet rounds
 * every corner here.
 */
export function BottomSheetBackground({ style, ref, ...props }: BottomSheetBackgroundProps): ReactElement {
	return <View pointerEvents="none" ref={ref} style={[StyleSheet.absoluteFill, style]} {...props} />;
}
BottomSheetBackground.displayName = "DelacourBottomSheet.BottomSheet.Background";
