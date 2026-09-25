import { Checkbox } from "@delacour/react-native-ui/checkbox";
import { Label } from "@delacour/react-native-ui/label";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A label that wraps",
	caption:
		"The asterisk is a nested run with a no-break space in front of it, so it follows the last word onto the last line instead of standing in a column at the right edge of the first.",
	capture: { align: "stretch" },
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			<Label isRequired>I confirm the account details above are correct and that I am authorised to open it</Label>
			<Checkbox testID="confirm">I confirm</Checkbox>
		</View>
	);
}
