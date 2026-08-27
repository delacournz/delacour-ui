import type { BottomSheetBackgroundProps as GorhomBottomSheetBackgroundProps } from "@gorhom/bottom-sheet";
import type { ReactElement } from "react";
import { View } from "react-native";
import { bottomSheetVariants } from "./bottom-sheet.variants";

export type BottomSheetBackgroundProps = Partial<GorhomBottomSheetBackgroundProps> & {
	className?: string;
};

/**
 * The sheet's own surface, drawn behind the handle and the content.
 *
 * Supplied to gorhom as `backgroundComponent` rather than styled through
 * `backgroundStyle`, so the surface is a className like every other surface in
 * this package — and so `backgroundClassName` on `BottomSheet.Container` has
 * something to reach. A `backgroundStyle` a caller passes still arrives, merged
 * into the `style` below.
 *
 * **Forwarding `style` is load-bearing.** gorhom hands this component
 * `[StyleSheet.absoluteFill, backgroundStyle]`; drop it and the surface collapses
 * to nothing and the sheet renders transparent over the app.
 *
 * The two animated variables are destructured off rather than spread: they are
 * shared values, and a `View` has no use for either.
 */
export function BottomSheetBackground({
	animatedIndex: _animatedIndex,
	animatedPosition: _animatedPosition,
	className,
	style,
	...props
}: BottomSheetBackgroundProps): ReactElement {
	return <View className={bottomSheetVariants().background({ className })} style={style} {...props} />;
}
BottomSheetBackground.displayName = "DelacourUI.BottomSheet.Background";
