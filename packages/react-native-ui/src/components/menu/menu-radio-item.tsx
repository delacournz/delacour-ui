import type { ReactElement } from "react";
import { View } from "react-native";
import { IconCheckmark1 } from "../../icons/central";
import { Icon } from "../icon";
import { useMenuRadioGroupPart } from "./menu.context";
import type { MenuItemProps } from "./menu.types";
import {
	MENU_INDICATOR_TOKEN,
	type MenuRadioIndicator,
	menuVariants,
	resolveMenuItemAccessibility,
} from "./menu.variants";
import { MenuRow } from "./menu-item";

export type MenuRadioItemProps = Omit<MenuItemProps, "onSelect"> & {
	value: string;
	/** A tick, or a 6pt dot. Default `check`. */
	indicator?: MenuRadioIndicator;
};

/**
 * One option in a `Menu.RadioGroup`, marked in the icon column while selected.
 *
 * Closes the menu on select by default — a choice made is a visit finished.
 * The mark takes the leading column, so an `icon` moves to the row's end.
 * Announced as `selected`.
 */
export function MenuRadioItem({
	value,
	indicator = "check",
	isDisabled = false,
	...props
}: MenuRadioItemProps): ReactElement {
	const group = useMenuRadioGroupPart("Menu.RadioItem");
	const isSelected = group.value === value;
	const slots = menuVariants();

	const mark =
		indicator === "dot" ? (
			<View className={slots.indicatorDot()} />
		) : (
			<Icon className={slots.itemIcon()} color={MENU_INDICATOR_TOKEN} icon={IconCheckmark1} />
		);

	return (
		<MenuRow
			accessibilityState={resolveMenuItemAccessibility({ isDisabled, isSelected, kind: "radio" })}
			isDisabled={isDisabled}
			kind="radio"
			leading={<View className={slots.indicator()}>{isSelected ? mark : null}</View>}
			onSelect={() => group.select(value)}
			{...props}
			iconPlacement="trailing"
		/>
	);
}
MenuRadioItem.displayName = "DelacourUI.Menu.RadioItem";
