import { Input } from "@delacour/react-native-ui/input";
import { Label } from "@delacour/react-native-ui/label";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Restyling the mark",
	caption:
		"`requiredMarkClassName` is merged last, so a form that marks every field can quieten its asterisks to the muted token. Either way it is announced as “required”, never as a star.",
	keyboardAware: true,
};

export function Demo(): ReactElement {
	return (
		<View className="gap-5">
			<View className="gap-1.5">
				<Label isRequired requiredMarkClassName="text-muted-foreground">
					First name
				</Label>
				<Input placeholder="Ada" />
			</View>
			<View className="gap-1.5">
				<Label isRequired requiredMarkClassName="text-muted-foreground">
					Last name
				</Label>
				<Input placeholder="Lovelace" />
			</View>
		</View>
	);
}
