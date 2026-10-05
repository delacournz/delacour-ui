import { Field } from "@delacour/react-native-ui/field";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconMagnifyingGlass, IconPercent } from "@delacour/react-native-ui/icons/central";
import { Input } from "@delacour/react-native-ui/input";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Decorative",
	caption:
		"A decorator holding only text or an `Icon` is decorative: screen readers skip it and a tap on it focuses the field. Name the field itself with an `accessibilityLabel` when the affix carries meaning.",
	keyboardAware: true,
};

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			<Field>
				<Field.Label>Search</Field.Label>
				<Input.Group>
					<Input.Group.Prefix>
						<Icon icon={IconMagnifyingGlass} />
					</Input.Group.Prefix>
					<Input placeholder="Components" testID="decorative-search" />
				</Input.Group>
			</Field>
			<Field>
				<Field.Label>Discount</Field.Label>
				<Input.Group>
					<Input accessibilityLabel="Discount, percent" inputMode="decimal" placeholder="0" />
					<Input.Group.Suffix>
						<Icon icon={IconPercent} />
					</Input.Group.Suffix>
				</Input.Group>
			</Field>
		</View>
	);
}
