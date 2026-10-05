import { type ReactElement, type ReactNode, useCallback, useState } from "react";
import { type LayoutChangeEvent, StyleSheet, View, type ViewProps } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useMenuSubPart } from "./menu.context";
import { menuVariants } from "./menu.variants";

export type MenuSubContentProps = Omit<ViewProps, "style"> & {
	className?: string;
	children?: ReactNode;
};

/**
 * The rows a `Menu.Sub` discloses, expanding in place.
 *
 * `Collapsible.Content`'s measured clip: the outer view's height runs from zero
 * to what the out-of-flow inner view reported, so the rows below follow through
 * ordinary layout and the panel's scroller sees the new height. The rows mount
 * on first open; a closed submenu leaves the accessibility tree and takes no
 * touches.
 */
export function MenuSubContent({ className, children, ...props }: MenuSubContentProps): ReactElement {
	const { contentHeight, isOpen, onMeasured, progress } = useMenuSubPart("Menu.SubContent");
	const slots = menuVariants();

	const [hasOpened, setHasOpened] = useState(isOpen);
	if (isOpen && !hasOpened) setHasOpened(true);

	const [isMeasured, setMeasured] = useState(false);

	const handleLayout = useCallback(
		(event: LayoutChangeEvent) => {
			contentHeight.value = event.nativeEvent.layout.height;
			if (isMeasured) return;
			setMeasured(true);
			onMeasured();
		},
		[contentHeight, isMeasured, onMeasured]
	);

	const clipStyle = useAnimatedStyle(() => ({
		height: progress.value * Math.max(contentHeight.value, 0),
		opacity: progress.value,
	}));

	return (
		<Animated.View
			accessibilityElementsHidden={!isOpen}
			className={slots.subClip()}
			importantForAccessibility={isOpen ? "auto" : "no-hide-descendants"}
			pointerEvents={isOpen && isMeasured ? "auto" : "none"}
			style={isMeasured ? clipStyle : subContentStyles.measuring}
		>
			{hasOpened ? (
				<View className={slots.subInner()} onLayout={handleLayout}>
					<View className={slots.subContent({ className })} {...props}>
						{children}
					</View>
				</View>
			) : null}
		</Animated.View>
	);
}
MenuSubContent.displayName = "DelacourUI.Menu.SubContent";

const subContentStyles = StyleSheet.create({
	/**
	 * Out of flow and transparent until the rows report a height — never
	 * `height: 0`, because a child mounted into a zero-height parent never fires
	 * `onLayout`. `Collapsible.Content` carries the same sheet.
	 */
	measuring: { left: 0, opacity: 0, position: "absolute", right: 0, top: 0 },
});
