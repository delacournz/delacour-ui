import { BottomSheetScrollView as GorhomBottomSheetScrollView } from "@gorhom/bottom-sheet";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import { View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import { cn } from "@registry/lib/cn";
import { useBottomSheetContainerContext } from "./bottom-sheet.context";
import { BOTTOM_SHEET_FOOTER_GAP, bottomSheetVariants, resolveSheetBottomInset } from "./bottom-sheet.variants";

type GorhomScrollViewProps = ComponentProps<typeof GorhomBottomSheetScrollView>;

/**
 * The one class prop this file uses, restated so the props survive the wrapper.
 *
 * `withUniwind`'s return type maps over a component's props, and over a
 * scrollable's animated ones it collapses to a single entry — `data`,
 * `contentContainerStyle` and the rest would all check against nothing. Writing
 * the signature out keeps them, the way `Screen.LegendList` already has to.
 *
 * `contentContainerClassName` is deliberately absent even though the wrapper adds
 * one at runtime: passing it would put a second writer on `contentContainerStyle`
 * and cost the safe-area band — see the component's doc comment.
 */
type StyledScrollViewComponent = (props: GorhomScrollViewProps & { className?: string }) => ReactElement | null;

// Third-party, so `className` needs the wrapper — and it has to be built at
// module scope or every render mints a new component type and remounts the list.
const StyledScrollView = withUniwind(GorhomBottomSheetScrollView) as unknown as StyledScrollViewComponent;

export type BottomSheetScrollViewProps = Omit<
	GorhomScrollViewProps,
	"children" | "contentContainerStyle" | "enableFooterMarginAdjustment"
> & {
	className?: string;
	/** Classes for the padded box the children sit in. */
	contentContainerClassName?: string;
	children?: ReactNode;
};

/**
 * A scrolling body for a sheet taller than its snap point.
 *
 * Use this rather than a plain `ScrollView`: gorhom's scrollable and the sheet's
 * pan negotiate with each other, so dragging a list that is already at its top
 * moves the sheet instead of fighting it. A React Native `ScrollView` in here has
 * no such arrangement, and the sheet stops responding to a drag over the list.
 *
 * **It needs a height to scroll within.** With `enableDynamicSizing` left on, the
 * sheet grows to whatever the content measures and there is nothing to scroll —
 * pass `enableDynamicSizing={false}` and explicit `snapPoints` on the
 * `BottomSheet.Container` around it.
 *
 * The classes go on an inner `View`, not on gorhom's own content container, and
 * that is not tidiness: uniwind compiles a `contentContainerClassName` into an
 * *array* alongside any `contentContainerStyle`, and the two then fight over the
 * one style this component has to own — the safe-area band. One writer for it.
 *
 * A pinned footer is reserved by a spacer at the end of the content rather than
 * by gorhom's `enableFooterMarginAdjustment`, which routes the footer's measured
 * height through React state and would commit a render on every frame of the
 * keyboard animation. See `BottomSheet.Content` for the whole reasoning.
 *
 * @example
 * <BottomSheet.Container enableDynamicSizing={false} snapPoints={["60%", "90%"]}>
 *   <BottomSheet.ScrollView>{rows}</BottomSheet.ScrollView>
 * </BottomSheet.Container>
 */
export function BottomSheetScrollView({
	className,
	contentContainerClassName,
	children,
	...props
}: BottomSheetScrollViewProps): ReactElement {
	const container = useBottomSheetContainerContext();
	const { bottom } = useSafeAreaInsets();
	const hasStickyFooter = container?.hasStickyFooter ?? false;
	const footerHeight = container?.footerHeight;

	const reserve = useAnimatedStyle(() => ({
		height: footerHeight === undefined ? 0 : footerHeight.value + BOTTOM_SHEET_FOOTER_GAP,
	}));

	return (
		<StyledScrollView
			className={cn(className)}
			contentContainerStyle={{ paddingBottom: resolveSheetBottomInset({ bottom, hasStickyFooter }) }}
			{...props}
		>
			<View className={bottomSheetVariants().scrollContent({ className: contentContainerClassName })}>{children}</View>
			{hasStickyFooter ? <Animated.View style={reserve} /> : null}
		</StyledScrollView>
	);
}
BottomSheetScrollView.displayName = "DelacourUI.BottomSheet.ScrollView";
