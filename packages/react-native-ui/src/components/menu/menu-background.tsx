import type { ReactElement } from "react";
import { View, type ViewProps } from "react-native";
import { menuVariants } from "./menu.variants";

export type MenuBackgroundProps = ViewProps & { className?: string };

/**
 * The panel's surface: an absolute-fill layer in `bg-popover`, behind the rows.
 *
 * `Menu.Content` draws one by default. Pass your own as a child of
 * `Menu.Content` to repaint it — the content lifts it out of the children and
 * renders it outside the scroller, where it stays put while the rows scroll.
 */
export function MenuBackground({ className, ...props }: MenuBackgroundProps): ReactElement {
	return <View className={menuVariants().background({ className })} pointerEvents="none" {...props} />;
}
MenuBackground.displayName = "DelacourUI.Menu.Background";
