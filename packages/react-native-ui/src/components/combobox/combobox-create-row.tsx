import type { ReactElement } from "react";
import { View } from "react-native";
import { IconPlusSmall } from "../../icons/central";
import { Icon } from "../icon";
import type { InputSize } from "../input/input.variants";
import { Pressable } from "../pressable";
import { selectVariants } from "../select/select.variants";
import { Text } from "../text";
import { comboboxVariants } from "./combobox.variants";

export type ComboboxCreateRowProps = {
	/** The typed text, trimmed — what becomes the value. */
	query: string;
	/** What the row reads. */
	label: string;
	onPress: (query: string) => void;
	size: InputSize;
	isDisabled?: boolean;
	testID?: string;
};

/**
 * The row that accepts typed text as a value of its own — `Use “Fiji”`.
 *
 * Select's row slot and label slot, so it is the height and type of the
 * options beneath it, with a leading plus where an option would show its icon.
 * A screen reader hears a button, "Add Fiji".
 *
 * Internal; not on the index.
 */
export function ComboboxCreateRow({
	query,
	label,
	onPress,
	size,
	isDisabled = false,
	testID,
}: ComboboxCreateRowProps): ReactElement {
	const row = selectVariants({ isDisabled, size });
	const own = comboboxVariants({ size });

	return (
		<Pressable
			accessibilityLabel={`Add ${query}`}
			accessibilityRole="button"
			className={row.row({ className: own.createRow() })}
			disabled={isDisabled}
			feedback="fade"
			haptic="selection"
			onPress={() => onPress(query)}
			testID={testID}
		>
			<Icon className={row.rowIcon()} color="primary" icon={IconPlusSmall} />
			<View className={row.rowContent()}>
				<Text className={row.rowLabel({ className: own.createLabel() })} numberOfLines={2}>
					{label}
				</Text>
			</View>
		</Pressable>
	);
}
ComboboxCreateRow.displayName = "DelacourUI.Combobox.CreateRow";
