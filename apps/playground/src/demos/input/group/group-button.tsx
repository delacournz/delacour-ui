import { Field } from "@delacour/react-native-ui/field";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconCrossSmall, IconMagnifyingGlass } from "@delacour/react-native-ui/icons/central";
import { Input } from "@delacour/react-native-ui/input";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Group buttons",
	caption:
		"`Input.Group.Button` is sized one step below the box, squared when it holds only an icon, and disabled with the group without fading twice.",
	keyboardAware: true,
};

/** A search field whose clear button appears once there is something to clear. */
function SearchField(): ReactElement {
	const [value, setValue] = useState("");

	return (
		<Input.Group>
			<Input.Group.Prefix>
				<Icon icon={IconMagnifyingGlass} />
			</Input.Group.Prefix>
			<Input onChangeText={setValue} placeholder="Search" testID="group-button-search" value={value} />
			{value.length > 0 ? (
				<Input.Group.Button accessibilityLabel="Clear" onPress={() => setValue("")} testID="group-button-clear">
					<Icon icon={IconCrossSmall} />
				</Input.Group.Button>
			) : null}
		</Input.Group>
	);
}

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			<Field>
				<Field.Label>Clear</Field.Label>
				<SearchField />
			</Field>
			<Field>
				<Field.Label>Coupon</Field.Label>
				<Input.Group size="lg">
					<Input autoCapitalize="characters" placeholder="CODE" />
					<Input.Group.Button variant="secondary">Apply</Input.Group.Button>
				</Input.Group>
			</Field>
			<Field isDisabled>
				<Field.Label>Disabled</Field.Label>
				<Input.Group>
					<Input defaultValue="SPRING24" />
					<Input.Group.Button variant="secondary">Apply</Input.Group.Button>
				</Input.Group>
			</Field>
		</View>
	);
}
