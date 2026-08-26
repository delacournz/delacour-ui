import { Checkbox } from "@delacour/native-ui/checkbox";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Invalid and disabled",
	caption:
		"Invalid outranks the colour, so a rejected value stays legible while it is being corrected. Disabled fades the whole row, label included.",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			<Checkbox color="success" defaultChecked isInvalid testID="checkbox-invalid-checked">
				<Checkbox.Label>Invalid beats success</Checkbox.Label>
			</Checkbox>
			<Checkbox isInvalid testID="checkbox-invalid">
				<Checkbox.Label>Invalid and unticked</Checkbox.Label>
			</Checkbox>
			<Checkbox color="primary" defaultChecked isDisabled testID="checkbox-disabled">
				<Checkbox.Label>Disabled and ticked</Checkbox.Label>
			</Checkbox>
			<Checkbox.Group defaultChecked={["x"]} isDisabled>
				<Checkbox testID="checkbox-x" value="x">
					<Checkbox.Label>Disabled by the group</Checkbox.Label>
				</Checkbox>
				<Checkbox isDisabled={false} testID="checkbox-y" value="y">
					<Checkbox.Label>Opted back out of it</Checkbox.Label>
				</Checkbox>
			</Checkbox.Group>
		</View>
	);
}
