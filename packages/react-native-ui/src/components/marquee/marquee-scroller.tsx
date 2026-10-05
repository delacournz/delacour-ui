import type { ReactElement } from "react";
import { ScrollView, View } from "react-native";
import type { MarqueeStripProps } from "./marquee.types";

/**
 * The still strip shown under calm motion — the OS reduce-motion setting, or
 * `DelacourProvider`'s `isMotionCalm`.
 *
 * One copy, no duplicates, in a scroll view the reader can drag by hand, so
 * nothing the moving strip would have shown is out of reach. No indicator: the
 * content running off the edge already says there is more.
 */
export function MarqueeScroller({ children, axis, copyClassName, isContentHidden }: MarqueeStripProps): ReactElement {
	const isHorizontal = axis === "horizontal";

	return (
		<ScrollView
			accessibilityElementsHidden={isContentHidden}
			className="flex-1"
			horizontal={isHorizontal}
			importantForAccessibility={isContentHidden ? "no-hide-descendants" : "auto"}
			showsHorizontalScrollIndicator={false}
			showsVerticalScrollIndicator={false}
		>
			<View className={copyClassName}>{children}</View>
		</ScrollView>
	);
}
MarqueeScroller.displayName = "DelacourUI.Marquee.Scroller";
