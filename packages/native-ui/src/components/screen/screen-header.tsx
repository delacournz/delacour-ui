import type { ReactElement } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ScreenInsetProps } from "./screen.types";
import { resolveScreenEdgePadding, screenVariants } from "./screen.variants";

export type ScreenHeaderProps = ScreenInsetProps;

/**
 * A titled block at the top of a screen's content, on the screen's own gutter.
 *
 * Two nested views rather than one: the safe-area padding and the header's own
 * padding are different concerns, and collapsing them would make
 * `insets={["top"]}` silently replace the top padding instead of adding to it.
 *
 * Scrolls with the content — it is passed to a scrollable's `header` prop, not
 * pinned. `Screen.Navbar` is the pinned one.
 */
export function ScreenHeader({ insets, className, children, style, ...props }: ScreenHeaderProps): ReactElement {
	const safeArea = useSafeAreaInsets();

	return (
		<View style={resolveScreenEdgePadding(insets, safeArea)}>
			<View className={screenVariants().header({ className })} style={style} {...props}>
				{children}
			</View>
		</View>
	);
}
