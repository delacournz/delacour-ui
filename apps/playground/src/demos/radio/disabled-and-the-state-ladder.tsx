import { Field } from "@delacour/native-ui/field";
import { Radio } from "@delacour/native-ui/radio";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Disabled, and the state ladder",
	note: "Nearest wins: a group, then the radio's own prop, then the Field. A group that names nothing still lets one option disable itself; a group that disables everything cannot be escaped.",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-5">
			<View className="gap-2">
				<Text.Caption color="muted">A disabled group</Text.Caption>
				<Radio.Group accessibilityLabel="Disabled group" defaultSelected="a" isDisabled>
					<Radio testID="radio-group-a" value="a">
						First
					</Radio>
					<Radio testID="radio-group-b" value="b">
						Second
					</Radio>
				</Radio.Group>
			</View>
			<View className="gap-2">
				<Text.Caption color="muted">One disabled option</Text.Caption>
				<Radio.Group accessibilityLabel="One disabled option" defaultSelected="a">
					<Radio testID="radio-available" value="a">
						Available
					</Radio>
					<Radio isDisabled testID="radio-unavailable" value="b">
						Unavailable in your area
					</Radio>
				</Radio.Group>
			</View>
			<View className="gap-2">
				<Text.Caption color="muted">Opting out of a disabled Field</Text.Caption>
				<Field isDisabled>
					<Field.Label>Everything here is disabled</Field.Label>
					<Radio.Group accessibilityLabel="Field opt-out">
						<Radio testID="radio-field-a" value="a">
							Disabled by the field
						</Radio>
						<Radio isDisabled={false} testID="radio-field-b" value="b">
							Opted back in
						</Radio>
					</Radio.Group>
				</Field>
			</View>
		</View>
	);
}
