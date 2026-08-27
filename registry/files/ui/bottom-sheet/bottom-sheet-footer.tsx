import { BottomSheetFooter as GorhomBottomSheetFooter } from "@gorhom/bottom-sheet";
import { type ComponentProps, type ReactElement, type ReactNode, useCallback, useEffect } from "react";
import { type LayoutChangeEvent, View, type ViewProps } from "react-native";
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import Animated, { type SharedValue, useAnimatedStyle } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BOTTOM_SHEET_FOOTER_PADDING, bottomSheetVariants } from "./bottom-sheet.variants";

type GorhomFooterProps = ComponentProps<typeof GorhomBottomSheetFooter>;

export type BottomSheetFooterProps = Omit<ViewProps, "children"> & {
	/**
	 * Pin the footer to the bottom of the sheet, above the keyboard, instead of
	 * leaving it in the content's flow.
	 *
	 * Off by default, matching `Screen.Footer` — a footer holding a submit button
	 * under a short sheet wants to sit where it was written, and a sheet only
	 * needs the pinned treatment once its body can scroll under one.
	 *
	 * @default false
	 */
	sticky?: boolean;
	className?: string;
	children?: ReactNode;
	/**
	 * The sheet's own footer position. Injected by `BottomSheet.Container` when it
	 * hoists a sticky footer; never written at a call site.
	 */
	animatedFooterPosition?: GorhomFooterProps["animatedFooterPosition"];
	/**
	 * Where this footer publishes its measured height. Injected alongside the
	 * position, and read by whatever the sheet's body is so it can reserve exactly
	 * what the footer covers. Never written at a call site.
	 */
	footerHeight?: SharedValue<number>;
};

/**
 * A row of controls at the bottom of the sheet — pinned, or in the flow.
 *
 * **A sticky footer is not rendered where it is written.** gorhom takes it as a
 * `footerComponent` render prop rather than as a child, so
 * `BottomSheet.Container` lifts this element out of its children and clones it
 * into that slot with the sheet's animated footer position attached. An inline
 * footer needs none of that and stays exactly where it was put.
 *
 * The two branches deliberately look different. An inline footer is in the flow
 * and inherits the sheet's surface; a pinned one draws OVER the content, so it
 * brings a background and a top hairline of its own — without them the content
 * scrolls straight through it and its buttons are legible only where they happen
 * to overlap blank space. That is `Screen.Footer`'s rule about its backing, one
 * component along.
 *
 * **A pinned footer is TALLER by the safe-area band; it is not moved up by it.**
 * gorhom's own `bottomInset` translates the whole footer up instead, which
 * leaves a band the height of the home indicator between the footer and the
 * bottom of the sheet — and the content scrolls through it in plain view. So
 * `bottomInset` stays 0 and the band becomes the footer's own `paddingBottom`,
 * which puts its surface against the bottom of the screen where it belongs.
 *
 * The keyboard then needs that band back, and **only that band**. Its own
 * padding stays, so the controls never end up flush against the keyboard, and
 * the footer genuinely gets shorter rather than sliding down — which is what
 * lets the body's reserve shrink with it instead of over-reserving by the height
 * of a home indicator that is no longer there.
 *
 * It publishes its measured height into the sheet, and `BottomSheet.Content` and
 * `BottomSheet.ScrollView` reserve exactly that plus a gap. The height is a
 * shared value read by an animated spacer, never content-container padding —
 * `Screen` reserves its own chrome the same way and for the same reason.
 *
 * **Do not put a `KeyboardStickyView` in here.** gorhom's `animatedFooterPosition`
 * already carries the footer clear of the keyboard; this translate only gives up
 * the safe-area band on top of that. A third mechanism moving the same view
 * would fight both for prop ownership every frame.
 *
 * Written with `sticky` but rendered outside a container, it falls back to the
 * inline branch rather than throwing: there is no footer position to ride, and a
 * row of buttons in the flow is the useful failure.
 *
 * @example
 * <BottomSheet.Footer>
 *   <Button onPress={save}>Save</Button>
 * </BottomSheet.Footer>
 *
 * @example
 * <BottomSheet.Footer sticky>
 *   <Button onPress={submit}>Submit</Button>
 * </BottomSheet.Footer>
 */
export function BottomSheetFooter({
	animatedFooterPosition,
	className,
	children,
	footerHeight,
	onLayout,
	sticky = false,
	style,
	...props
}: BottomSheetFooterProps): ReactElement {
	const { bottom } = useSafeAreaInsets();
	const { progress } = useReanimatedKeyboardAnimation();
	const slots = bottomSheetVariants();

	// The footer keeps its own padding and gives up only the safe-area band, which
	// collapses as the keyboard arrives. `progress` runs 0 → 1 over the keyboard's
	// own animation, so the two travel together.
	const padding = useAnimatedStyle(() => ({
		paddingBottom: BOTTOM_SHEET_FOOTER_PADDING + bottom * (1 - progress.value),
		paddingTop: BOTTOM_SHEET_FOOTER_PADDING,
	}));

	const handleLayout = useCallback(
		(event: LayoutChangeEvent) => {
			if (footerHeight) footerHeight.value = event.nativeEvent.layout.height;
			onLayout?.(event);
		},
		[footerHeight, onLayout]
	);

	useEffect(() => {
		return () => {
			if (footerHeight) footerHeight.value = 0;
		};
	}, [footerHeight]);

	if (!sticky || animatedFooterPosition === undefined) {
		return (
			<View className={slots.footer({ className })} style={style} {...props}>
				{children}
			</View>
		);
	}

	return (
		<GorhomBottomSheetFooter animatedFooterPosition={animatedFooterPosition} bottomInset={0}>
			<Animated.View
				className={slots.stickyFooter({ className })}
				onLayout={handleLayout}
				style={[padding, style]}
				{...props}
			>
				{children}
			</Animated.View>
		</GorhomBottomSheetFooter>
	);
}
BottomSheetFooter.displayName = "DelacourUI.BottomSheet.Footer";
