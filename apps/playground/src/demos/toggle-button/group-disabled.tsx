import { ToggleButton } from "@delacour/react-native-ui/toggle-button";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Disabled in a group",
	caption:
		"A group's `isDisabled` is a default, not an override: one option can disable itself inside a live group, and one can opt back out of a disabled one.",
	align: "center",
};

export function Demo(): ReactElement {
	return (
		<View className="items-center gap-4">
			<ToggleButton.Group
				className="self-center"
				defaultSelected={["standard"]}
				selectionMode="single"
				testID="shipping-group"
				variant="outline"
			>
				<ToggleButton testID="shipping-standard" value="standard">
					Standard
				</ToggleButton>
				<ToggleButton testID="shipping-express" value="express">
					Express
				</ToggleButton>
				<ToggleButton isDisabled testID="shipping-overnight" value="overnight">
					Overnight
				</ToggleButton>
			</ToggleButton.Group>
			<ToggleButton.Group className="self-center" defaultSelected={["a"]} isDisabled testID="locked-group">
				<ToggleButton testID="locked-a" value="a">
					Locked
				</ToggleButton>
				<ToggleButton testID="locked-b" value="b">
					Locked
				</ToggleButton>
				<ToggleButton isDisabled={false} testID="locked-c" value="c">
					Opted out
				</ToggleButton>
			</ToggleButton.Group>
		</View>
	);
}
