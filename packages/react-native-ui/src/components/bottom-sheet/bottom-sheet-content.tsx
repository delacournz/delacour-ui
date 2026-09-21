import { BottomSheetView } from "@gorhom/bottom-sheet";
import type { ReactElement } from "react";
import { View, type ViewProps } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomSheetContainerContext } from "./bottom-sheet.context";
import { BOTTOM_SHEET_FOOTER_GAP, bottomSheetVariants, resolveSheetBottomInset } from "./bottom-sheet.variants";

export type BottomSheetContentProps = ViewProps & {
	className?: string;
};

/**
 * The sheet's body — what a caller writes the title, the copy and the controls
 * into.
 *
 * Two boxes, and neither is a `withUniwind` wrapper. gorhom's `BottomSheetView`
 * is the outer one: it measures itself into the sheet's layout state, which is
 * what makes `enableDynamicSizing` size the sheet to whatever is inside. The
 * inner `View` is an ordinary React Native one and carries every class, so this
 * file wraps nothing — the same move `Screen.Footer` makes with
 * `KeyboardStickyView`.
 *
 * **A pinned footer is reserved by a spacer, not by gorhom's
 * `enableFooterMarginAdjustment`.** That prop turns the footer's measured height
 * into content-container padding through React state — a commit on every frame
 * of the keyboard animation, because the footer changes height as it gives up
 * its safe-area band. A spacer whose height is an animated style off the same
 * shared value costs nothing on the JS thread, and `Screen` already reserves its
 * own chrome exactly this way. The spacer sits OUTSIDE the classed box so the
 * content's own `gap` does not land in front of it and quietly double the
 * {@link BOTTOM_SHEET_FOOTER_GAP} the footer is held off by.
 *
 * **The safe-area band goes on the OUTER box, and only when nothing else is
 * paying for it** — a pinned footer's own box carries it, so
 * {@link resolveSheetBottomInset} withholds it here. The band comes from
 * `useSafeAreaInsets()` and never from `pb-safe`, which compiles to
 * `env(safe-area-inset-bottom)` and resolves to zero on React Native.
 *
 * @example
 * <BottomSheet.Content>
 *   <BottomSheet.Title>Delete this file?</BottomSheet.Title>
 *   <BottomSheet.Description>This cannot be undone.</BottomSheet.Description>
 * </BottomSheet.Content>
 */
export function BottomSheetContent({ className, children, style, ...props }: BottomSheetContentProps): ReactElement {
	const container = useBottomSheetContainerContext();
	const { bottom } = useSafeAreaInsets();
	const hasStickyFooter = container?.hasStickyFooter ?? false;
	const footerHeight = container?.footerHeight;
	const paddingBottom = resolveSheetBottomInset({ bottom, hasStickyFooter });

	const reserve = useAnimatedStyle(() => ({
		height: footerHeight === undefined ? 0 : footerHeight.value + BOTTOM_SHEET_FOOTER_GAP,
	}));

	return (
		<BottomSheetView style={{ paddingBottom }}>
			<View className={bottomSheetVariants().content({ className })} style={style} {...props}>
				{children}
			</View>
			{hasStickyFooter ? <Animated.View style={reserve} /> : null}
		</BottomSheetView>
	);
}
BottomSheetContent.displayName = "DelacourUI.BottomSheet.Content";
