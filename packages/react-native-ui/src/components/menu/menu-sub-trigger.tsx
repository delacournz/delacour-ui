import type { ReactElement } from "react";
import { I18nManager, View } from "react-native";
import Animated, { interpolate, useAnimatedStyle } from "react-native-reanimated";
import { IconChevronRight } from "../../icons/central";
import { Icon } from "../icon";
import { useMenuSubPart } from "./menu.context";
import type { MenuItemProps } from "./menu.types";
import { MENU_INDICATOR_TOKEN, MENU_SUB_ROTATION, menuVariants, resolveMenuItemAccessibility } from "./menu.variants";
import { MenuRow } from "./menu-item";

export type MenuSubTriggerProps = Omit<MenuItemProps, "onSelect" | "isClosedOnSelect" | "trailing">;

/**
 * The row that expands a `Menu.Sub`. Never closes the menu.
 *
 * Its chevron points to the trailing edge and turns 90° to point down as the
 * rows open, off the submenu's own `progress`, so it and the height cannot drift.
 * Under RTL the chevron is mirrored on a wrapper view, so it points left and
 * still turns down. Announced as `expanded`.
 */
export function MenuSubTrigger({ isDisabled = false, ...props }: MenuSubTriggerProps): ReactElement {
	const { isOpen, progress, toggle } = useMenuSubPart("Menu.SubTrigger");
	const slots = menuVariants();
	const collapsed = MENU_SUB_ROTATION.collapsed;
	const expanded = MENU_SUB_ROTATION.expanded;

	const rotationStyle = useAnimatedStyle(() => ({
		transform: [{ rotate: `${interpolate(progress.value, [0, 1], [collapsed, expanded])}deg` }],
	}));

	return (
		<MenuRow
			accessibilityState={resolveMenuItemAccessibility({ isDisabled, isExpanded: isOpen, kind: "sub-trigger" })}
			isDisabled={isDisabled}
			kind="sub-trigger"
			onSelect={toggle}
			trailing={
				<View className={slots.indicator()} style={I18nManager.isRTL ? mirrored : undefined}>
					<Animated.View style={rotationStyle}>
						<Icon className={slots.itemIcon()} color={MENU_INDICATOR_TOKEN} icon={IconChevronRight} />
					</Animated.View>
				</View>
			}
			{...props}
		/>
	);
}
MenuSubTrigger.displayName = "DelacourUI.Menu.SubTrigger";

const mirrored = { transform: [{ scaleX: -1 }] };
