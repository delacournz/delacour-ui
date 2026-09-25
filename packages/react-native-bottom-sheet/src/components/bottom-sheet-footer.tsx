import { type ReactElement, useLayoutEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useMeasureHeight } from "../layout/use-measure-height";
import { useBottomSheetInternal } from "./bottom-sheet.context";
import type { BottomSheetFooterProps } from "./bottom-sheet.types";

/**
 * The footer — a row that stays put while the body scrolls and rides the
 * keyboard up by transform.
 *
 * Sticky (the default), it is absolutely positioned at the top of the panel
 * and translated to the geometry's `footerTop`, which the core proves is
 * constant for the whole of a keyboard animation: the keyboard's pixels come
 * off the lift in step with `progress`, so the footer's bottom lands on the
 * keyboard's top edge without ever moving. Its inner view — the one that
 * takes `style` and `padding` — is measured into `footerContentHeight`, which
 * the dynamic detent counts, and a spacer the height of the resting
 * safe-area band sits under it so the content clears the home indicator. The
 * band is constant on purpose — the footer's translate does the collapsing,
 * and a spacer that shrank as well would move the footer twice.
 *
 * Mounting tells the root there is a footer — synchronously, so the flag is
 * in the config before any measurement lands — and the layout then waits
 * for the footer's own measurement before the first open, while the body
 * reserves a trailing space its height. Written inside `Container`, after
 * the body.
 *
 * `sticky={false}` is a plain `View` for a footer that should scroll with
 * the content; write it inside the body then.
 */
export function BottomSheetFooter({
	children,
	style,
	ref,
	sticky = true,
	padding,
	...props
}: BottomSheetFooterProps): ReactElement {
	const { state, geometry, setHasFooter } = useBottomSheetInternal();
	const onLayout = useMeasureHeight(state.footerContentHeight);
	const { footerTop, band } = geometry;

	// A layout effect, not a passive one: the flag has to reach the root's
	// config before the handle and the content report their heights, or the
	// first open resolves on a detent with no footer in it and the mount
	// animation, already running, keeps the corrected list from applying.
	useLayoutEffect(() => {
		if (!sticky) return;
		setHasFooter(true);
		return () => setHasFooter(false);
	}, [sticky, setHasFooter]);

	const translate = useAnimatedStyle(() => ({
		transform: [{ translateY: footerTop.value }],
	}));
	const spacer = useAnimatedStyle(() => ({
		height: band.value > 0 ? band.value : 0,
	}));

	const inner = padding === undefined ? style : [{ padding }, style];
	if (!sticky) {
		return (
			<View ref={ref} style={inner} {...props}>
				{children}
			</View>
		);
	}
	return (
		<Animated.View pointerEvents="box-none" style={[styles.sticky, translate]}>
			<View onLayout={onLayout} ref={ref} style={inner} {...props}>
				{children}
			</View>
			<Animated.View pointerEvents="none" style={spacer} />
		</Animated.View>
	);
}
BottomSheetFooter.displayName = "DelacourBottomSheet.BottomSheet.Footer";

const styles = StyleSheet.create({
	sticky: { left: 0, position: "absolute", right: 0, top: 0, zIndex: 1 },
});
