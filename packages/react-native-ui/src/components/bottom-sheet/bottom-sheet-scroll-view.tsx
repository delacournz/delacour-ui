import { BottomSheetScrollView as GorhomBottomSheetScrollView } from "@gorhom/bottom-sheet";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import { View } from "react-native";
import { useAnimatedStyle } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import { cn } from "../../lib/cn";
import { useBottomSheetContainerContext } from "./bottom-sheet.context";
import { bottomSheetVariants, resolveSheetScrollEndPadding } from "./bottom-sheet.variants";

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
 * **A pinned footer shortens the scroll view; it is not reserved inside it.**
 * The footer draws over the sheet, so a scroll view that ran the sheet's full
 * height would carry its indicator and its overscroll bounce on underneath the
 * footer, the bottom of the track hidden behind the buttons. So the frame gives
 * up the footer's measured height as a `marginBottom` and ends at the footer's
 * hairline, and the content keeps only the gap
 * ({@link resolveSheetScrollEndPadding}). The margin is an animated style off
 * the footer's shared value, never gorhom's `enableFooterMarginAdjustment`,
 * which routes that height through React state and would commit a render on
 * every frame of the keyboard animation — see `BottomSheet.Content`.
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
	style,
	...props
}: BottomSheetScrollViewProps): ReactElement {
	const container = useBottomSheetContainerContext();
	const { bottom } = useSafeAreaInsets();
	const hasStickyFooter = container?.hasStickyFooter ?? false;
	const footerHeight = container?.footerHeight;

	// The footer's height, band included, as the frame's own margin — so the
	// indicator's track ends where the footer begins and follows it as the
	// keyboard takes the band back.
	const aboveFooter = useAnimatedStyle(() => ({
		marginBottom: hasStickyFooter && footerHeight !== undefined ? footerHeight.value : 0,
	}));

	return (
		<StyledScrollView
			className={cn(className)}
			contentContainerStyle={{ paddingBottom: resolveSheetScrollEndPadding({ bottom, hasStickyFooter }) }}
			{...props}
			style={[aboveFooter, style]}
		>
			<View className={bottomSheetVariants().scrollContent({ className: contentContainerClassName })}>{children}</View>
		</StyledScrollView>
	);
}
BottomSheetScrollView.displayName = "DelacourUI.BottomSheet.ScrollView";
