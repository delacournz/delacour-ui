import { type ReactElement, useCallback, useEffect } from "react";
import { Pressable, StyleSheet, type ViewProps } from "react-native";
import Animated, { useAnimatedProps, useAnimatedStyle } from "react-native-reanimated";
import { backdropInteractive, backdropOpacity } from "../core";
import { useBottomSheet, useBottomSheetInternal } from "./bottom-sheet.context";
import type { BottomSheetOverlayProps } from "./bottom-sheet.types";

/**
 * The scrim over the app behind the sheet.
 *
 * Its opacity follows the keyboard-free index on the UI thread, so a keyboard
 * lift never dims the app and a higher snap point is no darker. Omit it and the
 * sheet has no scrim at all.
 *
 * **It is a React Native `Pressable`, never a Gesture Handler tap, and it is
 * written before the panel.** Gesture Handler resolves a touch between
 * competing gestures, so a full-screen tap gesture behind the sheet wins a
 * touch on a `TextInput`, which has no gesture of its own, and the field never
 * focuses. Native hit-testing resolves a touch by view order instead: the
 * panel is the later sibling, so a touch on it never reaches this view, and a
 * touch beside it does. Nothing here has to know where the sheet is.
 *
 * While the index is at or below `disappearsOnIndex` the view takes no
 * touches and is hidden from assistive technology, so a closed sheet's scrim
 * is not a transparent wall over the app.
 */
export function BottomSheetOverlay({
	appearsOnIndex = 0,
	disappearsOnIndex = -1,
	opacity = 1,
	pressBehavior = "close",
	enableTouchThrough = false,
	accessibilityLabel = "Close",
	onPress,
	style,
	ref,
	...props
}: BottomSheetOverlayProps): ReactElement {
	const { geometry, setHasOverlay, stepOverride } = useBottomSheetInternal();
	const { isOpen, close, collapse, snapToIndex } = useBottomSheet();
	const index = geometry.index;

	useEffect(() => {
		setHasOverlay(true);
		return () => setHasOverlay(false);
	}, [setHasOverlay]);

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: backdropOpacity(index.value, disappearsOnIndex, appearsOnIndex, opacity),
	}));

	const animatedProps = useAnimatedProps<ViewProps>(() => ({
		pointerEvents: !enableTouchThrough && backdropInteractive(index.value, disappearsOnIndex) ? "auto" : "none",
	}));

	// A step that is not dismissible takes the press away for as long as it is current.
	const behavior = stepOverride?.dismissible === false ? "none" : pressBehavior;
	const handlePress = useCallback(() => {
		onPress?.();
		if (behavior === "close") close();
		else if (behavior === "collapse") collapse();
		else if (typeof behavior === "number") snapToIndex(behavior);
	}, [onPress, behavior, close, collapse, snapToIndex]);

	const pressable = behavior !== "none";

	return (
		<Animated.View
			accessibilityElementsHidden={!isOpen}
			animatedProps={animatedProps}
			importantForAccessibility={isOpen ? "auto" : "no-hide-descendants"}
			ref={ref}
			style={[StyleSheet.absoluteFill, style, animatedStyle]}
			{...props}
		>
			<Pressable
				accessibilityLabel={accessibilityLabel}
				accessibilityRole={pressable ? "button" : undefined}
				accessible={pressable}
				disabled={!pressable}
				onPress={handlePress}
				style={styles.fill}
			/>
		</Animated.View>
	);
}
BottomSheetOverlay.displayName = "DelacourBottomSheet.BottomSheet.Overlay";

const styles = StyleSheet.create({
	fill: { flex: 1 },
});
