import { Checkbox } from "@delacour/react-native-ui/checkbox";
import { Input } from "@delacour/react-native-ui/input";
import { Label } from "@delacour/react-native-ui/label";
import { Separator } from "@delacour/react-native-ui/separator";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Toggle the states",
	caption:
		"Each checkbox drives one prop. Turn them on together to see that they compose: the asterisk stays destructive whatever the label is doing, and fades with it.",
	keyboardAware: true,
};

export function Demo(): ReactElement {
	const [isRequired, setIsRequired] = useState(true);
	const [isInvalid, setIsInvalid] = useState(false);
	const [isDisabled, setIsDisabled] = useState(false);

	return (
		<View className="gap-6">
			<View className="gap-1.5">
				<Label isDisabled={isDisabled} isInvalid={isInvalid} isRequired={isRequired} testID="label">
					Email
				</Label>
				<Input isDisabled={isDisabled} isInvalid={isInvalid} placeholder="you@example.com" />
			</View>

			<Separator />

			<View className="gap-3">
				<Checkbox isChecked={isRequired} onCheckedChange={setIsRequired} testID="toggle-required">
					Required
				</Checkbox>
				<Checkbox isChecked={isInvalid} onCheckedChange={setIsInvalid} testID="toggle-invalid">
					Invalid
				</Checkbox>
				<Checkbox isChecked={isDisabled} onCheckedChange={setIsDisabled} testID="toggle-disabled">
					Disabled
				</Checkbox>
			</View>
		</View>
	);
}
