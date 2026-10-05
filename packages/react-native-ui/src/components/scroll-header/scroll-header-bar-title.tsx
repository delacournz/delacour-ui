import type { ReactElement } from "react";
import { useAnimatedStyle } from "react-native-reanimated";
import { Text, type TextProps } from "../text";
import { useScrollHeaderPart } from "./scroll-header.context";
import { resolveBarTitleOpacity, scrollHeaderVariants } from "./scroll-header.variants";

export type ScrollHeaderBarTitleProps = Omit<TextProps, "children"> & {
	children: string;
	className?: string;
};

/**
 * The bar's title — the compact half of the crossfade, fading in as the Large block leaves.
 *
 * **Hidden from assistive technology while the header is open.** At rest it repeats the large
 * title, and a screen reader would announce the screen's name twice; it is revealed once the
 * header has collapsed and the Large block is hidden in turn. With no Large block there is
 * nothing to crossfade with, so it is always drawn and always announced.
 *
 * A string only: a bar title is one line of text, and anything richer is a child of the bar.
 */
export function ScrollHeaderBarTitle({
	className,
	children,
	style,
	...props
}: ScrollHeaderBarTitleProps): ReactElement {
	const { progress, hasLarge, isCollapsed } = useScrollHeaderPart("ScrollHeader.BarTitle");
	const isHidden = hasLarge && !isCollapsed;

	const opacityStyle = useAnimatedStyle(() => ({
		opacity: hasLarge ? resolveBarTitleOpacity(progress.value) : 1,
	}));

	return (
		<Text
			accessibilityElementsHidden={isHidden}
			accessibilityRole="header"
			className={scrollHeaderVariants().barTitle({ className })}
			importantForAccessibility={isHidden ? "no-hide-descendants" : "auto"}
			numberOfLines={1}
			style={[style, opacityStyle]}
			{...props}
		>
			{children}
		</Text>
	);
}
ScrollHeaderBarTitle.displayName = "DelacourUI.ScrollHeader.BarTitle";
