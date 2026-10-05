import { type ReactElement, useMemo } from "react";
import { View, type ViewProps } from "react-native";
import { useControllableState } from "../../hooks/use-controllable-state";
import { type MenuRadioGroupContextValue, MenuRadioGroupProvider } from "./menu.context";
import { resolveRadioNext } from "./menu.variants";

export type MenuRadioGroupProps = ViewProps & {
	value?: string;
	defaultValue?: string;
	onValueChange?: (value: string) => void;
};

/**
 * One choice from several, as rows. Holds the value; `Menu.RadioItem` rows read it.
 *
 * @example
 * <Menu.RadioGroup value={density} onValueChange={setDensity}>
 *   <Menu.RadioItem value="comfortable">Comfortable</Menu.RadioItem>
 *   <Menu.RadioItem value="compact">Compact</Menu.RadioItem>
 * </Menu.RadioGroup>
 */
export function MenuRadioGroup({
	value: valueProp,
	defaultValue,
	onValueChange,
	children,
	...props
}: MenuRadioGroupProps): ReactElement {
	const [value, setValue] = useControllableState<string | undefined>({
		defaultValue,
		onChange: (next) => {
			if (next !== undefined) onValueChange?.(next);
		},
		value: valueProp,
	});

	const context = useMemo<MenuRadioGroupContextValue>(
		() => ({ select: (next) => setValue(resolveRadioNext(value, next)), value }),
		[setValue, value]
	);

	return (
		<MenuRadioGroupProvider value={context}>
			<View accessibilityRole="radiogroup" {...props}>
				{children}
			</View>
		</MenuRadioGroupProvider>
	);
}
MenuRadioGroup.displayName = "DelacourUI.Menu.RadioGroup";
