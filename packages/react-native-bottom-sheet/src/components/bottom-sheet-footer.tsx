import { type ReactElement, useLayoutEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { bottomBand } from "../core";
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
 * keyboard's top edge without ever moving. Its one view — the one that takes
 * `style` and `padding` — pads through the resting safe-area band as well, so
 * the surface a caller styles reaches the sheet's bottom line and its
 * background covers the band: while the sheet is dragged below its detent the
 * footer holds the screen's bottom edge and the body slides down behind it,
 * and a transparent band would show every line that passed. The box is
 * measured less the band into `footerContentHeight`, which the dynamic detent
 * counts. The band is constant on purpose — the footer's translate does the
 * collapsing, and padding that shrank as well would move the footer twice.
 *
 * The bottom padding is composed on the JS side from the flattened style, so a
 * `paddingBottom`, `paddingVertical` or `padding` a caller writes still
 * applies above the band; one given as a string cannot be added to and is
 * read as zero.
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
	const { state, geometry, setHasFooter, detached, bottomInset } = useBottomSheetInternal();
	const band = bottomBand(detached !== null, bottomInset);
	const onLayout = useMeasureHeight(state.footerContentHeight, band);
	const { footerTop } = geometry;

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

	// Typed by `flatten` from the `style` prop, not as `ViewStyle`: React Native
	// 0.88's `View` takes its generated style type, and in an Expo app
	// `expo/types` widens the public `ViewStyle` with web-only values the
	// generated one refuses, so a `ViewStyle` handed back to the `View` fails
	// to typecheck there — and only there.
	const inner = useMemo(() => {
		const flat = StyleSheet.flatten([padding === undefined ? null : { padding }, style]) ?? {};
		return flat;
	}, [padding, style]);
	const surface = useMemo(() => {
		if (!sticky) return inner;
		const own = inner.paddingBottom ?? inner.paddingVertical ?? inner.padding ?? 0;
		return { ...inner, paddingBottom: (typeof own === "number" ? own : 0) + band };
	}, [inner, sticky, band]);

	if (!sticky) {
		return (
			<View ref={ref} style={surface} {...props}>
				{children}
			</View>
		);
	}
	return (
		<Animated.View pointerEvents="box-none" style={[styles.sticky, translate]}>
			<View onLayout={onLayout} ref={ref} style={surface} {...props}>
				{children}
			</View>
		</Animated.View>
	);
}
BottomSheetFooter.displayName = "DelacourBottomSheet.BottomSheet.Footer";

const styles = StyleSheet.create({
	sticky: { left: 0, position: "absolute", right: 0, top: 0, zIndex: 1 },
});
