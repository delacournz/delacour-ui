import { Field } from "delacour-react-native-ui/field";
import { Icon } from "delacour-react-native-ui/icon";
import { IconMagnifyingGlass } from "delacour-react-native-ui/icons/central";
import { Input } from "delacour-react-native-ui/input";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Side by side",
	caption:
		"The same box, drawn twice. Height, radius, border, background and gutters should be indistinguishable — any difference here is the design failing at the one thing it exists to guarantee.",
	keyboardAware: true,
};

export function Demo(): ReactElement {
	return (
		<View className="gap-4">
			<Field>
				<Field.Label>On its own</Field.Label>
				<Input placeholder="A lone field" />
			</Field>
			<Field>
				<Field.Label>In a group</Field.Label>
				<Input.Group>
					<Input.Group.Prefix>
						<Icon icon={IconMagnifyingGlass} />
					</Input.Group.Prefix>
					<Input placeholder="A grouped field" />
				</Input.Group>
			</Field>
		</View>
	);
}
