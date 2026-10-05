import type { ReactElement } from "react";
import { View } from "react-native";
import { useControllableState } from "../../hooks/use-controllable-state";
import { IconCheckmark1 } from "../../icons/central";
import { Icon } from "../icon";
import type { MenuItemProps } from "./menu.types";
import { MENU_INDICATOR_TOKEN, menuVariants, resolveMenuItemAccessibility } from "./menu.variants";
import { MenuRow } from "./menu-item";

export type MenuCheckboxItemProps = Omit<MenuItemProps, "onSelect" | "isClosedOnSelect"> & {
	isChecked?: boolean;
	defaultChecked?: boolean;
	onCheckedChange?: (isChecked: boolean) => void;
	/** Whether choosing the row closes the menu. Default `false` — several are usually toggled in one visit. */
	isClosedOnSelect?: boolean;
};

/**
 * A row that toggles a setting, with a tick in the icon column while it is on.
 *
 * Stays open on select by default. The tick takes the leading column, so an
 * `icon` moves to the row's end. Announced as `checked`.
 *
 * @example
 * <Menu.CheckboxItem isChecked={showDone} onCheckedChange={setShowDone}>Completed</Menu.CheckboxItem>
 */
export function MenuCheckboxItem({
	isChecked: isCheckedProp,
	defaultChecked = false,
	onCheckedChange,
	isDisabled = false,
	...props
}: MenuCheckboxItemProps): ReactElement {
	const [isChecked, setChecked] = useControllableState<boolean>({
		defaultValue: defaultChecked,
		onChange: onCheckedChange,
		value: isCheckedProp,
	});
	const slots = menuVariants();

	return (
		<MenuRow
			accessibilityState={resolveMenuItemAccessibility({ isChecked, isDisabled, kind: "checkbox" })}
			isDisabled={isDisabled}
			kind="checkbox"
			leading={
				<View className={slots.indicator()}>
					{isChecked ? <Icon className={slots.itemIcon()} color={MENU_INDICATOR_TOKEN} icon={IconCheckmark1} /> : null}
				</View>
			}
			onSelect={() => setChecked(!isChecked)}
			{...props}
			iconPlacement="trailing"
		/>
	);
}
MenuCheckboxItem.displayName = "DelacourUI.Menu.CheckboxItem";
